import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import slugify from "slugify";
import { db } from "@/server/db";
import {
  quizAttemptAnswers,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

const quizStatusSchema = t.Enum({
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

const questionTypeSchema = t.Enum({
  single_choice: "single_choice",
});

async function buildQuizView(quizId: string, includeCorrect = false) {
  const quiz = await db.query.quizzes.findFirst({
    where: { id: quizId },
  });
  if (!quiz) return null;

  const questions = await db.query.quizQuestions.findMany({
    where: { quizId: quiz.id, isActive: true },
    orderBy: { orderNo: "asc" },
  });

  const questionIds = questions.map((q) => q.id);
  const options =
    questionIds.length > 0
      ? await db.query.quizOptions.findMany({
          where: { questionId: { in: questionIds } },
          orderBy: { orderNo: "asc" },
        })
      : [];

  return {
    ...quiz,
    questions: questions.map((question) => ({
      ...question,
      options: options
        .filter((option) => option.questionId === question.id)
        .map((option) =>
          includeCorrect ? option : { ...option, isCorrect: undefined },
        ),
    })),
  };
}

function hasSingleCorrect(options: Array<{ isCorrect: boolean }>) {
  return options.filter((option) => option.isCorrect).length === 1;
}

async function generateUniqueSlug(value: string, excludeId?: string) {
  const base = slugify(value, { lower: true, strict: true }) || "quiz";
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await db.query.quizzes.findFirst({
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

export const quizRoutes = new Elysia({ prefix: "/quizzes" })
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

      const whereCondition = and(
        eq(quizzes.status, status),
        query.search ? ilike(quizzes.title, `%${query.search}%`) : undefined,
      );

      const rows = await db
        .select()
        .from(quizzes)
        .where(whereCondition)
        .orderBy(desc(quizzes.createdAt))
        .limit(l)
        .offset(offset);

      const quizIds = rows.map((row) => row.id);
      const questionCounts =
        quizIds.length > 0
          ? await db
              .select({
                quizId: quizQuestions.quizId,
                count: sql<number>`count(*)`,
              })
              .from(quizQuestions)
              .where(inArray(quizQuestions.quizId, quizIds))
              .groupBy(quizQuestions.quizId)
          : [];

      const countMap = new Map(
        questionCounts.map((item) => [item.quizId, Number(item.count)]),
      );

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizzes)
        .where(whereCondition);

      const totalCount = Number(count || 0);
      const totalPages = Math.ceil(totalCount / l);

      return {
        success: true,
        data: rows.map((row) => ({
          ...row,
          questionCount: countMap.get(row.id) ?? 0,
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
        status: t.Optional(quizStatusSchema),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "List quizzes",
      },
    },
  )
  .get(
    "/slug/:slug",
    async ({ params: { slug }, set }) => {
      const quiz = await db.query.quizzes.findFirst({
        where: { slug, status: "published" },
      });

      if (!quiz) {
        set.status = 404;
        return { success: false, error: "Quiz not found" };
      }

      // Include correctness metadata so client can reveal correct answer after selection.
      const data = await buildQuizView(quiz.id, true);
      return { success: true, data };
    },
    {
      detail: {
        tags: ["Quizzes"],
        summary: "Get quiz by slug",
      },
    },
  )
  .get(
    "/id/:id",
    async ({ params: { id }, user, set }) => {
      const quiz = await db.query.quizzes.findFirst({ where: { id } });
      if (!quiz) {
        set.status = 404;
        return { success: false, error: "Quiz not found" };
      }

      if (
        quiz.status !== "published" &&
        user.role !== "admin" &&
        quiz.createdById !== user.id
      ) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const data = await buildQuizView(
        id,
        user.role === "admin" || quiz.createdById === user.id,
      );
      return { success: true, data };
    },
    {
      auth: true,
      detail: {
        tags: ["Quizzes"],
        summary: "Get quiz by id",
      },
    },
  )
  .post(
    "/quiz/:quizId/attempts",
    async ({ params: { quizId }, body, user, set }) => {
      const quiz = await db.query.quizzes.findFirst({
        where: { id: quizId, status: "published" },
      });
      if (!quiz) {
        set.status = 404;
        return { success: false, error: "Quiz not found" };
      }

      const resumable = await db.query.quizAttempts.findFirst({
        where: { quizId, userId: user.id, status: "in_progress" },
        orderBy: { startedAt: "desc" },
      });
      if (resumable) {
        const answers = await db.query.quizAttemptAnswers.findMany({
          where: { attemptId: resumable.id },
        });
        return {
          success: true,
          data: { ...resumable, answers, resumed: true },
        };
      }

      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(quizQuestions)
        .where(
          and(
            eq(quizQuestions.quizId, quizId),
            eq(quizQuestions.isActive, true),
          ),
        );

      const [attempt] = await db
        .insert(quizAttempts)
        .values({
          quizId,
          userId: user.id,
          guestSessionId: body.guestSessionId ?? null,
          metadata: body.metadata ?? null,
          totalQuestions: Number(count || 0),
        })
        .returning();

      return {
        success: true,
        data: { ...attempt, answers: [], resumed: false },
      };
    },
    {
      auth: true,
      body: t.Object({
        guestSessionId: t.Optional(t.String()),
        metadata: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Start quiz attempt",
      },
    },
  )
  .patch(
    "/attempts/:attemptId/answer",
    async ({ params: { attemptId }, body, user, set }) => {
      const attempt = await db.query.quizAttempts.findFirst({
        where: { id: attemptId },
      });
      if (!attempt) {
        set.status = 404;
        return { success: false, error: "Attempt not found" };
      }
      if (
        attempt.userId &&
        attempt.userId !== user.id &&
        user.role !== "admin"
      ) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const question = await db.query.quizQuestions.findFirst({
        where: { id: body.questionId, quizId: attempt.quizId },
      });
      if (!question) {
        set.status = 400;
        return {
          success: false,
          error: "Question does not belong to this quiz",
        };
      }

      const options = await db.query.quizOptions.findMany({
        where: { questionId: body.questionId },
      });
      const validOptionIds = new Set(options.map((o) => o.id));
      const selected = body.selectedOptionIds.filter((id) =>
        validOptionIds.has(id),
      );
      if (
        selected.length !== body.selectedOptionIds.length ||
        selected.length === 0
      ) {
        set.status = 400;
        return { success: false, error: "Invalid option ids" };
      }

      const correct = options.find((option) => option.isCorrect);
      const isCorrect = selected.length === 1 && selected[0] === correct?.id;

      const existing = await db.query.quizAttemptAnswers.findFirst({
        where: { attemptId, questionId: body.questionId },
      });

      const payload = {
        selectedOptionIds: selected,
        isCorrect,
        answeredAt: new Date(),
        timeSpentSeconds: body.timeSpentSeconds ?? 0,
      };

      const answer = existing
        ? (
            await db
              .update(quizAttemptAnswers)
              .set(payload)
              .where(eq(quizAttemptAnswers.id, existing.id))
              .returning()
          )[0]
        : (
            await db
              .insert(quizAttemptAnswers)
              .values({
                attemptId,
                questionId: body.questionId,
                ...payload,
              })
              .returning()
          )[0];

      if (body.confidence) {
        const metadata = (attempt.metadata ?? {}) as Record<string, unknown>;
        const confidenceByQuestion = {
          ...((metadata.confidenceByQuestion ?? {}) as Record<string, number>),
          [body.questionId]: body.confidence,
        };
        await db
          .update(quizAttempts)
          .set({ metadata: { ...metadata, confidenceByQuestion } })
          .where(eq(quizAttempts.id, attemptId));
      }

      return { success: true, data: answer };
    },
    {
      auth: true,
      body: t.Object({
        questionId: t.String(),
        selectedOptionIds: t.Array(t.String(), { minItems: 1 }),
        timeSpentSeconds: t.Optional(t.Number()),
        confidence: t.Optional(t.Integer({ minimum: 1, maximum: 3 })),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Upsert attempt answer",
      },
    },
  )
  .post(
    "/attempts/:attemptId/complete",
    async ({ params: { attemptId }, body, user, set }) => {
      const attempt = await db.query.quizAttempts.findFirst({
        where: { id: attemptId },
      });
      if (!attempt) {
        set.status = 404;
        return { success: false, error: "Attempt not found" };
      }
      if (
        attempt.userId &&
        attempt.userId !== user.id &&
        user.role !== "admin"
      ) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const answers = await db.query.quizAttemptAnswers.findMany({
        where: { attemptId },
      });
      const score = answers.filter((answer) => answer.isCorrect).length;
      const totalQuestions = attempt.totalQuestions || answers.length;
      const percentage =
        totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

      const [updated] = await db
        .update(quizAttempts)
        .set({
          status: "completed",
          completedAt: new Date(),
          score,
          totalQuestions,
          percentage,
          timeSpentSeconds: body.timeSpentSeconds ?? attempt.timeSpentSeconds,
        })
        .where(eq(quizAttempts.id, attemptId))
        .returning();

      return { success: true, data: updated };
    },
    {
      auth: true,
      body: t.Object({
        timeSpentSeconds: t.Optional(t.Number()),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Complete quiz attempt",
      },
    },
  )
  .get(
    "/attempts/:attemptId",
    async ({ params: { attemptId }, user, set }) => {
      const attempt = await db.query.quizAttempts.findFirst({
        where: { id: attemptId },
      });
      if (!attempt) {
        set.status = 404;
        return { success: false, error: "Attempt not found" };
      }

      if (
        user.role !== "admin" &&
        attempt.userId &&
        attempt.userId !== user.id
      ) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const answers = await db.query.quizAttemptAnswers.findMany({
        where: { attemptId },
      });
      return {
        success: true,
        data: {
          ...attempt,
          answers,
        },
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Quizzes"],
        summary: "Get attempt by id",
      },
    },
  )
  .delete(
    "/attempts/:attemptId",
    async ({ params: { attemptId }, user, set }) => {
      const attempt = await db.query.quizAttempts.findFirst({
        where: { id: attemptId },
      });
      if (!attempt) {
        set.status = 404;
        return { success: false, error: "Attempt not found" };
      }

      if (
        user.role !== "admin" &&
        attempt.userId &&
        attempt.userId !== user.id
      ) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      await db.delete(quizAttempts).where(eq(quizAttempts.id, attemptId));
      return { success: true };
    },
    {
      auth: true,
      detail: {
        tags: ["Quizzes"],
        summary: "Delete attempt by id",
      },
    },
  )
  .get(
    "/quiz/:quizId/my-attempts",
    async ({ params: { quizId }, user }) => {
      const attempts = await db.query.quizAttempts.findMany({
        where: { quizId, userId: user.id },
        orderBy: { startedAt: "desc" },
      });
      return { success: true, data: attempts };
    },
    {
      auth: true,
      detail: {
        tags: ["Quizzes"],
        summary: "List current user's attempts by quiz",
      },
    },
  )
  .get(
    "/quiz/:quizId/study-profile",
    async ({ params: { quizId }, user }) => {
      const attempts = await db.query.quizAttempts.findMany({
        where: { quizId, userId: user.id },
        orderBy: { startedAt: "desc" },
      });
      const attemptIds = attempts.map((attempt) => attempt.id);
      const answers =
        attemptIds.length > 0
          ? await db.query.quizAttemptAnswers.findMany({
              where: { attemptId: { in: attemptIds } },
            })
          : [];
      const attemptsById = new Map(
        attempts.map((attempt) => [attempt.id, attempt]),
      );
      const questionHistory: Record<
        string,
        {
          attempts: number;
          correct: number;
          totalResponseSeconds: number;
          confidenceTotal: number;
          confidenceCount: number;
          lastCorrect: boolean | null;
          latestAnsweredAt: number;
        }
      > = {};

      for (const answer of answers) {
        const current = questionHistory[answer.questionId] ?? {
          attempts: 0,
          correct: 0,
          totalResponseSeconds: 0,
          confidenceTotal: 0,
          confidenceCount: 0,
          lastCorrect: null,
          latestAnsweredAt: 0,
        };
        current.attempts += 1;
        current.correct += answer.isCorrect ? 1 : 0;
        current.totalResponseSeconds += answer.timeSpentSeconds;
        const attempt = attemptsById.get(answer.attemptId);
        const metadata = (attempt?.metadata ?? {}) as Record<string, unknown>;
        const confidence = (
          (metadata.confidenceByQuestion ?? {}) as Record<string, number>
        )[answer.questionId];
        if (confidence) {
          current.confidenceTotal += confidence;
          current.confidenceCount += 1;
        }
        const answeredAt = new Date(answer.answeredAt).getTime();
        if (answeredAt >= current.latestAnsweredAt) {
          current.latestAnsweredAt = answeredAt;
          current.lastCorrect = answer.isCorrect;
        }
        questionHistory[answer.questionId] = current;
      }

      const completedAttempts = attempts.filter(
        (attempt) => attempt.status === "completed",
      ).length;
      const correctAnswers = answers.filter(
        (answer) => answer.isCorrect,
      ).length;
      const latestMetadata = (attempts[0]?.metadata ?? {}) as Record<
        string,
        unknown
      >;

      return {
        success: true,
        data: {
          questions: Object.fromEntries(
            Object.entries(questionHistory).map(([questionId, history]) => [
              questionId,
              {
                attempts: history.attempts,
                correct: history.correct,
                averageResponseSeconds: Math.round(
                  history.totalResponseSeconds / history.attempts,
                ),
                averageConfidence:
                  history.confidenceCount > 0
                    ? Number(
                        (
                          history.confidenceTotal / history.confidenceCount
                        ).toFixed(1),
                      )
                    : null,
                lastCorrect: history.lastCorrect,
              },
            ]),
          ),
          bookmarkedQuestionIds: Array.isArray(
            latestMetadata.bookmarkedQuestionIds,
          )
            ? latestMetadata.bookmarkedQuestionIds
            : [],
          completedAttempts,
          overallAccuracy:
            answers.length > 0
              ? Math.round((correctAnswers / answers.length) * 100)
              : 0,
        },
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Quizzes"],
        summary: "Get adaptive study profile",
      },
    },
  )
  .patch(
    "/attempts/:attemptId/preferences",
    async ({ params: { attemptId }, body, user, set }) => {
      const attempt = await db.query.quizAttempts.findFirst({
        where: { id: attemptId },
      });
      if (!attempt) {
        set.status = 404;
        return { success: false, error: "Attempt not found" };
      }
      if (attempt.userId !== user.id && user.role !== "admin") {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }
      const metadata = (attempt.metadata ?? {}) as Record<string, unknown>;
      const [updated] = await db
        .update(quizAttempts)
        .set({
          metadata: {
            ...metadata,
            bookmarkedQuestionIds: body.bookmarkedQuestionIds,
          },
        })
        .where(eq(quizAttempts.id, attemptId))
        .returning();
      return { success: true, data: updated };
    },
    {
      auth: true,
      body: t.Object({
        bookmarkedQuestionIds: t.Array(t.String()),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "Update study preferences",
      },
    },
  )
  .get(
    "/quiz/:quizId/attempts",
    async ({ params: { quizId }, query }) => {
      const attempts = await db.query.quizAttempts.findMany({
        where: query.userId ? { quizId, userId: query.userId } : { quizId },
        orderBy: { startedAt: "desc" },
      });
      return { success: true, data: attempts };
    },
    {
      role: "admin",
      query: t.Object({
        userId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Quizzes"],
        summary: "List attempts by quiz",
      },
    },
  )
  .group("/admin", (app) =>
    app
      .post(
        "/",
        async ({ body, user }) => {
          const slug = await generateUniqueSlug(body.slug ?? body.title);
          const [created] = await db
            .insert(quizzes)
            .values({
              slug,
              title: body.title,
              description: body.description ?? null,
              status: body.status ?? "draft",
              difficulty: body.difficulty ?? null,
              estimatedMinutes: body.estimatedMinutes ?? null,
              timeLimitSeconds: body.timeLimitSeconds ?? null,
              passPercentage: body.passPercentage ?? 60,
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
            status: t.Optional(quizStatusSchema),
            difficulty: difficultySchema,
            estimatedMinutes: t.Optional(t.Number()),
            timeLimitSeconds: t.Optional(t.Number()),
            passPercentage: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Create quiz",
          },
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, user, set }) => {
          const existing = await db.query.quizzes.findFirst({ where: { id } });
          if (!existing) {
            set.status = 404;
            return { success: false, error: "Quiz not found" };
          }

          const slug = body.slug
            ? await generateUniqueSlug(body.slug, id)
            : existing.slug;

          const [updated] = await db
            .update(quizzes)
            .set({
              slug,
              title: body.title ?? existing.title,
              description: body.description ?? existing.description,
              status: body.status ?? existing.status,
              difficulty: body.difficulty ?? existing.difficulty,
              estimatedMinutes:
                body.estimatedMinutes ?? existing.estimatedMinutes,
              timeLimitSeconds:
                body.timeLimitSeconds ?? existing.timeLimitSeconds,
              passPercentage: body.passPercentage ?? existing.passPercentage,
              updatedById: user.id,
              version: existing.version + 1,
            })
            .where(eq(quizzes.id, id))
            .returning();
          return { success: true, data: updated };
        },
        {
          role: "admin",
          body: t.Object({
            slug: t.Optional(t.String()),
            title: t.Optional(t.String()),
            description: t.Optional(t.String()),
            status: t.Optional(quizStatusSchema),
            difficulty: difficultySchema,
            estimatedMinutes: t.Optional(t.Number()),
            timeLimitSeconds: t.Optional(t.Number()),
            passPercentage: t.Optional(t.Number()),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Update quiz",
          },
        },
      )
      .delete(
        "/:id",
        async ({ params: { id }, user, set }) => {
          const quiz = await db.query.quizzes.findFirst({ where: { id } });
          if (!quiz) {
            set.status = 404;
            return { success: false, error: "Quiz not found" };
          }

          const [archived] = await db
            .update(quizzes)
            .set({
              status: "archived",
              updatedById: user.id,
              version: quiz.version + 1,
            })
            .where(eq(quizzes.id, id))
            .returning();
          return { success: true, data: archived };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "Archive quiz",
          },
        },
      )
      .post(
        "/:id/publish",
        async ({ params: { id }, user, set }) => {
          const quiz = await db.query.quizzes.findFirst({ where: { id } });
          if (!quiz) {
            set.status = 404;
            return { success: false, error: "Quiz not found" };
          }

          const questions = await db.query.quizQuestions.findMany({
            where: { quizId: id, isActive: true },
            orderBy: { orderNo: "asc" },
          });

          if (questions.length === 0) {
            set.status = 400;
            return {
              success: false,
              error: "Quiz needs at least one question",
            };
          }

          const questionIds = questions.map((question) => question.id);
          const options = await db.query.quizOptions.findMany({
            where: { questionId: { in: questionIds } },
          });

          for (const question of questions) {
            const questionOptions = options.filter(
              (option) => option.questionId === question.id,
            );
            if (!hasSingleCorrect(questionOptions)) {
              set.status = 400;
              return {
                success: false,
                error: `Question ${question.orderNo} must have exactly one correct option`,
              };
            }
          }

          const [published] = await db
            .update(quizzes)
            .set({
              status: "published",
              publishedAt: new Date(),
              updatedById: user.id,
              version: quiz.version + 1,
            })
            .where(eq(quizzes.id, id))
            .returning();
          return { success: true, data: published };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "Publish quiz",
          },
        },
      )
      .post(
        "/:id/unpublish",
        async ({ params: { id }, user, set }) => {
          const quiz = await db.query.quizzes.findFirst({ where: { id } });
          if (!quiz) {
            set.status = 404;
            return { success: false, error: "Quiz not found" };
          }
          const [updated] = await db
            .update(quizzes)
            .set({
              status: "draft",
              updatedById: user.id,
              version: quiz.version + 1,
            })
            .where(eq(quizzes.id, id))
            .returning();
          return { success: true, data: updated };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "Unpublish quiz",
          },
        },
      )
      .get(
        "/quiz/:quizId/questions",
        async ({ params: { quizId } }) => {
          const questions = await db.query.quizQuestions.findMany({
            where: { quizId },
            orderBy: { orderNo: "asc" },
          });
          const questionIds = questions.map((question) => question.id);
          const options =
            questionIds.length > 0
              ? await db.query.quizOptions.findMany({
                  where: { questionId: { in: questionIds } },
                  orderBy: { orderNo: "asc" },
                })
              : [];

          return {
            success: true,
            data: questions.map((question) => ({
              ...question,
              options: options.filter(
                (option) => option.questionId === question.id,
              ),
            })),
          };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "List quiz questions",
          },
        },
      )
      .post(
        "/quiz/:quizId/questions",
        async ({ params: { quizId }, body, set }) => {
          if (!hasSingleCorrect(body.options)) {
            set.status = 400;
            return {
              success: false,
              error:
                "single_choice question must have exactly one correct option",
            };
          }

          const [question] = await db
            .insert(quizQuestions)
            .values({
              quizId,
              orderNo: body.orderNo,
              prompt: body.prompt,
              hint: body.hint ?? null,
              rationale: body.rationale ?? null,
              questionType: body.questionType ?? "single_choice",
              points: body.points ?? 1,
              isActive: body.isActive ?? true,
            })
            .returning();

          await db.insert(quizOptions).values(
            body.options.map((option) => ({
              questionId: question.id,
              orderNo: option.orderNo,
              text: option.text,
              isCorrect: option.isCorrect,
              rationale: option.rationale ?? null,
            })),
          );

          return { success: true, data: question };
        },
        {
          role: "admin",
          body: t.Object({
            orderNo: t.Number(),
            prompt: t.String({ minLength: 1 }),
            hint: t.Optional(t.String()),
            rationale: t.Optional(t.String()),
            questionType: t.Optional(questionTypeSchema),
            points: t.Optional(t.Number()),
            isActive: t.Optional(t.Boolean()),
            options: t.Array(
              t.Object({
                orderNo: t.Number(),
                text: t.String({ minLength: 1 }),
                isCorrect: t.Boolean(),
                rationale: t.Optional(t.String()),
              }),
              { minItems: 2 },
            ),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Create question",
          },
        },
      )
      .patch(
        "/questions/:questionId",
        async ({ params: { questionId }, body, set }) => {
          const question = await db.query.quizQuestions.findFirst({
            where: { id: questionId },
          });
          if (!question) {
            set.status = 404;
            return { success: false, error: "Question not found" };
          }

          const [updated] = await db
            .update(quizQuestions)
            .set({
              orderNo: body.orderNo ?? question.orderNo,
              prompt: body.prompt ?? question.prompt,
              hint: body.hint ?? question.hint,
              rationale: body.rationale ?? question.rationale,
              questionType: body.questionType ?? question.questionType,
              points: body.points ?? question.points,
              isActive: body.isActive ?? question.isActive,
            })
            .where(eq(quizQuestions.id, questionId))
            .returning();
          return { success: true, data: updated };
        },
        {
          role: "admin",
          body: t.Object({
            orderNo: t.Optional(t.Number()),
            prompt: t.Optional(t.String()),
            hint: t.Optional(t.String()),
            rationale: t.Optional(t.String()),
            questionType: t.Optional(questionTypeSchema),
            points: t.Optional(t.Number()),
            isActive: t.Optional(t.Boolean()),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Update question",
          },
        },
      )
      .delete(
        "/questions/:questionId",
        async ({ params: { questionId }, set }) => {
          const existing = await db.query.quizQuestions.findFirst({
            where: { id: questionId },
          });
          if (!existing) {
            set.status = 404;
            return { success: false, error: "Question not found" };
          }
          await db
            .delete(quizQuestions)
            .where(eq(quizQuestions.id, questionId));
          return { success: true };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "Delete question",
          },
        },
      )
      .patch(
        "/quiz/:quizId/questions/reorder",
        async ({ params: { quizId }, body, set }) => {
          const questionIds = body.updates.map((item) => item.questionId);
          const rows = await db.query.quizQuestions.findMany({
            where: { quizId, id: { in: questionIds } },
            columns: { id: true },
          });
          if (rows.length !== questionIds.length) {
            set.status = 400;
            return {
              success: false,
              error: "Some questions do not belong to quiz",
            };
          }

          for (const update of body.updates) {
            await db
              .update(quizQuestions)
              .set({ orderNo: update.orderNo })
              .where(eq(quizQuestions.id, update.questionId));
          }
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            updates: t.Array(
              t.Object({
                questionId: t.String(),
                orderNo: t.Number(),
              }),
              { minItems: 1 },
            ),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Reorder questions",
          },
        },
      )
      .get(
        "/questions/:questionId/options",
        async ({ params: { questionId } }) => {
          const options = await db.query.quizOptions.findMany({
            where: { questionId },
            orderBy: { orderNo: "asc" },
          });
          return { success: true, data: options };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "List question options",
          },
        },
      )
      .post(
        "/questions/:questionId/options",
        async ({ params: { questionId }, body }) => {
          const [created] = await db
            .insert(quizOptions)
            .values({
              questionId,
              orderNo: body.orderNo,
              text: body.text,
              isCorrect: body.isCorrect,
              rationale: body.rationale ?? null,
            })
            .returning();
          return { success: true, data: created };
        },
        {
          role: "admin",
          body: t.Object({
            orderNo: t.Number(),
            text: t.String(),
            isCorrect: t.Boolean(),
            rationale: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Create option",
          },
        },
      )
      .patch(
        "/options/:optionId",
        async ({ params: { optionId }, body, set }) => {
          const option = await db.query.quizOptions.findFirst({
            where: { id: optionId },
          });
          if (!option) {
            set.status = 404;
            return { success: false, error: "Option not found" };
          }

          const [updated] = await db
            .update(quizOptions)
            .set({
              orderNo: body.orderNo ?? option.orderNo,
              text: body.text ?? option.text,
              isCorrect: body.isCorrect ?? option.isCorrect,
              rationale: body.rationale ?? option.rationale,
            })
            .where(eq(quizOptions.id, optionId))
            .returning();
          return { success: true, data: updated };
        },
        {
          role: "admin",
          body: t.Object({
            orderNo: t.Optional(t.Number()),
            text: t.Optional(t.String()),
            isCorrect: t.Optional(t.Boolean()),
            rationale: t.Optional(t.String()),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Update option",
          },
        },
      )
      .delete(
        "/options/:optionId",
        async ({ params: { optionId }, set }) => {
          const option = await db.query.quizOptions.findFirst({
            where: { id: optionId },
          });
          if (!option) {
            set.status = 404;
            return { success: false, error: "Option not found" };
          }
          await db.delete(quizOptions).where(eq(quizOptions.id, optionId));
          return { success: true };
        },
        {
          role: "admin",
          detail: {
            tags: ["Quizzes"],
            summary: "Delete option",
          },
        },
      )
      .patch(
        "/questions/:questionId/options/reorder",
        async ({ params: { questionId }, body, set }) => {
          const optionIds = body.updates.map((item) => item.optionId);
          const rows = await db.query.quizOptions.findMany({
            where: { questionId, id: { in: optionIds } },
            columns: { id: true },
          });
          if (rows.length !== optionIds.length) {
            set.status = 400;
            return {
              success: false,
              error: "Some options do not belong to question",
            };
          }

          for (const update of body.updates) {
            await db
              .update(quizOptions)
              .set({ orderNo: update.orderNo })
              .where(eq(quizOptions.id, update.optionId));
          }
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            updates: t.Array(
              t.Object({
                optionId: t.String(),
                orderNo: t.Number(),
              }),
              { minItems: 1 },
            ),
          }),
          detail: {
            tags: ["Quizzes"],
            summary: "Reorder options",
          },
        },
      ),
  );
