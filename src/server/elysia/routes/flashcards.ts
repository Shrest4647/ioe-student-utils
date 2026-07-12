import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import slugify from "slugify";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import {
  flashcardCards,
  flashcardDecks,
  flashcardDeckTags,
  flashcardReviews,
  flashcardStudySessions,
  flashcardTags,
  flashcardUserCardStates,
} from "@/server/db/schema";
import {
  computeNextState,
  type FlashcardSrsState,
  isRatingRecalled,
} from "@/server/services/flashcard-srs";
import { authorizationPlugin } from "../plugins/authorization";

const deckStatusSchema = t.Enum({
  draft: "draft",
  published: "published",
  archived: "archived",
});

const difficultySchema = t.Optional(
  t.Enum({
    easy: "easy",
    medium: "medium",
    hard: "hard",
  }),
);

const algorithmSchema = t.Enum({
  sm2: "sm2",
  fsrs: "fsrs",
});

const reviewRatingSchema = t.Enum({
  again: "again",
  hard: "hard",
  good: "good",
  easy: "easy",
});

async function currentSessionUser(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  return session?.user ?? null;
}

function baseDeckSlug(titleOrSlug: string) {
  return (
    slugify(titleOrSlug, { lower: true, strict: true }) || "flashcard-deck"
  );
}

async function uniqueDeckSlug(value: string, excludeId?: string) {
  const base = baseDeckSlug(value);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await db.query.flashcardDecks.findFirst({
      where: { slug },
      columns: { id: true },
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

async function getDeckTags(deckId: string) {
  const links = await db.query.flashcardDeckTags.findMany({
    where: { deckId },
  });
  const tagIds = links.map((link) => link.tagId);
  if (tagIds.length === 0) return [];

  const tags = await db.query.flashcardTags.findMany({
    where: { id: { in: tagIds } },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  }));
}

async function buildDeckView(deckId: string, includeInactive = false) {
  const deck = await db.query.flashcardDecks.findFirst({
    where: { id: deckId },
  });
  if (!deck) return null;

  const cards = await db.query.flashcardCards.findMany({
    where: includeInactive ? { deckId } : { deckId, isActive: true },
    orderBy: { orderNo: "asc" },
  });

  const tags = await getDeckTags(deckId);

  return {
    ...deck,
    tags,
    cards,
  };
}

function validateDeck(
  cards: Array<{ front: string; back: string; orderNo: number }>,
) {
  const issues: Array<{
    code: string;
    level: "error" | "warning";
    message: string;
    cardId?: string;
    orderNo?: number;
  }> = [];

  if (cards.length === 0) {
    issues.push({
      code: "DECK_EMPTY",
      level: "error",
      message: "Deck must contain at least one card.",
    });
  }

  const seen = new Set<number>();
  for (const card of cards) {
    if (!card.front.trim()) {
      issues.push({
        code: "CARD_FRONT_EMPTY",
        level: "error",
        message: "Card front cannot be empty.",
        orderNo: card.orderNo,
      });
    }
    if (!card.back.trim()) {
      issues.push({
        code: "CARD_BACK_EMPTY",
        level: "error",
        message: "Card back cannot be empty.",
        orderNo: card.orderNo,
      });
    }

    if (seen.has(card.orderNo)) {
      issues.push({
        code: "CARD_ORDER_DUPLICATE",
        level: "error",
        message: `Duplicate orderNo ${card.orderNo} detected.`,
        orderNo: card.orderNo,
      });
    }
    seen.add(card.orderNo);
  }

  return {
    valid: !issues.some((issue) => issue.level === "error"),
    issues,
  };
}

export const flashcardRoutes = new Elysia({ prefix: "/flashcards" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query }) => {
      const p = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
      const l = Math.min(
        100,
        Math.max(1, parseInt(query.limit ?? "10", 10) || 10),
      );
      const offset = (p - 1) * l;
      const status = query.status ?? "published";

      let tagDeckIds: string[] | undefined;
      if (query.tag) {
        const tag = await db.query.flashcardTags.findFirst({
          where: { slug: query.tag },
          columns: { id: true },
        });

        if (!tag) {
          return {
            success: true,
            data: [],
            metadata: {
              totalCount: 0,
              totalPages: 0,
              currentPage: p,
              limit: l,
              hasMore: false,
            },
          };
        }

        const links = await db.query.flashcardDeckTags.findMany({
          where: { tagId: tag.id },
          columns: { deckId: true },
        });
        tagDeckIds = links.map((row) => row.deckId);

        if (tagDeckIds.length === 0) {
          return {
            success: true,
            data: [],
            metadata: {
              totalCount: 0,
              totalPages: 0,
              currentPage: p,
              limit: l,
              hasMore: false,
            },
          };
        }
      }

      const whereCondition = and(
        eq(flashcardDecks.status, status),
        query.search
          ? ilike(flashcardDecks.title, `%${query.search}%`)
          : undefined,
        query.difficulty
          ? eq(flashcardDecks.difficulty, query.difficulty)
          : undefined,
        tagDeckIds ? inArray(flashcardDecks.id, tagDeckIds) : undefined,
      );

      const rows = await db
        .select()
        .from(flashcardDecks)
        .where(whereCondition)
        .orderBy(desc(flashcardDecks.createdAt))
        .limit(l)
        .offset(offset);

      const deckIds = rows.map((row) => row.id);
      const cardCounts =
        deckIds.length > 0
          ? await db
              .select({
                deckId: flashcardCards.deckId,
                count: sql<number>`count(*)`,
              })
              .from(flashcardCards)
              .where(
                and(
                  inArray(flashcardCards.deckId, deckIds),
                  eq(flashcardCards.isActive, true),
                ),
              )
              .groupBy(flashcardCards.deckId)
          : [];

      const countMap = new Map(
        cardCounts.map((item) => [item.deckId, Number(item.count)]),
      );

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(flashcardDecks)
        .where(whereCondition);

      const tagsMap = new Map<
        string,
        Array<{ id: string; name: string; slug: string }>
      >();
      if (deckIds.length > 0) {
        const links = await db.query.flashcardDeckTags.findMany({
          where: { deckId: { in: deckIds } },
        });
        const tagIds = [...new Set(links.map((l2) => l2.tagId))];
        const tags =
          tagIds.length > 0
            ? await db.query.flashcardTags.findMany({
                where: { id: { in: tagIds } },
              })
            : [];

        const tagById = new Map(tags.map((tag) => [tag.id, tag]));
        for (const link of links) {
          const tag = tagById.get(link.tagId);
          if (!tag) continue;
          const existing = tagsMap.get(link.deckId) ?? [];
          existing.push({ id: tag.id, name: tag.name, slug: tag.slug });
          tagsMap.set(link.deckId, existing);
        }
      }

      const totalCount = Number(count || 0);
      const totalPages = Math.ceil(totalCount / l);

      return {
        success: true,
        data: rows.map((row) => ({
          ...row,
          cardCount: countMap.get(row.id) ?? 0,
          tags: tagsMap.get(row.id) ?? [],
        })),
        metadata: {
          totalCount,
          totalPages,
          currentPage: p,
          limit: l,
          hasMore: p < totalPages,
        },
      };
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        status: t.Optional(deckStatusSchema),
        difficulty: difficultySchema,
        tag: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "List flashcard decks",
      },
    },
  )
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const deck = await db.query.flashcardDecks.findFirst({
        where: { slug, status: "published" },
      });

      if (!deck) {
        set.status = 404;
        return { success: false, error: "Flashcard deck not found" };
      }

      const data = await buildDeckView(deck.id, false);
      return { success: true, data };
    },
    {
      detail: {
        tags: ["Flashcards"],
        summary: "Get flashcard deck by slug",
      },
    },
  )
  .get(
    "/id/:id",
    async ({ params: { id }, user, set }) => {
      const deck = await db.query.flashcardDecks.findFirst({ where: { id } });
      if (!deck) {
        set.status = 404;
        return { success: false, error: "Flashcard deck not found" };
      }

      if (
        deck.status !== "published" &&
        user.role !== "admin" &&
        deck.createdById !== user.id
      ) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const data = await buildDeckView(
        id,
        user.role === "admin" || deck.createdById === user.id,
      );
      return { success: true, data };
    },
    {
      auth: true,
      detail: {
        tags: ["Flashcards"],
        summary: "Get flashcard deck by id",
      },
    },
  )
  .post(
    "/:deckId/sessions",
    async ({ params: { deckId }, body, request, set }) => {
      const deck = await db.query.flashcardDecks.findFirst({
        where: { id: deckId, status: "published" },
      });
      if (!deck) {
        set.status = 404;
        return { success: false, error: "Flashcard deck not found" };
      }

      const user = await currentSessionUser(request.headers);

      const [session] = await db
        .insert(flashcardStudySessions)
        .values({
          deckId,
          userId: user?.id ?? null,
          guestSessionId: body.guestSessionId ?? null,
          metadata: body.metadata ?? null,
        })
        .returning();

      return { success: true, data: session };
    },
    {
      body: t.Object({
        guestSessionId: t.Optional(t.String()),
        metadata: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "Start flashcard study session",
      },
    },
  )
  .get(
    "/:deckId/due",
    async ({ params: { deckId }, request, set }) => {
      const deck = await db.query.flashcardDecks.findFirst({
        where: { id: deckId, status: "published" },
      });
      if (!deck) {
        set.status = 404;
        return { success: false, error: "Flashcard deck not found" };
      }

      const user = await currentSessionUser(request.headers);

      if (!user) {
        const cards = await db.query.flashcardCards.findMany({
          where: { deckId, isActive: true },
          orderBy: { orderNo: "asc" },
        });
        return { success: true, data: cards };
      }

      const states = await db.query.flashcardUserCardStates.findMany({
        where: {
          userId: user.id,
          deckId,
        },
        orderBy: { dueAt: "asc" },
      });

      const now = new Date();
      const dueStateMap = new Map(
        states.filter((s) => s.dueAt <= now).map((s) => [s.cardId, s]),
      );

      const cards = await db.query.flashcardCards.findMany({
        where: { deckId, isActive: true },
        orderBy: { orderNo: "asc" },
      });

      const dueCards = cards.filter((card) => dueStateMap.has(card.id));
      const newCards = cards.filter(
        (card) => !states.some((s) => s.cardId === card.id),
      );
      const fallback = cards.filter(
        (card) => !dueCards.some((c) => c.id === card.id),
      );

      const merged = [...dueCards, ...newCards, ...fallback].slice(
        0,
        deck.maxReviewsPerDay,
      );
      return { success: true, data: merged };
    },
    {
      detail: {
        tags: ["Flashcards"],
        summary: "Get due flashcards for deck",
      },
    },
  )
  .patch(
    "/sessions/:sessionId/review",
    async ({ params: { sessionId }, body, request, set }) => {
      const session = await db.query.flashcardStudySessions.findFirst({
        where: { id: sessionId },
      });
      if (!session) {
        set.status = 404;
        return { success: false, error: "Session not found" };
      }

      const user = await currentSessionUser(request.headers);
      if (session.userId) {
        if (!user || (user.id !== session.userId && user.role !== "admin")) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }
      } else if (
        session.guestSessionId &&
        session.guestSessionId !== body.guestSessionId
      ) {
        set.status = 403;
        return { success: false, error: "Invalid guest session" };
      }

      const card = await db.query.flashcardCards.findFirst({
        where: { id: body.cardId, deckId: session.deckId },
      });
      if (!card) {
        set.status = 400;
        return { success: false, error: "Card does not belong to this deck" };
      }

      const deck = await db.query.flashcardDecks.findFirst({
        where: { id: session.deckId },
      });
      if (!deck) {
        set.status = 404;
        return { success: false, error: "Deck not found" };
      }

      const now = new Date();
      let nextState: FlashcardSrsState | null = null;

      await db.transaction(async (tx) => {
        if (session.userId) {
          const sessionUserId = session.userId;
          const existing = await tx.query.flashcardUserCardStates.findFirst({
            where: { userId: sessionUserId, cardId: body.cardId },
          });

          nextState = computeNextState({
            policy: {
              srsAlgorithm: deck.srsAlgorithm,
              learningSteps: deck.learningSteps,
              graduatingIntervalDays: deck.graduatingIntervalDays,
              easyIntervalDays: deck.easyIntervalDays,
            },
            previous: existing
              ? {
                  state: existing.state,
                  dueAt: existing.dueAt,
                  stability: existing.stability,
                  difficulty: existing.difficulty,
                  easeFactor: existing.easeFactor,
                  intervalDays: existing.intervalDays,
                  repetition: existing.repetition,
                  lapses: existing.lapses,
                  lastReviewedAt: existing.lastReviewedAt,
                }
              : null,
            rating: body.rating,
            now,
          });

          if (existing) {
            await tx
              .update(flashcardUserCardStates)
              .set({
                state: nextState.state,
                dueAt: nextState.dueAt,
                stability: nextState.stability,
                difficulty: nextState.difficulty,
                easeFactor: nextState.easeFactor,
                intervalDays: nextState.intervalDays,
                repetition: nextState.repetition,
                lapses: nextState.lapses,
                lastReviewedAt: nextState.lastReviewedAt,
              })
              .where(eq(flashcardUserCardStates.id, existing.id));
          } else {
            await tx.insert(flashcardUserCardStates).values({
              userId: sessionUserId,
              deckId: session.deckId,
              cardId: body.cardId,
              state: nextState.state,
              dueAt: nextState.dueAt,
              stability: nextState.stability,
              difficulty: nextState.difficulty,
              easeFactor: nextState.easeFactor,
              intervalDays: nextState.intervalDays,
              repetition: nextState.repetition,
              lapses: nextState.lapses,
              lastReviewedAt: nextState.lastReviewedAt,
            });
          }
        }

        await tx.insert(flashcardReviews).values({
          sessionId,
          deckId: session.deckId,
          cardId: body.cardId,
          userId: session.userId,
          rating: body.rating,
          responseMs: body.responseMs ?? null,
          wasRecalled: isRatingRecalled(body.rating),
          reviewedAt: now,
          scheduledDueAt: nextState?.dueAt ?? null,
        });

        const nextCardsStudied = session.cardsStudied + 1;
        const nextCorrect =
          session.correctCount + (isRatingRecalled(body.rating) ? 1 : 0);
        const nextAccuracy =
          nextCardsStudied > 0
            ? Math.round((nextCorrect / nextCardsStudied) * 100)
            : 0;

        await tx
          .update(flashcardStudySessions)
          .set({
            cardsStudied: nextCardsStudied,
            correctCount: nextCorrect,
            accuracyPercentage: nextAccuracy,
          })
          .where(eq(flashcardStudySessions.id, sessionId));
      });

      return {
        success: true,
        data: {
          scheduledState: nextState,
        },
      };
    },
    {
      body: t.Object({
        cardId: t.String(),
        rating: reviewRatingSchema,
        responseMs: t.Optional(t.Number()),
        guestSessionId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "Submit flashcard review",
      },
    },
  )
  .post(
    "/sessions/:sessionId/complete",
    async ({ params: { sessionId }, body, request, set }) => {
      const session = await db.query.flashcardStudySessions.findFirst({
        where: { id: sessionId },
      });
      if (!session) {
        set.status = 404;
        return { success: false, error: "Session not found" };
      }

      const user = await currentSessionUser(request.headers);
      if (session.userId) {
        if (!user || (user.id !== session.userId && user.role !== "admin")) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }
      } else if (
        session.guestSessionId &&
        session.guestSessionId !== body.guestSessionId
      ) {
        set.status = 403;
        return { success: false, error: "Invalid guest session" };
      }

      const [updated] = await db
        .update(flashcardStudySessions)
        .set({
          status: "completed",
          completedAt: new Date(),
          timeSpentSeconds: body.timeSpentSeconds ?? session.timeSpentSeconds,
        })
        .where(eq(flashcardStudySessions.id, sessionId))
        .returning();

      return { success: true, data: updated };
    },
    {
      body: t.Object({
        timeSpentSeconds: t.Optional(t.Number()),
        guestSessionId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "Complete flashcard study session",
      },
    },
  )
  .get(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, query, request, set }) => {
      const session = await db.query.flashcardStudySessions.findFirst({
        where: { id: sessionId },
      });
      if (!session) {
        set.status = 404;
        return { success: false, error: "Session not found" };
      }

      const user = await currentSessionUser(request.headers);

      if (session.userId) {
        if (!user || (user.role !== "admin" && session.userId !== user.id)) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }
      } else if (
        session.guestSessionId &&
        session.guestSessionId !== query.guestSessionId
      ) {
        set.status = 403;
        return { success: false, error: "Invalid guest session" };
      }

      const reviews = await db.query.flashcardReviews.findMany({
        where: { sessionId },
        orderBy: { reviewedAt: "asc" },
      });

      return {
        success: true,
        data: {
          ...session,
          reviews,
        },
      };
    },
    {
      query: t.Object({
        guestSessionId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "Get flashcard study session",
      },
    },
  )
  .delete(
    "/sessions/:sessionId",
    async ({ params: { sessionId }, request, body, set }) => {
      const session = await db.query.flashcardStudySessions.findFirst({
        where: { id: sessionId },
      });
      if (!session) {
        set.status = 404;
        return { success: false, error: "Session not found" };
      }

      const user = await currentSessionUser(request.headers);
      if (session.userId) {
        if (!user || (user.id !== session.userId && user.role !== "admin")) {
          set.status = 403;
          return { success: false, error: "Unauthorized" };
        }
      } else if (
        session.guestSessionId &&
        session.guestSessionId !== body.guestSessionId
      ) {
        set.status = 403;
        return { success: false, error: "Invalid guest session" };
      }

      await db
        .delete(flashcardStudySessions)
        .where(eq(flashcardStudySessions.id, sessionId));
      return { success: true };
    },
    {
      body: t.Object({
        guestSessionId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "Delete flashcard study session",
      },
    },
  )
  .get(
    "/:deckId/sessions",
    async ({ params: { deckId }, user, query }) => {
      const where =
        user.role === "admin" && query.userId
          ? { deckId, userId: query.userId }
          : { deckId, userId: user.id };

      const sessions = await db.query.flashcardStudySessions.findMany({
        where,
        orderBy: { startedAt: "desc" },
      });

      return { success: true, data: sessions };
    },
    {
      auth: true,
      query: t.Object({
        userId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Flashcards"],
        summary: "List study sessions by deck",
      },
    },
  )
  .group("/admin", (app) =>
    app
      .post(
        "/",
        async ({ body, user }) => {
          const slug = await uniqueDeckSlug(body.slug ?? body.title);
          const [created] = await db
            .insert(flashcardDecks)
            .values({
              slug,
              title: body.title,
              description: body.description ?? null,
              status: body.status ?? "draft",
              difficulty: body.difficulty ?? null,
              estimatedMinutes: body.estimatedMinutes ?? null,
              language: body.language ?? null,
              srsAlgorithm: body.srsAlgorithm ?? "sm2",
              newCardsPerDay: body.newCardsPerDay ?? 20,
              maxReviewsPerDay: body.maxReviewsPerDay ?? 200,
              learningSteps: body.learningSteps ?? [1, 10],
              graduatingIntervalDays: body.graduatingIntervalDays ?? 1,
              easyIntervalDays: body.easyIntervalDays ?? 4,
              createdById: user.id,
              updatedById: user.id,
            })
            .returning();

          return { success: true, data: created };
        },
        {
          role: "admin",
          body: t.Object({
            slug: t.Optional(t.String()),
            title: t.String({ minLength: 1 }),
            description: t.Optional(t.String()),
            status: t.Optional(deckStatusSchema),
            difficulty: difficultySchema,
            estimatedMinutes: t.Optional(t.Number()),
            language: t.Optional(t.String()),
            srsAlgorithm: t.Optional(algorithmSchema),
            newCardsPerDay: t.Optional(t.Number()),
            maxReviewsPerDay: t.Optional(t.Number()),
            learningSteps: t.Optional(t.Array(t.Number())),
            graduatingIntervalDays: t.Optional(t.Number()),
            easyIntervalDays: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Create flashcard deck",
          },
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, user, set }) => {
          const existing = await db.query.flashcardDecks.findFirst({
            where: { id },
          });
          if (!existing) {
            set.status = 404;
            return { success: false, error: "Flashcard deck not found" };
          }

          const slug = body.slug
            ? await uniqueDeckSlug(body.slug, id)
            : existing.slug;

          const [updated] = await db
            .update(flashcardDecks)
            .set({
              slug,
              title: body.title ?? existing.title,
              description: body.description ?? existing.description,
              status: body.status ?? existing.status,
              difficulty: body.difficulty ?? existing.difficulty,
              estimatedMinutes:
                body.estimatedMinutes ?? existing.estimatedMinutes,
              language: body.language ?? existing.language,
              srsAlgorithm: body.srsAlgorithm ?? existing.srsAlgorithm,
              newCardsPerDay: body.newCardsPerDay ?? existing.newCardsPerDay,
              maxReviewsPerDay:
                body.maxReviewsPerDay ?? existing.maxReviewsPerDay,
              learningSteps: body.learningSteps ?? existing.learningSteps,
              graduatingIntervalDays:
                body.graduatingIntervalDays ?? existing.graduatingIntervalDays,
              easyIntervalDays:
                body.easyIntervalDays ?? existing.easyIntervalDays,
              updatedById: user.id,
              version: existing.version + 1,
            })
            .where(eq(flashcardDecks.id, id))
            .returning();

          return { success: true, data: updated };
        },
        {
          role: "admin",
          body: t.Object({
            slug: t.Optional(t.String()),
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            status: t.Optional(deckStatusSchema),
            difficulty: difficultySchema,
            estimatedMinutes: t.Optional(t.Number()),
            language: t.Optional(t.String()),
            srsAlgorithm: t.Optional(algorithmSchema),
            newCardsPerDay: t.Optional(t.Number()),
            maxReviewsPerDay: t.Optional(t.Number()),
            learningSteps: t.Optional(t.Array(t.Number())),
            graduatingIntervalDays: t.Optional(t.Number()),
            easyIntervalDays: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Update flashcard deck",
          },
        },
      )
      .delete(
        "/:id",
        async ({ params: { id }, user, set }) => {
          const deck = await db.query.flashcardDecks.findFirst({
            where: { id },
          });
          if (!deck) {
            set.status = 404;
            return { success: false, error: "Flashcard deck not found" };
          }

          const [archived] = await db
            .update(flashcardDecks)
            .set({
              status: "archived",
              updatedById: user.id,
              version: deck.version + 1,
            })
            .where(eq(flashcardDecks.id, id))
            .returning();

          return { success: true, data: archived };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "Archive flashcard deck",
          },
        },
      )
      .post(
        "/:id/publish",
        async ({ params: { id }, user, set }) => {
          const deck = await db.query.flashcardDecks.findFirst({
            where: { id },
          });
          if (!deck) {
            set.status = 404;
            return { success: false, error: "Flashcard deck not found" };
          }

          const cards = await db.query.flashcardCards.findMany({
            where: { deckId: id, isActive: true },
            orderBy: { orderNo: "asc" },
          });

          const validation = validateDeck(cards);
          if (!validation.valid) {
            set.status = 400;
            return {
              success: false,
              error: "Deck content validation failed",
              data: validation,
            };
          }

          const [published] = await db
            .update(flashcardDecks)
            .set({
              status: "published",
              publishedAt: new Date(),
              updatedById: user.id,
              version: deck.version + 1,
            })
            .where(eq(flashcardDecks.id, id))
            .returning();

          return { success: true, data: published };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "Publish flashcard deck",
          },
        },
      )
      .post(
        "/:id/unpublish",
        async ({ params: { id }, user, set }) => {
          const deck = await db.query.flashcardDecks.findFirst({
            where: { id },
          });
          if (!deck) {
            set.status = 404;
            return { success: false, error: "Flashcard deck not found" };
          }

          const [updated] = await db
            .update(flashcardDecks)
            .set({
              status: "draft",
              updatedById: user.id,
              version: deck.version + 1,
            })
            .where(eq(flashcardDecks.id, id))
            .returning();

          return { success: true, data: updated };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "Unpublish flashcard deck",
          },
        },
      )
      .post(
        "/:id/clone",
        async ({ params: { id }, body, user, set }) => {
          const source = await buildDeckView(id, true);
          if (!source) {
            set.status = 404;
            return { success: false, error: "Flashcard deck not found" };
          }

          const slug = await uniqueDeckSlug(body.slug ?? `${source.slug}-copy`);
          const [created] = await db
            .insert(flashcardDecks)
            .values({
              slug,
              title: body.title ?? `${source.title} (Copy)`,
              description: source.description,
              status: "draft",
              difficulty: source.difficulty,
              estimatedMinutes: source.estimatedMinutes,
              language: source.language,
              srsAlgorithm: source.srsAlgorithm,
              newCardsPerDay: source.newCardsPerDay,
              maxReviewsPerDay: source.maxReviewsPerDay,
              learningSteps: source.learningSteps,
              graduatingIntervalDays: source.graduatingIntervalDays,
              easyIntervalDays: source.easyIntervalDays,
              createdById: user.id,
              updatedById: user.id,
            })
            .returning();

          await db.insert(flashcardCards).values(
            source.cards.map((card) => ({
              deckId: created.id,
              orderNo: card.orderNo,
              front: card.front,
              back: card.back,
              hint: card.hint,
              explanation: card.explanation,
              media: card.media,
              isActive: card.isActive,
            })),
          );

          if (source.tags.length > 0) {
            await db.insert(flashcardDeckTags).values(
              source.tags.map((tag) => ({
                deckId: created.id,
                tagId: tag.id,
              })),
            );
          }

          return { success: true, data: created };
        },
        {
          role: "admin",
          body: t.Object({
            title: t.Optional(t.String()),
            slug: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Clone flashcard deck",
          },
        },
      )
      .get(
        "/deck/:deckId/cards",
        async ({ params: { deckId } }) => {
          const cards = await db.query.flashcardCards.findMany({
            where: { deckId },
            orderBy: { orderNo: "asc" },
          });
          return { success: true, data: cards };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "List flashcard cards",
          },
        },
      )
      .post(
        "/deck/:deckId/cards",
        async ({ params: { deckId }, body }) => {
          const [created] = await db
            .insert(flashcardCards)
            .values({
              deckId,
              orderNo: body.orderNo,
              front: body.front,
              back: body.back,
              hint: body.hint ?? null,
              explanation: body.explanation ?? null,
              media: body.media ?? null,
              isActive: body.isActive ?? true,
            })
            .returning();

          return { success: true, data: created };
        },
        {
          role: "admin",
          body: t.Object({
            orderNo: t.Number(),
            front: t.String({ minLength: 1 }),
            back: t.String({ minLength: 1 }),
            hint: t.Optional(t.String()),
            explanation: t.Optional(t.String()),
            media: t.Optional(t.Any()),
            isActive: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Create flashcard card",
          },
        },
      )
      .patch(
        "/cards/:cardId",
        async ({ params: { cardId }, body, set }) => {
          const card = await db.query.flashcardCards.findFirst({
            where: { id: cardId },
          });
          if (!card) {
            set.status = 404;
            return { success: false, error: "Card not found" };
          }

          const [updated] = await db
            .update(flashcardCards)
            .set({
              orderNo: body.orderNo ?? card.orderNo,
              front: body.front ?? card.front,
              back: body.back ?? card.back,
              hint: body.hint ?? card.hint,
              explanation: body.explanation ?? card.explanation,
              media: body.media ?? card.media,
              isActive: body.isActive ?? card.isActive,
            })
            .where(eq(flashcardCards.id, cardId))
            .returning();

          return { success: true, data: updated };
        },
        {
          role: "admin",
          body: t.Object({
            orderNo: t.Optional(t.Number()),
            front: t.Optional(t.String()),
            back: t.Optional(t.String()),
            hint: t.Optional(t.String()),
            explanation: t.Optional(t.String()),
            media: t.Optional(t.Any()),
            isActive: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Update flashcard card",
          },
        },
      )
      .delete(
        "/cards/:cardId",
        async ({ params: { cardId }, set }) => {
          const card = await db.query.flashcardCards.findFirst({
            where: { id: cardId },
          });
          if (!card) {
            set.status = 404;
            return { success: false, error: "Card not found" };
          }
          await db.delete(flashcardCards).where(eq(flashcardCards.id, cardId));
          return { success: true };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "Delete flashcard card",
          },
        },
      )
      .patch(
        "/deck/:deckId/cards/reorder",
        async ({ params: { deckId }, body, set }) => {
          const ids = body.updates.map((u) => u.cardId);
          const cards = await db.query.flashcardCards.findMany({
            where: { deckId, id: { in: ids } },
            columns: { id: true },
          });

          if (cards.length !== ids.length) {
            set.status = 400;
            return {
              success: false,
              error: "Some cards do not belong to deck",
            };
          }

          for (const update of body.updates) {
            await db
              .update(flashcardCards)
              .set({ orderNo: update.orderNo })
              .where(eq(flashcardCards.id, update.cardId));
          }

          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            updates: t.Array(
              t.Object({
                cardId: t.String(),
                orderNo: t.Number(),
              }),
              { minItems: 1 },
            ),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Reorder flashcard cards",
          },
        },
      )
      .post(
        "/deck/:deckId/cards/bulk-upsert",
        async ({ params: { deckId }, body }) => {
          const results: Array<{
            orderNo: number;
            operation: string;
            success: boolean;
          }> = [];
          const errors: Array<{ orderNo: number; error: string }> = [];

          for (const card of body.cards) {
            try {
              if (card.id) {
                await db
                  .update(flashcardCards)
                  .set({
                    orderNo: card.orderNo,
                    front: card.front,
                    back: card.back,
                    hint: card.hint ?? null,
                    explanation: card.explanation ?? null,
                    media: card.media ?? null,
                    isActive: card.isActive ?? true,
                  })
                  .where(eq(flashcardCards.id, card.id));

                results.push({
                  orderNo: card.orderNo,
                  operation: "update",
                  success: true,
                });
              } else {
                await db.insert(flashcardCards).values({
                  deckId,
                  orderNo: card.orderNo,
                  front: card.front,
                  back: card.back,
                  hint: card.hint ?? null,
                  explanation: card.explanation ?? null,
                  media: card.media ?? null,
                  isActive: card.isActive ?? true,
                });
                results.push({
                  orderNo: card.orderNo,
                  operation: "create",
                  success: true,
                });
              }
            } catch (error) {
              errors.push({
                orderNo: card.orderNo,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }

          return {
            success: true,
            data: {
              results,
              errors,
              summary: {
                total: body.cards.length,
                successful: results.length,
                failed: errors.length,
              },
            },
          };
        },
        {
          role: "admin",
          body: t.Object({
            cards: t.Array(
              t.Object({
                id: t.Optional(t.String()),
                orderNo: t.Number(),
                front: t.String({ minLength: 1 }),
                back: t.String({ minLength: 1 }),
                hint: t.Optional(t.String()),
                explanation: t.Optional(t.String()),
                media: t.Optional(t.Any()),
                isActive: t.Optional(t.Boolean()),
              }),
              { minItems: 1 },
            ),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Bulk upsert flashcard cards",
          },
        },
      )
      .get(
        "/tags",
        async () => {
          const tags = await db.query.flashcardTags.findMany({
            orderBy: { name: "asc" },
          });
          return { success: true, data: tags };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "List flashcard tags",
          },
        },
      )
      .post(
        "/tags",
        async ({ body }) => {
          const slug = baseDeckSlug(body.slug ?? body.name);
          const [created] = await db
            .insert(flashcardTags)
            .values({
              name: body.name,
              slug,
            })
            .returning();
          return { success: true, data: created };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String({ minLength: 1 }),
            slug: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Create flashcard tag",
          },
        },
      )
      .patch(
        "/tags/:tagId",
        async ({ params: { tagId }, body, set }) => {
          const tag = await db.query.flashcardTags.findFirst({
            where: { id: tagId },
          });
          if (!tag) {
            set.status = 404;
            return { success: false, error: "Tag not found" };
          }

          const [updated] = await db
            .update(flashcardTags)
            .set({
              name: body.name ?? tag.name,
              slug: body.slug ? baseDeckSlug(body.slug) : tag.slug,
            })
            .where(eq(flashcardTags.id, tagId))
            .returning();

          return { success: true, data: updated };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            slug: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Update flashcard tag",
          },
        },
      )
      .delete(
        "/tags/:tagId",
        async ({ params: { tagId }, set }) => {
          const tag = await db.query.flashcardTags.findFirst({
            where: { id: tagId },
          });
          if (!tag) {
            set.status = 404;
            return { success: false, error: "Tag not found" };
          }

          await db.delete(flashcardTags).where(eq(flashcardTags.id, tagId));
          return { success: true };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "Delete flashcard tag",
          },
        },
      )
      .patch(
        "/deck/:deckId/tags",
        async ({ params: { deckId }, body }) => {
          await db
            .delete(flashcardDeckTags)
            .where(eq(flashcardDeckTags.deckId, deckId));

          if (body.tagIds.length > 0) {
            await db.insert(flashcardDeckTags).values(
              body.tagIds.map((tagId) => ({
                deckId,
                tagId,
              })),
            );
          }

          const tags = await getDeckTags(deckId);
          return { success: true, data: tags };
        },
        {
          role: "admin",
          body: t.Object({
            tagIds: t.Array(t.String()),
          }),
          detail: {
            tags: ["Flashcards"],
            summary: "Assign tags to flashcard deck",
          },
        },
      )
      .get(
        "/deck/:deckId/validate",
        async ({ params: { deckId }, set }) => {
          const cards = await db.query.flashcardCards.findMany({
            where: { deckId, isActive: true },
            orderBy: { orderNo: "asc" },
          });

          if (!cards) {
            set.status = 404;
            return { success: false, error: "Deck not found" };
          }

          return {
            success: true,
            data: validateDeck(cards),
          };
        },
        {
          role: "admin",
          detail: {
            tags: ["Flashcards"],
            summary: "Validate flashcard deck content",
          },
        },
      ),
  );
