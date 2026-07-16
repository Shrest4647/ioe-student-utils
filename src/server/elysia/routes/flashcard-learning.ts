import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import {
  flashcardReviews,
  flashcardStudySessions,
  flashcardUserCardStates,
  flashcardUserDeckPreferences,
} from "@/server/db/schema";
import { buildFlashcardQueue } from "@/server/services/flashcard-queue";
import {
  computeNextState,
  estimateRetrievability,
  type FlashcardSrsState,
  isRatingRecalled,
} from "@/server/services/flashcard-srs";
import type {
  FlashcardAnalytics,
  FlashcardStudyPreferences,
} from "@/types/flashcard-platform";
import { authorizationPlugin } from "../plugins/authorization";

const studyModeSchema = t.Enum({
  adaptive: "adaptive",
  random: "random",
  cram: "cram",
});
const ratingSchema = t.Enum({
  again: "again",
  hard: "hard",
  good: "good",
  easy: "easy",
});

const defaultPreferences: FlashcardStudyPreferences = {
  studyMode: "adaptive",
  schedulingAggressiveness: "balanced",
  confidenceScale: 4,
  newCardsPerDay: null,
  maxReviewsPerDay: null,
  autoAdvance: true,
  showHints: true,
  appearance: "comfortable",
};

function desiredRetention(value: "relaxed" | "balanced" | "intensive") {
  return value === "relaxed" ? 0.85 : value === "intensive" ? 0.94 : 0.9;
}

function toState(state: typeof flashcardUserCardStates.$inferSelect) {
  return {
    state: state.state,
    dueAt: state.dueAt,
    stability: state.stability,
    difficulty: state.difficulty,
    easeFactor: state.easeFactor,
    intervalDays: state.intervalDays,
    repetition: state.repetition,
    lapses: state.lapses,
    lastReviewedAt: state.lastReviewedAt,
  } satisfies FlashcardSrsState;
}

function toPreferences(
  row: typeof flashcardUserDeckPreferences.$inferSelect | undefined,
): FlashcardStudyPreferences {
  if (!row) return defaultPreferences;
  return {
    studyMode: row.studyMode,
    schedulingAggressiveness: row.schedulingAggressiveness,
    confidenceScale: row.confidenceScale === 3 ? 3 : 4,
    newCardsPerDay: row.newCardsPerDay,
    maxReviewsPerDay: row.maxReviewsPerDay,
    autoAdvance: row.autoAdvance,
    showHints: row.showHints,
    appearance: row.appearance,
  };
}

export const flashcardLearningRoutes = new Elysia({
  prefix: "/flashcards/learning",
})
  .use(authorizationPlugin)
  .get(
    "/:deckId/queue",
    async ({ params: { deckId }, query, user, set }) => {
      const deck = await db.query.flashcardDecks.findFirst({
        where: { id: deckId, status: "published" },
      });
      if (!deck) {
        set.status = 404;
        return { success: false, error: "Flashcard deck not found" };
      }

      const [cards, states, preferenceRow] = await Promise.all([
        db.query.flashcardCards.findMany({
          where: { deckId, isActive: true },
          orderBy: { orderNo: "asc" },
        }),
        db.query.flashcardUserCardStates.findMany({
          where: { userId: user.id, deckId },
        }),
        db.query.flashcardUserDeckPreferences.findFirst({
          where: { userId: user.id, deckId },
        }),
      ]);
      const preferences = toPreferences(preferenceRow);
      const mode = query.mode ?? preferences.studyMode;
      const result = buildFlashcardQueue({
        cards: cards.map((card) => ({
          ...card,
          media: card.media as never,
        })),
        states,
        mode,
        seed: query.seed,
        now: new Date(),
        newCardsLimit: preferences.newCardsPerDay ?? deck.newCardsPerDay,
        reviewLimit: preferences.maxReviewsPerDay ?? deck.maxReviewsPerDay,
      });

      return {
        success: true,
        data: { ...result, preferences, mode },
      };
    },
    {
      auth: true,
      query: t.Object({
        seed: t.String({ minLength: 1 }),
        mode: t.Optional(studyModeSchema),
      }),
      detail: { tags: ["Flashcards"], summary: "Build adaptive study queue" },
    },
  )
  .get(
    "/:deckId/preferences",
    async ({ params: { deckId }, user }) => {
      const row = await db.query.flashcardUserDeckPreferences.findFirst({
        where: { userId: user.id, deckId },
      });
      return { success: true, data: toPreferences(row) };
    },
    {
      auth: true,
      detail: { tags: ["Flashcards"], summary: "Get study preferences" },
    },
  )
  .patch(
    "/:deckId/preferences",
    async ({ params: { deckId }, body, user }) => {
      const existing = await db.query.flashcardUserDeckPreferences.findFirst({
        where: { userId: user.id, deckId },
      });
      const values = {
        ...toPreferences(existing),
        ...body,
        userId: user.id,
        deckId,
      };
      const [row] = existing
        ? await db
            .update(flashcardUserDeckPreferences)
            .set(values)
            .where(eq(flashcardUserDeckPreferences.id, existing.id))
            .returning()
        : await db
            .insert(flashcardUserDeckPreferences)
            .values(values)
            .returning();
      return { success: true, data: toPreferences(row) };
    },
    {
      auth: true,
      body: t.Partial(
        t.Object({
          studyMode: studyModeSchema,
          schedulingAggressiveness: t.Enum({
            relaxed: "relaxed",
            balanced: "balanced",
            intensive: "intensive",
          }),
          confidenceScale: t.Union([t.Literal(3), t.Literal(4)]),
          newCardsPerDay: t.Nullable(t.Number({ minimum: 1, maximum: 200 })),
          maxReviewsPerDay: t.Nullable(t.Number({ minimum: 1, maximum: 500 })),
          autoAdvance: t.Boolean(),
          showHints: t.Boolean(),
          appearance: t.Enum({
            comfortable: "comfortable",
            compact: "compact",
          }),
        }),
      ),
      detail: { tags: ["Flashcards"], summary: "Update study preferences" },
    },
  )
  .post(
    "/:deckId/sync",
    async ({ params: { deckId }, body, user, set }) => {
      const deck = await db.query.flashcardDecks.findFirst({
        where: { id: deckId, status: "published" },
      });
      if (!deck) {
        set.status = 404;
        return { success: false, error: "Flashcard deck not found" };
      }
      const cardIds = new Set(
        (
          await db.query.flashcardCards.findMany({
            where: { deckId, isActive: true },
            columns: { id: true },
          })
        ).map((card) => card.id),
      );
      const preferenceRow =
        await db.query.flashcardUserDeckPreferences.findFirst({
          where: { userId: user.id, deckId },
        });
      const preferences = toPreferences(preferenceRow);
      const ordered = [...body.reviews].sort(
        (left, right) =>
          new Date(left.reviewedAt).getTime() -
          new Date(right.reviewedAt).getTime(),
      );
      let imported = 0;
      let skipped = 0;

      const states = await db.transaction(async (tx) => {
        const [session] = await tx
          .insert(flashcardStudySessions)
          .values({
            deckId,
            userId: user.id,
            status: "completed",
            completedAt: new Date(),
            metadata: { source: "local-migration" },
          })
          .returning();
        if (!session) throw new Error("Failed to create migration session");

        let correctCount = 0;
        for (const review of ordered) {
          if (!cardIds.has(review.cardId)) {
            skipped += 1;
            continue;
          }
          const duplicate = await tx.query.flashcardReviews.findFirst({
            where: { clientReviewId: review.clientReviewId },
            columns: { id: true },
          });
          if (duplicate) {
            skipped += 1;
            continue;
          }
          const previous = await tx.query.flashcardUserCardStates.findFirst({
            where: { userId: user.id, cardId: review.cardId },
          });
          const reviewedAt = new Date(review.reviewedAt);
          if (
            Number.isNaN(reviewedAt.getTime()) ||
            reviewedAt.getTime() > Date.now() + 5 * 60_000
          ) {
            skipped += 1;
            continue;
          }
          const advancesSchedule =
            !previous?.lastReviewedAt || reviewedAt > previous.lastReviewedAt;
          const next = computeNextState({
            policy: {
              srsAlgorithm: deck.srsAlgorithm,
              learningSteps: deck.learningSteps,
              graduatingIntervalDays: deck.graduatingIntervalDays,
              easyIntervalDays: deck.easyIntervalDays,
              desiredRetention: desiredRetention(
                preferences.schedulingAggressiveness,
              ),
            },
            previous: previous ? toState(previous) : null,
            rating: review.rating,
            now: reviewedAt,
          });
          if (previous && advancesSchedule) {
            await tx
              .update(flashcardUserCardStates)
              .set(next)
              .where(eq(flashcardUserCardStates.id, previous.id));
          } else if (!previous) {
            await tx.insert(flashcardUserCardStates).values({
              userId: user.id,
              deckId,
              cardId: review.cardId,
              ...next,
            });
          }
          await tx.insert(flashcardReviews).values({
            sessionId: session.id,
            deckId,
            cardId: review.cardId,
            userId: user.id,
            clientReviewId: review.clientReviewId,
            rating: review.rating,
            confidence: review.confidence,
            studyMode: review.studyMode,
            responseMs: review.responseMs,
            wasRecalled: isRatingRecalled(review.rating),
            reviewedAt,
            scheduledDueAt: advancesSchedule
              ? next.dueAt
              : (previous?.dueAt ?? next.dueAt),
          });
          imported += 1;
          if (isRatingRecalled(review.rating)) correctCount += 1;
        }
        await tx
          .update(flashcardStudySessions)
          .set({
            cardsStudied: imported,
            correctCount,
            accuracyPercentage:
              imported > 0 ? Math.round((correctCount / imported) * 100) : 0,
            timeSpentSeconds: body.timeSpentSeconds ?? 0,
          })
          .where(eq(flashcardStudySessions.id, session.id));
        return tx.query.flashcardUserCardStates.findMany({
          where: { userId: user.id, deckId },
        });
      });

      return { success: true, data: { imported, skipped, states } };
    },
    {
      auth: true,
      body: t.Object({
        timeSpentSeconds: t.Optional(t.Number({ minimum: 0 })),
        reviews: t.Array(
          t.Object({
            clientReviewId: t.String({ minLength: 1 }),
            cardId: t.String(),
            rating: ratingSchema,
            confidence: t.Number({ minimum: 1, maximum: 4 }),
            studyMode: studyModeSchema,
            responseMs: t.Optional(t.Number({ minimum: 0 })),
            reviewedAt: t.String(),
          }),
          { maxItems: 2000 },
        ),
      }),
      detail: { tags: ["Flashcards"], summary: "Migrate local reviews" },
    },
  )
  .get(
    "/:deckId/insights",
    async ({ params: { deckId }, user }) => {
      const [cards, states, reviews, sessions] = await Promise.all([
        db.query.flashcardCards.findMany({
          where: { deckId, isActive: true },
          columns: { id: true, front: true },
        }),
        db.query.flashcardUserCardStates.findMany({
          where: { userId: user.id, deckId },
        }),
        db.query.flashcardReviews.findMany({
          where: { userId: user.id, deckId },
          orderBy: { reviewedAt: "asc" },
        }),
        db.query.flashcardStudySessions.findMany({
          where: { userId: user.id, deckId },
        }),
      ]);
      const now = new Date();
      const retentionValues = states.map((state) =>
        estimateRetrievability(
          {
            stability: state.stability,
            lastReviewedAt: state.lastReviewedAt,
          },
          now,
        ),
      );
      const mastered = states.filter(
        (state, index) =>
          state.intervalDays >= 21 && (retentionValues[index] ?? 0) >= 0.8,
      ).length;
      const recalled = reviews.filter((review) => review.wasRecalled).length;
      const confidenceValues = reviews
        .map((review) => review.confidence)
        .filter((value): value is number => value !== null);
      const activeDays = new Set(
        reviews.map((review) => review.reviewedAt.toISOString().slice(0, 10)),
      );
      let streak = 0;
      const cursor = new Date(now);
      if (!activeDays.has(cursor.toISOString().slice(0, 10))) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      while (activeDays.has(cursor.toISOString().slice(0, 10))) {
        streak += 1;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      const trendMap = new Map<
        string,
        { reviews: number; recalled: number; confidence: number[] }
      >();
      for (const review of reviews.slice(-1000)) {
        const date = review.reviewedAt.toISOString().slice(0, 10);
        const point = trendMap.get(date) ?? {
          reviews: 0,
          recalled: 0,
          confidence: [],
        };
        point.reviews += 1;
        point.recalled += review.wasRecalled ? 1 : 0;
        if (review.confidence !== null)
          point.confidence.push(review.confidence);
        trendMap.set(date, point);
      }
      const cardById = new Map(cards.map((card) => [card.id, card]));
      const difficultCards = [...states]
        .sort(
          (left, right) =>
            right.difficulty +
            right.lapses * 1.5 -
            (left.difficulty + left.lapses * 1.5),
        )
        .slice(0, 5)
        .map((state) => ({
          cardId: state.cardId,
          front: cardById.get(state.cardId)?.front ?? "Card",
          difficulty: state.difficulty,
          lapses: state.lapses,
          retentionPercentage: Math.round(
            estimateRetrievability(
              {
                stability: state.stability,
                lastReviewedAt: state.lastReviewedAt,
              },
              now,
            ) * 100,
          ),
        }));
      const sevenDays = new Date(now.getTime() + 7 * 86_400_000);
      const data: FlashcardAnalytics = {
        reviewStreakDays: streak,
        masteryPercentage:
          cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0,
        retentionPercentage:
          retentionValues.length > 0
            ? Math.round(
                (retentionValues.reduce((sum, value) => sum + value, 0) /
                  retentionValues.length) *
                  100,
              )
            : 0,
        accuracyPercentage:
          reviews.length > 0
            ? Math.round((recalled / reviews.length) * 100)
            : 0,
        averageConfidence:
          confidenceValues.length > 0
            ? confidenceValues.reduce((sum, value) => sum + value, 0) /
              confidenceValues.length
            : null,
        totalReviews: reviews.length,
        totalCards: cards.length,
        cardsSeen: states.length,
        timeSpentSeconds: sessions.reduce(
          (sum, session) => sum + session.timeSpentSeconds,
          0,
        ),
        dueToday: states.filter((state) => state.dueAt <= now).length,
        dueNextSevenDays: states.filter(
          (state) => state.dueAt > now && state.dueAt <= sevenDays,
        ).length,
        trends: [...trendMap.entries()].slice(-14).map(([date, point]) => ({
          date,
          reviews: point.reviews,
          accuracyPercentage: Math.round(
            (point.recalled / point.reviews) * 100,
          ),
          averageConfidence:
            point.confidence.length > 0
              ? point.confidence.reduce((sum, value) => sum + value, 0) /
                point.confidence.length
              : null,
        })),
        difficultCards,
      };
      return { success: true, data };
    },
    {
      auth: true,
      detail: { tags: ["Flashcards"], summary: "Get learning insights" },
    },
  );
