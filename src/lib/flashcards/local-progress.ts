import { computeNextState } from "@/server/services/flashcard-srs";
import type {
  FlashcardDeckView,
  FlashcardReviewRating,
  FlashcardStudyMode,
  FlashcardStudyPreferences,
  FlashcardUserCardStateView,
} from "@/types/flashcard-platform";

const STORAGE_PREFIX = "ioesu_flashcards_v2_";

export interface LocalFlashcardReview {
  clientReviewId: string;
  cardId: string;
  rating: FlashcardReviewRating;
  confidence: number;
  studyMode: FlashcardStudyMode;
  responseMs?: number;
  reviewedAt: string;
  synced: boolean;
}

interface StoredFlashcardState
  extends Omit<FlashcardUserCardStateView, "dueAt" | "lastReviewedAt"> {
  dueAt: string;
  lastReviewedAt: string | null;
}

export interface LocalFlashcardSession {
  id: string;
  startedAt: string;
  completedAt: string;
  cardsStudied: number;
  correctCount: number;
  timeSpentSeconds: number;
}

export interface LocalFlashcardProgress {
  version: 2;
  deckId: string;
  deckVersion: number;
  states: Record<string, StoredFlashcardState>;
  reviews: LocalFlashcardReview[];
  sessions: LocalFlashcardSession[];
  preferences: FlashcardStudyPreferences;
  updatedAt: string;
}

export const defaultFlashcardPreferences: FlashcardStudyPreferences = {
  studyMode: "adaptive",
  schedulingAggressiveness: "balanced",
  confidenceScale: 4,
  newCardsPerDay: null,
  maxReviewsPerDay: null,
  autoAdvance: true,
  showHints: true,
  appearance: "comfortable",
};

function storageKey(deckId: string) {
  return `${STORAGE_PREFIX}${deckId}`;
}

export function emptyLocalProgress(
  deckId: string,
  deckVersion: number,
): LocalFlashcardProgress {
  return {
    version: 2,
    deckId,
    deckVersion,
    states: {},
    reviews: [],
    sessions: [],
    preferences: defaultFlashcardPreferences,
    updatedAt: new Date().toISOString(),
  };
}

export function loadLocalProgress(
  deckId: string,
  deckVersion: number,
): LocalFlashcardProgress {
  if (typeof window === "undefined")
    return emptyLocalProgress(deckId, deckVersion);
  try {
    const raw = window.localStorage.getItem(storageKey(deckId));
    if (!raw) return emptyLocalProgress(deckId, deckVersion);
    const parsed = JSON.parse(raw) as LocalFlashcardProgress;
    if (parsed.version !== 2 || parsed.deckId !== deckId) {
      return emptyLocalProgress(deckId, deckVersion);
    }
    return {
      ...parsed,
      deckVersion,
      preferences: { ...defaultFlashcardPreferences, ...parsed.preferences },
    };
  } catch {
    return emptyLocalProgress(deckId, deckVersion);
  }
}

export function saveLocalProgress(progress: LocalFlashcardProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey(progress.deckId),
    JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }),
  );
}

export function localStates(progress: LocalFlashcardProgress) {
  return Object.values(progress.states).map(
    (state): FlashcardUserCardStateView => ({
      ...state,
      dueAt: new Date(state.dueAt),
      lastReviewedAt: state.lastReviewedAt
        ? new Date(state.lastReviewedAt)
        : null,
    }),
  );
}

function retentionFor(
  aggressiveness: FlashcardStudyPreferences["schedulingAggressiveness"],
) {
  return aggressiveness === "relaxed"
    ? 0.85
    : aggressiveness === "intensive"
      ? 0.94
      : 0.9;
}

export function applyLocalReview(
  progress: LocalFlashcardProgress,
  deck: FlashcardDeckView,
  review: Omit<LocalFlashcardReview, "synced">,
) {
  const previous = progress.states[review.cardId];
  const now = new Date(review.reviewedAt);
  const next = computeNextState({
    policy: {
      srsAlgorithm: deck.srsAlgorithm,
      learningSteps: deck.learningSteps,
      graduatingIntervalDays: deck.graduatingIntervalDays,
      easyIntervalDays: deck.easyIntervalDays,
      desiredRetention: retentionFor(
        progress.preferences.schedulingAggressiveness,
      ),
    },
    previous: previous
      ? {
          ...previous,
          dueAt: new Date(previous.dueAt),
          lastReviewedAt: previous.lastReviewedAt
            ? new Date(previous.lastReviewedAt)
            : null,
        }
      : null,
    rating: review.rating,
    now,
  });
  const nextState: StoredFlashcardState = {
    id: previous?.id ?? `local-${review.cardId}`,
    userId: previous?.userId ?? "local",
    deckId: deck.id,
    cardId: review.cardId,
    ...next,
    dueAt: next.dueAt.toISOString(),
    lastReviewedAt: next.lastReviewedAt?.toISOString() ?? null,
  };
  return {
    ...progress,
    states: { ...progress.states, [review.cardId]: nextState },
    reviews: [...progress.reviews, { ...review, synced: false }].slice(-5000),
  } satisfies LocalFlashcardProgress;
}

export function mergeServerStates(
  progress: LocalFlashcardProgress,
  states: FlashcardUserCardStateView[],
  syncedReviewIds: Set<string>,
) {
  const nextStates = { ...progress.states };
  for (const state of states) {
    nextStates[state.cardId] = {
      ...state,
      dueAt: new Date(state.dueAt).toISOString(),
      lastReviewedAt: state.lastReviewedAt
        ? new Date(state.lastReviewedAt).toISOString()
        : null,
    };
  }
  return {
    ...progress,
    states: nextStates,
    reviews: progress.reviews.map((review) => ({
      ...review,
      synced: review.synced || syncedReviewIds.has(review.clientReviewId),
    })),
  } satisfies LocalFlashcardProgress;
}

export function updateLocalPreferences(
  progress: LocalFlashcardProgress,
  preferences: FlashcardStudyPreferences,
) {
  return { ...progress, preferences } satisfies LocalFlashcardProgress;
}

export function appendLocalSession(
  progress: LocalFlashcardProgress,
  session: LocalFlashcardSession,
) {
  return {
    ...progress,
    sessions: [...progress.sessions, session].slice(-100),
  } satisfies LocalFlashcardProgress;
}
