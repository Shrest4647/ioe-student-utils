"use client";

import {
  Check,
  ChevronLeft,
  Cloud,
  CloudOff,
  Settings2,
  Sparkles,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type {
  FlashcardDeckView,
  FlashcardReviewRating,
} from "@/types/flashcard-platform";
import { FlashcardInsights } from "./flashcard-insights";
import { FlashcardRatingControls } from "./flashcard-rating-controls";
import { FlashcardSessionSummary } from "./flashcard-session-summary";
import { FlashcardStudyCard } from "./flashcard-study-card";
import { FlashcardStudySettings } from "./flashcard-study-settings";
import { useAdaptiveFlashcard } from "./use-adaptive-flashcard";

interface FlashcardPlayerProps {
  deck: FlashcardDeckView;
  onPhaseChange?: (phase: "not_started" | "in_progress" | "completed") => void;
}

export function FlashcardPlayer({ deck, onPhaseChange }: FlashcardPlayerProps) {
  const { isAuthenticated } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const runtime = useAdaptiveFlashcard({
    deck,
    isAuthenticated,
    onPhaseChange,
  });

  const ratings: FlashcardReviewRating[] =
    runtime.preferences?.confidenceScale === 3
      ? ["again", "good", "easy"]
      : ["again", "hard", "good", "easy"];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, select, textarea, button, audio, video"))
        return;
      if (event.key === " " && runtime.phase === "studying") {
        event.preventDefault();
        if (runtime.awaitingAdvance) runtime.advance();
        else runtime.reveal();
        return;
      }
      if (event.key.toLowerCase() === "h" && runtime.phase === "studying") {
        runtime.toggleHint();
        return;
      }
      if (event.key.toLowerCase() === "s") {
        setSettingsOpen((value) => !value);
        return;
      }
      if (event.key === "Escape") setSettingsOpen(false);
      const rating = ratings[Number(event.key) - 1];
      if (rating && runtime.isRevealed) void runtime.rate(rating);
    },
    [ratings, runtime],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (runtime.phase === "loading" || !runtime.preferences) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      </div>
    );
  }

  if (runtime.phase === "ready") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/flashcards"
              className="mb-3 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> All decks
            </Link>
            <h1 className="text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
              {deck.title}
            </h1>
            {deck.description ? (
              <p className="mt-2 max-w-[70ch] text-muted-foreground text-sm leading-6">
                {deck.description}
              </p>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <Settings2 className="size-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>

        <section className="rounded-2xl border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="font-medium text-primary text-sm">
                {runtime.preferences.studyMode === "adaptive"
                  ? "Adaptive review"
                  : runtime.preferences.studyMode === "random"
                    ? "Random practice"
                    : "Cram session"}
              </p>
              <h2 className="mt-1 font-semibold text-xl">
                {runtime.summary?.total
                  ? `${runtime.summary.total} cards ready`
                  : "You are caught up"}
              </h2>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-sm">
                <span>
                  <strong className="text-foreground">
                    {runtime.summary?.due ?? 0}
                  </strong>{" "}
                  due
                </span>
                <span>
                  <strong className="text-foreground">
                    {runtime.summary?.new ?? 0}
                  </strong>{" "}
                  unseen
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Timer className="size-4" /> about{" "}
                  {runtime.summary?.estimatedMinutes ?? 1} min
                </span>
              </div>
            </div>
            <Button
              className="h-11 min-w-36"
              onClick={() => void runtime.start()}
              disabled={runtime.isStarting}
            >
              <Sparkles className="size-4" />
              {runtime.isStarting
                ? "Preparing"
                : runtime.summary?.total
                  ? "Start review"
                  : "Practice anyway"}
            </Button>
          </div>

          {settingsOpen ? (
            <FlashcardStudySettings
              preferences={runtime.preferences}
              deckDefaults={{
                newCardsPerDay: deck.newCardsPerDay,
                maxReviewsPerDay: deck.maxReviewsPerDay,
              }}
              onChange={(preferences) =>
                void runtime.updatePreferences(preferences)
              }
            />
          ) : null}
        </section>

        {!isAuthenticated ? (
          <div className="mt-5 flex flex-col gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Progress is saved on this device. Sign in to keep it across
              devices.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/auth/signin?callbackURL=/flashcards/${deck.slug}`}>
                Sign in to sync
              </Link>
            </Button>
          </div>
        ) : null}
        <FlashcardInsights
          deck={deck}
          isAuthenticated={isAuthenticated}
          localProgress={runtime.progress}
        />
      </main>
    );
  }

  if (runtime.phase === "complete") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
        <FlashcardSessionSummary
          cardsStudied={runtime.sessionReviews.length}
          accuracyPercentage={runtime.accuracyPercentage}
          deckSlug={deck.slug}
          canPersistProgress={isAuthenticated}
          onRestart={() => void runtime.start()}
        />
        <FlashcardInsights
          deck={deck}
          isAuthenticated={isAuthenticated}
          localProgress={runtime.progress}
        />
      </main>
    );
  }

  if (!runtime.currentItem) return null;

  const progressValue =
    runtime.items.length > 0
      ? ((runtime.currentIndex + 1) / runtime.items.length) * 100
      : 0;
  const syncLabel =
    runtime.syncState === "offline"
      ? "Saved on device"
      : runtime.syncState === "syncing"
        ? "Syncing"
        : isAuthenticated
          ? "Progress synced"
          : "Saved on device";

  return (
    <main className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4 sm:py-6">
      <header className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{deck.title}</p>
            <p className="text-muted-foreground text-xs">
              {runtime.currentIndex + 1} of {runtime.items.length}
              {runtime.currentItem.kind === "new" ? " · New" : " · Review"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="hidden items-center gap-1.5 text-muted-foreground text-xs sm:flex">
              {runtime.syncState === "offline" ? (
                <CloudOff className="size-3.5" />
              ) : runtime.syncState === "saved" && isAuthenticated ? (
                <Check className="size-3.5" />
              ) : (
                <Cloud className="size-3.5" />
              )}
              {syncLabel}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Study settings"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((value) => !value)}
            >
              <Settings2 className="size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={runtime.finish}>
              End
            </Button>
          </div>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </header>

      {settingsOpen ? (
        <div className="mb-4 rounded-xl border bg-card px-4 pb-5">
          <FlashcardStudySettings
            preferences={runtime.preferences}
            deckDefaults={{
              newCardsPerDay: deck.newCardsPerDay,
              maxReviewsPerDay: deck.maxReviewsPerDay,
            }}
            onChange={(preferences) =>
              void runtime.updatePreferences(preferences)
            }
          />
        </div>
      ) : null}

      <FlashcardStudyCard
        card={runtime.currentItem.card}
        isRevealed={runtime.isRevealed}
        hintVisible={runtime.hintVisible}
        compact={runtime.preferences.appearance === "compact"}
        onReveal={runtime.reveal}
        onToggleHint={runtime.toggleHint}
      />

      <div
        className={`sticky bottom-0 z-10 mt-3 rounded-2xl border bg-background/95 p-3 shadow-lg supports-[backdrop-filter]:backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-4 sm:shadow-none ${
          runtime.isRevealed ? "opacity-100" : "pointer-events-none opacity-45"
        }`}
      >
        <FlashcardRatingControls
          deck={deck}
          state={runtime.currentItem.state}
          preferences={runtime.preferences}
          disabled={!runtime.isRevealed || runtime.awaitingAdvance}
          onRate={(rating) => void runtime.rate(rating)}
        />
        {runtime.awaitingAdvance ? (
          <Button className="mt-2 h-11 w-full" onClick={runtime.advance}>
            Next card
          </Button>
        ) : null}
      </div>
      {runtime.error ? (
        <p className="mt-3 text-center text-destructive text-sm">
          {runtime.error}
        </p>
      ) : null}
    </main>
  );
}
