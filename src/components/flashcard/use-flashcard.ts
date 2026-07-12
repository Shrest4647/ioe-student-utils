"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FlashcardDeckView,
  FlashcardReviewRating,
} from "@/types/flashcard-platform";

const STORAGE_PREFIX = "flashcard_progress_";

interface FlashcardRuntimeReview {
  cardId: string;
  rating: FlashcardReviewRating;
}

interface UseFlashcardOptions {
  deck: FlashcardDeckView;
  persistenceKey?: string;
  onReview?: (payload: {
    cardId: string;
    rating: FlashcardReviewRating;
  }) => Promise<void> | void;
  onComplete?: (payload: {
    cardsStudied: number;
    correctCount: number;
    accuracyPercentage: number;
    timeSpentSeconds: number;
  }) => Promise<void> | void;
}

export function useFlashcard({
  deck,
  persistenceKey,
  onReview,
  onComplete,
}: UseFlashcardOptions) {
  const storageKey = `${STORAGE_PREFIX}${persistenceKey ?? deck.slug}`;
  const cards = deck.cards ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviews, setReviews] = useState<FlashcardRuntimeReview[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const currentCard = cards[currentIndex];

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        currentIndex: number;
        isFlipped: boolean;
        reviews: FlashcardRuntimeReview[];
        isComplete: boolean;
        startedAt: number;
      };
      setCurrentIndex(parsed.currentIndex ?? 0);
      setIsFlipped(parsed.isFlipped ?? false);
      setReviews(parsed.reviews ?? []);
      setIsComplete(parsed.isComplete ?? false);
      setStartedAt(parsed.startedAt ?? Date.now());
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentIndex,
        isFlipped,
        reviews,
        isComplete,
        startedAt,
      }),
    );
  }, [currentIndex, isFlipped, reviews, isComplete, startedAt, storageKey]);

  const flip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const rate = useCallback(
    async (rating: FlashcardReviewRating) => {
      if (!currentCard || isComplete) return;

      setReviews((prev) => {
        const existing = prev.find((p) => p.cardId === currentCard.id);
        if (existing) {
          return prev.map((p) =>
            p.cardId === currentCard.id
              ? {
                  ...p,
                  rating,
                }
              : p,
          );
        }
        return [...prev, { cardId: currentCard.id, rating }];
      });

      await onReview?.({
        cardId: currentCard.id,
        rating,
      });
    },
    [currentCard, isComplete, onReview],
  );

  const next = useCallback(async () => {
    if (!currentCard) return;
    const reviewed = reviews.some((r) => r.cardId === currentCard.id);
    const rating: FlashcardReviewRating = reviewed
      ? (reviews.find((r) => r.cardId === currentCard.id)?.rating ?? "good")
      : "good";

    const nextReviews = reviewed
      ? reviews.map((r) => (r.cardId === currentCard.id ? { ...r, rating } : r))
      : [...reviews, { cardId: currentCard.id, rating }];

    if (!reviewed) {
      setReviews(nextReviews);
    }

    await onReview?.({
      cardId: currentCard.id,
      rating,
    });

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      return;
    }

    const cardsStudied = nextReviews.length;
    const correctCount = nextReviews.filter((r) => r.rating !== "again").length;
    const accuracyPercentage =
      cardsStudied > 0 ? Math.round((correctCount / cardsStudied) * 100) : 0;
    const timeSpentSeconds = Math.round((Date.now() - startedAt) / 1000);

    setIsComplete(true);
    await onComplete?.({
      cardsStudied,
      correctCount,
      accuracyPercentage,
      timeSpentSeconds,
    });
  }, [
    cards.length,
    currentCard,
    currentIndex,
    onComplete,
    onReview,
    reviews,
    startedAt,
  ]);

  const previous = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
    setIsFlipped(false);
  }, [currentIndex]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setReviews([]);
    setIsComplete(false);
    setStartedAt(Date.now());
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const currentRating = useMemo(
    () => reviews.find((r) => r.cardId === currentCard?.id)?.rating,
    [reviews, currentCard?.id],
  );

  const accuracyPercentage =
    reviews.length > 0
      ? Math.round(
          (reviews.filter((r) => r.rating !== "again").length /
            reviews.length) *
            100,
        )
      : 0;

  return {
    cards,
    currentCard,
    currentIndex,
    isFlipped,
    isComplete,
    reviews,
    currentRating,
    progress: cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0,
    accuracyPercentage,
    flip,
    rate,
    next,
    previous,
    restart,
  };
}
