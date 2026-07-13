"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  Flame,
  Target,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/eden";
import type { LocalFlashcardProgress } from "@/lib/flashcards/local-progress";
import { estimateRetrievability } from "@/server/services/flashcard-srs";
import type {
  FlashcardAnalytics,
  FlashcardDeckView,
} from "@/types/flashcard-platform";

interface FlashcardInsightsProps {
  deck: FlashcardDeckView;
  isAuthenticated: boolean;
  localProgress?: LocalFlashcardProgress | null;
}

function localAnalytics(
  deck: FlashcardDeckView,
  progress?: LocalFlashcardProgress | null,
): FlashcardAnalytics {
  const reviews = progress?.reviews ?? [];
  const states = Object.values(progress?.states ?? {});
  const now = new Date();
  const retention = states.map((state) =>
    estimateRetrievability(
      {
        stability: state.stability,
        lastReviewedAt: state.lastReviewedAt
          ? new Date(state.lastReviewedAt)
          : null,
      },
      now,
    ),
  );
  const recalled = reviews.filter((review) => review.rating !== "again").length;
  const confidences = reviews.map((review) => review.confidence);
  const activeDays = new Set(
    reviews.map((review) => review.reviewedAt.slice(0, 10)),
  );
  let reviewStreakDays = 0;
  const streakCursor = new Date(now);
  if (!activeDays.has(streakCursor.toISOString().slice(0, 10))) {
    streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
  }
  while (activeDays.has(streakCursor.toISOString().slice(0, 10))) {
    reviewStreakDays += 1;
    streakCursor.setUTCDate(streakCursor.getUTCDate() - 1);
  }
  const trendMap = new Map<
    string,
    { reviews: number; recalled: number; confidence: number[] }
  >();
  for (const review of reviews) {
    const date = review.reviewedAt.slice(0, 10);
    const point = trendMap.get(date) ?? {
      reviews: 0,
      recalled: 0,
      confidence: [],
    };
    point.reviews += 1;
    point.recalled += review.rating === "again" ? 0 : 1;
    point.confidence.push(review.confidence);
    trendMap.set(date, point);
  }
  return {
    reviewStreakDays,
    masteryPercentage:
      deck.cards.length > 0
        ? Math.round(
            (states.filter((state) => state.intervalDays >= 21).length /
              deck.cards.length) *
              100,
          )
        : 0,
    retentionPercentage:
      retention.length > 0
        ? Math.round(
            (retention.reduce((sum, value) => sum + value, 0) /
              retention.length) *
              100,
          )
        : 0,
    accuracyPercentage:
      reviews.length > 0 ? Math.round((recalled / reviews.length) * 100) : 0,
    averageConfidence:
      confidences.length > 0
        ? confidences.reduce((sum, value) => sum + value, 0) /
          confidences.length
        : null,
    totalReviews: reviews.length,
    totalCards: deck.cards.length,
    cardsSeen: states.length,
    timeSpentSeconds: (progress?.sessions ?? []).reduce(
      (sum, session) => sum + session.timeSpentSeconds,
      0,
    ),
    dueToday: states.filter((state) => new Date(state.dueAt) <= now).length,
    dueNextSevenDays: states.filter((state) => {
      const due = new Date(state.dueAt);
      return due > now && due <= new Date(now.getTime() + 7 * 86_400_000);
    }).length,
    trends: [...trendMap.entries()].slice(-14).map(([date, point]) => ({
      date,
      reviews: point.reviews,
      accuracyPercentage: Math.round((point.recalled / point.reviews) * 100),
      averageConfidence:
        point.confidence.reduce((sum, value) => sum + value, 0) /
        point.confidence.length,
    })),
    difficultCards: [...states]
      .sort(
        (left, right) =>
          right.difficulty + right.lapses - (left.difficulty + left.lapses),
      )
      .slice(0, 5)
      .map((state) => ({
        cardId: state.cardId,
        front:
          deck.cards.find((card) => card.id === state.cardId)?.front ?? "Card",
        difficulty: state.difficulty,
        lapses: state.lapses,
        retentionPercentage: Math.round(
          estimateRetrievability(
            {
              stability: state.stability,
              lastReviewedAt: state.lastReviewedAt
                ? new Date(state.lastReviewedAt)
                : null,
            },
            now,
          ) * 100,
        ),
      })),
  };
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return minutes < 60
    ? `${minutes}m`
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function FlashcardInsights({
  deck,
  isAuthenticated,
  localProgress,
}: FlashcardInsightsProps) {
  const query = useQuery({
    queryKey: ["flashcards", "insights", deck.id],
    queryFn: async () => {
      const response = await apiClient.api.flashcards
        .learning({ deckId: deck.id })
        .insights.get();
      if (response.error || !response.data?.success || !response.data.data) {
        throw new Error("Could not load learning insights");
      }
      return response.data.data;
    },
    enabled: isAuthenticated,
    retry: false,
  });
  const data = query.data ?? localAnalytics(deck, localProgress);

  return (
    <section
      className="mx-auto w-full max-w-4xl px-4 pt-4 pb-12"
      aria-labelledby="learning-insights"
    >
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2
            id="learning-insights"
            className="font-semibold text-xl tracking-tight"
          >
            Learning insights
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {data.totalReviews > 0
              ? "Your schedule adapts after every answer."
              : "Insights will appear after your first review."}
          </p>
        </div>
        {!isAuthenticated ? (
          <span className="text-muted-foreground text-xs">
            This device only
          </span>
        ) : null}
      </div>

      <dl className="grid border-y sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex gap-3 border-b px-1 py-4 sm:border-r sm:px-4 lg:border-b-0">
          <Target className="mt-0.5 size-4 text-primary" />
          <div>
            <dt className="text-muted-foreground text-xs">
              Retention estimate
            </dt>
            <dd className="mt-1 font-semibold text-lg">
              {data.retentionPercentage}%
            </dd>
          </div>
        </div>
        <div className="flex gap-3 border-b px-1 py-4 lg:border-r lg:border-b-0 lg:px-4">
          <Flame className="mt-0.5 size-4 text-primary" />
          <div>
            <dt className="text-muted-foreground text-xs">Review streak</dt>
            <dd className="mt-1 font-semibold text-lg">
              {data.reviewStreakDays} days
            </dd>
          </div>
        </div>
        <div className="flex gap-3 border-b px-1 py-4 sm:border-r sm:border-b-0 sm:px-4">
          <CalendarClock className="mt-0.5 size-4 text-primary" />
          <div>
            <dt className="text-muted-foreground text-xs">Upcoming</dt>
            <dd className="mt-1 font-semibold text-lg">
              {data.dueNextSevenDays} cards
            </dd>
          </div>
        </div>
        <div className="flex gap-3 px-1 py-4 sm:px-4">
          <Clock3 className="mt-0.5 size-4 text-primary" />
          <div>
            <dt className="text-muted-foreground text-xs">Study time</dt>
            <dd className="mt-1 font-semibold text-lg">
              {formatDuration(data.timeSpentSeconds)}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-7 grid gap-8 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Mastery</span>
              <span className="font-medium">{data.masteryPercentage}%</span>
            </div>
            <Progress value={data.masteryPercentage} />
            <p className="mt-1.5 text-muted-foreground text-xs">
              {data.cardsSeen} of {data.totalCards} cards started
            </p>
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Recall accuracy</span>
              <span className="font-medium">{data.accuracyPercentage}%</span>
            </div>
            <Progress value={data.accuracyPercentage} />
            <p className="mt-1.5 text-muted-foreground text-xs">
              Based on {data.totalReviews} answers
              {data.averageConfidence !== null
                ? ` · ${data.averageConfidence.toFixed(1)} average confidence`
                : ""}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm">Cards needing attention</h3>
          {data.difficultCards.length === 0 ? (
            <p className="mt-3 text-muted-foreground text-sm">
              No difficult cards yet. Keep reviewing and this list will adapt.
            </p>
          ) : (
            <ol className="mt-2 divide-y">
              {data.difficultCards.map((card) => (
                <li key={card.cardId} className="flex items-start gap-3 py-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm">{card.front}</p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {card.lapses} lapses · {card.retentionPercentage}%
                      retention
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {data.trends.length > 0 ? (
        <div className="mt-8 border-t pt-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="font-medium text-sm">Recent accuracy</h3>
            <span className="text-muted-foreground text-xs">
              Last {data.trends.length} study days
            </span>
          </div>
          <ol className="space-y-2">
            {data.trends.slice(-7).map((point) => (
              <li
                key={point.date}
                className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-xs"
              >
                <time className="text-muted-foreground" dateTime={point.date}>
                  {new Date(`${point.date}T00:00:00`).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                    },
                  )}
                </time>
                <Progress value={point.accuracyPercentage} className="h-2" />
                <span className="w-20 text-right">
                  {point.accuracyPercentage}% · {point.reviews}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
