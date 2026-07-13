"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "@/lib/eden";
import {
  appendLocalSession,
  applyLocalReview,
  type LocalFlashcardProgress,
  loadLocalProgress,
  localStates,
  mergeServerStates,
  saveLocalProgress,
  updateLocalPreferences,
} from "@/lib/flashcards/local-progress";
import { buildFlashcardQueue } from "@/server/services/flashcard-queue";
import { ratingToConfidence } from "@/server/services/flashcard-srs";
import type {
  FlashcardDeckView,
  FlashcardQueueItem,
  FlashcardQueueSummary,
  FlashcardReviewRating,
  FlashcardStudyPreferences,
  FlashcardUserCardStateView,
} from "@/types/flashcard-platform";

type StudyPhase = "loading" | "ready" | "studying" | "complete";

interface UseAdaptiveFlashcardOptions {
  deck: FlashcardDeckView;
  isAuthenticated: boolean;
  onPhaseChange?: (phase: "not_started" | "in_progress" | "completed") => void;
}

function queueFromLocal(
  deck: FlashcardDeckView,
  progress: LocalFlashcardProgress,
  seed: string,
  mode = progress.preferences.studyMode,
) {
  return buildFlashcardQueue({
    cards: deck.cards,
    states: localStates(progress),
    mode,
    seed,
    now: new Date(),
    newCardsLimit: progress.preferences.newCardsPerDay ?? deck.newCardsPerDay,
    reviewLimit: progress.preferences.maxReviewsPerDay ?? deck.maxReviewsPerDay,
  });
}

export function useAdaptiveFlashcard({
  deck,
  isAuthenticated,
  onPhaseChange,
}: UseAdaptiveFlashcardOptions) {
  const [phase, setPhase] = useState<StudyPhase>("loading");
  const [progress, setProgress] = useState<LocalFlashcardProgress | null>(null);
  const [items, setItems] = useState<FlashcardQueueItem[]>([]);
  const [summary, setSummary] = useState<FlashcardQueueSummary | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [awaitingAdvance, setAwaitingAdvance] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionSeed, setSessionSeed] = useState("");
  const [sessionReviews, setSessionReviews] = useState<
    Array<{ cardId: string; rating: FlashcardReviewRating }>
  >([]);
  const [syncState, setSyncState] = useState<
    "idle" | "syncing" | "saved" | "offline"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const startedAtRef = useRef(Date.now());
  const cardStartedAtRef = useRef(Date.now());
  const preferencesHydratedRef = useRef<string | null>(null);
  const reviewSyncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingSyncCountRef = useRef(0);
  const syncFailedRef = useRef(false);

  const persist = useCallback((next: LocalFlashcardProgress) => {
    setProgress(next);
    saveLocalProgress(next);
  }, []);

  const updatePersistedProgress = useCallback(
    (update: (current: LocalFlashcardProgress) => LocalFlashcardProgress) => {
      setProgress((current) => {
        if (!current) return current;
        const next = update(current);
        saveLocalProgress(next);
        return next;
      });
    },
    [],
  );

  const syncLocalReviews = useCallback(
    async (current: LocalFlashcardProgress) => {
      if (!isAuthenticated) return current;
      const pending = current.reviews.filter((review) => !review.synced);
      if (pending.length === 0) return current;
      setSyncState("syncing");
      try {
        const response = await apiClient.api.flashcards
          .learning({ deckId: deck.id })
          .sync.post({
            reviews: pending.map(({ synced: _synced, ...review }) => review),
          });
        if (response.error || !response.data?.success) {
          throw new Error("Progress sync failed");
        }
        const syncData = response.data.data;
        if (!syncData) throw new Error("Progress sync returned no data");
        const syncedIds = new Set(
          pending.map((review) => review.clientReviewId),
        );
        const next = mergeServerStates(
          current,
          syncData.states as FlashcardUserCardStateView[],
          syncedIds,
        );
        persist(next);
        syncFailedRef.current = false;
        setSyncState("saved");
        return next;
      } catch {
        setSyncState("offline");
        return current;
      }
    },
    [deck.id, isAuthenticated, persist],
  );

  useEffect(() => {
    const loaded = loadLocalProgress(deck.id, deck.version);
    setProgress(loaded);
    const preview = queueFromLocal(deck, loaded, crypto.randomUUID());
    setSummary(preview.summary);
    setPhase("ready");
  }, [deck]);

  useEffect(() => {
    if (
      !progress ||
      !isAuthenticated ||
      phase === "loading" ||
      phase === "studying" ||
      sessionId
    ) {
      return;
    }
    void syncLocalReviews(progress);
  }, [isAuthenticated, phase, progress, sessionId, syncLocalReviews]);

  useEffect(() => {
    if (!progress || !isAuthenticated) return;
    const hydrationKey = `${deck.id}:${progress.updatedAt}`;
    if (preferencesHydratedRef.current === hydrationKey) return;
    preferencesHydratedRef.current = hydrationKey;
    const hydratePreferences = async () => {
      try {
        const hasUnsyncedLearning = progress.reviews.some(
          (review) => !review.synced,
        );
        const response = hasUnsyncedLearning
          ? await apiClient.api.flashcards
              .learning({ deckId: deck.id })
              .preferences.patch(progress.preferences)
          : await apiClient.api.flashcards
              .learning({ deckId: deck.id })
              .preferences.get();
        if (response.error || !response.data?.success || !response.data.data) {
          return;
        }
        persist(updateLocalPreferences(progress, response.data.data));
      } catch {
        setSyncState("offline");
      }
    };
    void hydratePreferences();
  }, [deck.id, isAuthenticated, persist, progress]);

  useEffect(() => {
    onPhaseChange?.(
      phase === "complete"
        ? "completed"
        : phase === "studying"
          ? "in_progress"
          : "not_started",
    );
  }, [onPhaseChange, phase]);

  const start = useCallback(async () => {
    if (!progress || isStarting) return;
    setIsStarting(true);
    setError(null);
    const seed = crypto.randomUUID();
    setSessionSeed(seed);
    let currentProgress = progress;
    if (isAuthenticated) {
      currentProgress = await syncLocalReviews(progress);
    }

    let nextQueue = queueFromLocal(deck, currentProgress, seed);
    if (nextQueue.items.length === 0) {
      nextQueue = queueFromLocal(deck, currentProgress, seed, "random");
    }
    if (isAuthenticated) {
      try {
        const [queueResponse, sessionResponse] = await Promise.all([
          apiClient.api.flashcards.learning({ deckId: deck.id }).queue.get({
            query: { seed, mode: currentProgress.preferences.studyMode },
          }),
          apiClient.api.flashcards({ deckId: deck.id }).sessions.post({
            metadata: {
              mode: currentProgress.preferences.studyMode,
              seed,
            },
          }),
        ]);
        const queueData =
          !queueResponse.error && queueResponse.data?.success
            ? queueResponse.data.data
            : undefined;
        if (queueData) {
          nextQueue =
            queueData.items.length > 0
              ? queueData
              : queueFromLocal(deck, currentProgress, seed, "random");
          const merged = mergeServerStates(
            currentProgress,
            nextQueue.items
              .map((item) => item.state)
              .filter((state): state is FlashcardUserCardStateView =>
                Boolean(state),
              ),
            new Set(),
          );
          currentProgress = merged;
          persist(merged);
        }
        const sessionData =
          !sessionResponse.error && sessionResponse.data?.success
            ? sessionResponse.data.data
            : undefined;
        if (sessionData) {
          setSessionId(sessionData.id);
        }
      } catch {
        setSyncState("offline");
      }
    }

    setItems(nextQueue.items);
    setSummary(nextQueue.summary);
    setCurrentIndex(0);
    setSessionReviews([]);
    setIsRevealed(false);
    setHintVisible(false);
    setAwaitingAdvance(false);
    startedAtRef.current = Date.now();
    cardStartedAtRef.current = Date.now();
    setPhase(nextQueue.items.length === 0 ? "complete" : "studying");
    setIsStarting(false);
  }, [deck, isAuthenticated, isStarting, persist, progress, syncLocalReviews]);

  const finish = useCallback(
    async (
      reviews = sessionReviews,
      currentProgress: LocalFlashcardProgress | null = progress,
    ) => {
      if (!currentProgress) return;
      const completedAt = new Date();
      const timeSpentSeconds = Math.max(
        1,
        Math.round((completedAt.getTime() - startedAtRef.current) / 1000),
      );
      const next = appendLocalSession(currentProgress, {
        id: sessionSeed || crypto.randomUUID(),
        startedAt: new Date(startedAtRef.current).toISOString(),
        completedAt: completedAt.toISOString(),
        cardsStudied: reviews.length,
        correctCount: reviews.filter((review) => review.rating !== "again")
          .length,
        timeSpentSeconds,
      });
      persist(next);
      setPhase("complete");
      if (isAuthenticated && sessionId) {
        const completingSessionId = sessionId;
        setSyncState("syncing");
        reviewSyncQueueRef.current = reviewSyncQueueRef.current
          .catch(() => undefined)
          .then(async () => {
            const response = await apiClient.api.flashcards
              .sessions({ sessionId })
              .complete.post({ timeSpentSeconds });
            if (response.error || !response.data?.success) {
              throw new Error("Session could not be completed");
            }
            setSyncState(syncFailedRef.current ? "offline" : "saved");
          })
          .catch(() => {
            syncFailedRef.current = true;
            setSyncState("offline");
          })
          .finally(() => {
            setSessionId((current) =>
              current === completingSessionId ? null : current,
            );
          });
      }
    },
    [
      isAuthenticated,
      persist,
      progress,
      sessionId,
      sessionReviews,
      sessionSeed,
    ],
  );

  const advance = useCallback(
    async (
      shouldRepeat = false,
      reviews = sessionReviews,
      currentProgress: LocalFlashcardProgress | null = progress,
    ) => {
      if (currentIndex + 1 >= items.length && !shouldRepeat) {
        await finish(reviews, currentProgress);
        return;
      }
      setCurrentIndex((index) => index + 1);
      setIsRevealed(false);
      setHintVisible(false);
      setAwaitingAdvance(false);
      cardStartedAtRef.current = Date.now();
    },
    [currentIndex, finish, items.length, progress, sessionReviews],
  );

  const enqueueReviewSync = useCallback(
    (review: {
      clientReviewId: string;
      cardId: string;
      rating: FlashcardReviewRating;
      confidence: number;
      studyMode: FlashcardStudyPreferences["studyMode"];
      responseMs: number;
      reviewedAt: string;
    }) => {
      if (!isAuthenticated || !sessionId) return;

      pendingSyncCountRef.current += 1;
      setSyncState("syncing");

      reviewSyncQueueRef.current = reviewSyncQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          const response = await apiClient.api.flashcards
            .sessions({ sessionId })
            .review.patch({ ...review });
          if (response.error || !response.data?.success) {
            throw new Error("Review could not be saved");
          }
          const responseData = response.data.data;
          if (!responseData) throw new Error("Review returned no schedule");

          updatePersistedProgress((current) => {
            const hasNewerPendingReview = current.reviews.some(
              (candidate) =>
                !candidate.synced &&
                candidate.cardId === review.cardId &&
                candidate.reviewedAt > review.reviewedAt,
            );
            return mergeServerStates(
              current,
              !hasNewerPendingReview && responseData.scheduledState
                ? [responseData.scheduledState as FlashcardUserCardStateView]
                : [],
              new Set([review.clientReviewId]),
            );
          });
        })
        .catch(() => {
          syncFailedRef.current = true;
        })
        .finally(() => {
          pendingSyncCountRef.current = Math.max(
            0,
            pendingSyncCountRef.current - 1,
          );
          if (pendingSyncCountRef.current === 0) {
            setSyncState(syncFailedRef.current ? "offline" : "saved");
          }
        });
    },
    [isAuthenticated, sessionId, updatePersistedProgress],
  );

  const rate = useCallback(
    async (rating: FlashcardReviewRating) => {
      const current = items[currentIndex];
      if (!current || !progress || !isRevealed || awaitingAdvance) return;
      const reviewedAt = new Date().toISOString();
      const clientReviewId = crypto.randomUUID();
      const confidence = ratingToConfidence(
        rating,
        progress.preferences.confidenceScale,
      );
      const responseMs = Date.now() - cardStartedAtRef.current;
      const review = {
        clientReviewId,
        cardId: current.card.id,
        rating,
        confidence,
        studyMode: progress.preferences.studyMode,
        responseMs,
        reviewedAt,
      };
      const nextProgress = applyLocalReview(progress, deck, review);
      persist(nextProgress);
      const nextReviews = [
        ...sessionReviews,
        { cardId: current.card.id, rating },
      ];
      setSessionReviews(nextReviews);
      setAwaitingAdvance(true);

      const shouldRepeat = rating === "again" || rating === "hard";
      if (shouldRepeat) {
        setItems((currentItems) => {
          const insertionIndex = Math.min(
            currentIndex + 4,
            currentItems.length,
          );
          const copy = [...currentItems];
          copy.splice(insertionIndex, 0, {
            ...current,
            state:
              localStates(nextProgress).find(
                (state) => state.cardId === current.card.id,
              ) ?? current.state,
            kind: "due",
            priority: current.priority + 1,
          });
          return copy;
        });
      }

      if (progress.preferences.autoAdvance) {
        void advance(shouldRepeat, nextReviews, nextProgress);
      }
      enqueueReviewSync(review);
    },
    [
      advance,
      awaitingAdvance,
      currentIndex,
      deck,
      enqueueReviewSync,
      isRevealed,
      items,
      persist,
      progress,
      sessionReviews,
    ],
  );

  const updatePreferences = useCallback(
    async (preferences: FlashcardStudyPreferences) => {
      if (!progress) return;
      const next = updateLocalPreferences(progress, preferences);
      persist(next);
      const preview = queueFromLocal(deck, next, crypto.randomUUID());
      setSummary(preview.summary);
      if (isAuthenticated) {
        try {
          await apiClient.api.flashcards
            .learning({ deckId: deck.id })
            .preferences.patch(preferences);
        } catch {
          setSyncState("offline");
        }
      }
    },
    [deck, isAuthenticated, persist, progress],
  );

  const currentItem = items[currentIndex] ?? null;
  const accuracyPercentage = useMemo(
    () =>
      sessionReviews.length > 0
        ? Math.round(
            (sessionReviews.filter((review) => review.rating !== "again")
              .length /
              sessionReviews.length) *
              100,
          )
        : 0,
    [sessionReviews],
  );

  return {
    phase,
    progress,
    preferences: progress?.preferences ?? null,
    summary,
    items,
    currentItem,
    currentIndex,
    isRevealed,
    hintVisible,
    awaitingAdvance,
    sessionReviews,
    accuracyPercentage,
    syncState,
    error,
    isStarting,
    start,
    reveal: () => setIsRevealed((value) => !value),
    toggleHint: () => setHintVisible((value) => !value),
    rate,
    advance: () => void advance(),
    finish: () => void finish(),
    updatePreferences,
  };
}
