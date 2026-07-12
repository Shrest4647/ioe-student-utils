"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";
import type {
  FlashcardDeckView,
  FlashcardReviewRating,
} from "@/types/flashcard-platform";
import { Flashcard } from "./Flashcard";
import { FlashcardControls } from "./flashcard-controls";
import { FlashcardProgress } from "./flashcard-progress";
import { FlashcardSessionSummary } from "./flashcard-session-summary";
import { useFlashcard } from "./use-flashcard";

interface FlashcardPlayerProps {
  deck: FlashcardDeckView;
  onPhaseChange?: (phase: "not_started" | "in_progress" | "completed") => void;
}

export function FlashcardPlayer({ deck, onPhaseChange }: FlashcardPlayerProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [guestStarted, setGuestStarted] = useState(false);

  const startSession = useMutation({
    mutationFn: async () => {
      const guestSessionId = crypto.randomUUID();
      const response = await apiClient.api
        .flashcards({ deckId: deck.id })
        .sessions.post({
          guestSessionId,
        });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to start flashcard session");
      }
      return {
        ...response.data.data,
        guestSessionId,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["flashcards", "sessions", "mine", deck.id],
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      cardId: string;
      rating: FlashcardReviewRating;
    }) => {
      if (!startSession.data?.id) return;
      await apiClient.api.flashcards
        .sessions({ sessionId: startSession.data.id })
        .review.patch({
          cardId: payload.cardId,
          rating: payload.rating,
          guestSessionId: startSession.data.guestSessionId,
        });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (timeSpentSeconds: number) => {
      if (!startSession.data?.id) return;
      await apiClient.api.flashcards
        .sessions({ sessionId: startSession.data.id })
        .complete.post({
          timeSpentSeconds,
          guestSessionId: startSession.data.guestSessionId,
        });
      queryClient.invalidateQueries({
        queryKey: ["flashcards", "sessions", "mine", deck.id],
      });
    },
  });

  const runtime = useFlashcard({
    deck,
    onReview: async ({ cardId, rating }) => {
      if (!isAuthenticated || !startSession.data?.id) return;
      await reviewMutation.mutateAsync({ cardId, rating });
    },
    onComplete: async ({ timeSpentSeconds }) => {
      if (!isAuthenticated || !startSession.data?.id) return;
      await completeMutation.mutateAsync(timeSpentSeconds);
    },
  });

  const phase: "not_started" | "in_progress" | "completed" =
    !runtime.isComplete &&
    ((isAuthenticated &&
      !startSession.data &&
      !startSession.isPending &&
      !guestStarted) ||
      (!isAuthenticated && !guestStarted))
      ? "not_started"
      : runtime.isComplete
        ? "completed"
        : "in_progress";

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  const canStart =
    !runtime.isComplete && !startSession.data && !startSession.isPending;

  if (canStart && !guestStarted) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>{deck.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Start a study session with {deck.cards.length} cards.
            </p>
            <Button
              onClick={() => {
                if (isAuthenticated) {
                  startSession.mutate();
                } else {
                  setGuestStarted(true);
                }
              }}
              disabled={startSession.isPending}
            >
              Start Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (runtime.isComplete) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <FlashcardSessionSummary
          cardsStudied={runtime.reviews.length}
          accuracyPercentage={runtime.accuracyPercentage}
          deckSlug={deck.slug}
          canPersistProgress={isAuthenticated}
          onRestart={runtime.restart}
        />
      </div>
    );
  }

  if (!runtime.currentCard) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>{deck.title}</CardTitle>
          <FlashcardProgress
            current={runtime.currentIndex + 1}
            total={runtime.cards.length}
            progress={runtime.progress}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="h-[340px]">
            <Flashcard
              front={runtime.currentCard.front}
              back={runtime.currentCard.back}
              isFlipped={runtime.isFlipped}
              onFlip={runtime.flip}
            />
          </div>
          <FlashcardControls
            currentRating={runtime.currentRating}
            isLastCard={runtime.currentIndex + 1 >= runtime.cards.length}
            onRate={(rating) => void runtime.rate(rating)}
            onNext={() => void runtime.next()}
            onPrevious={runtime.previous}
            canGoPrevious={runtime.currentIndex > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
