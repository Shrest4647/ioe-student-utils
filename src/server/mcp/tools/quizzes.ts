import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";

const client = api as any;

function getApiKey(ctx: any): string {
  const token = ctx?.authInfo?.token;
  if (!token) {
    throw new Error(
      "MCP Authorization key is not configured. Please contact the owners.",
    );
  }
  return token;
}

function success(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ success: true, data }, null, 2),
      },
    ],
  };
}

function fail(error: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          },
          null,
          2,
        ),
      },
    ],
    isError: true,
  };
}

async function unwrap(res: any) {
  if (res?.error || !res?.data?.success) {
    throw new Error(res?.error?.value?.message ?? "API request failed");
  }
  return res.data.data;
}

export function registerQuizTools(server: McpServer): void {
  const quizSchema = z.object({
    slug: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    timeLimitSeconds: z.number().int().positive().optional(),
    passPercentage: z.number().int().min(0).max(100).optional(),
  });

  const questionSchema = z.object({
    id: z.string().optional(),
    orderNo: z.number().int().nonnegative(),
    prompt: z.string().min(1),
    hint: z.string().optional(),
    rationale: z.string().optional(),
    questionType: z.enum(["single_choice"]).optional(),
    points: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    options: z
      .array(
        z.object({
          orderNo: z.number().int().nonnegative(),
          text: z.string().min(1),
          isCorrect: z.boolean(),
          rationale: z.string().optional(),
        }),
      )
      .min(2),
  });

  const optionSchema = z.object({
    orderNo: z.number().int().nonnegative(),
    text: z.string().min(1),
    isCorrect: z.boolean(),
    rationale: z.string().optional(),
  });

  server.registerTool(
    "fetch_quizzes",
    {
      title: "Fetch Quizzes",
      description: "Retrieve quizzes with optional filters.",
      inputSchema: z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    },
    async (params, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.get({
          headers: { Authorization: `Bearer ${key}` },
          query: {
            search: params.search,
            status: params.status,
            limit: params.limit.toString(),
            page: (Math.floor(params.offset / params.limit) + 1).toString(),
          },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "get_quiz_by_id",
    {
      title: "Get Quiz by ID",
      description: "Fetch full quiz details by ID.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.id({ id }).get({
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "get_quiz_by_slug",
    {
      title: "Get Quiz by Slug",
      description: "Fetch published quiz by slug.",
      inputSchema: z.object({ slug: z.string() }),
    },
    async ({ slug }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.slug({ slug }).get({
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "create_quiz",
    {
      title: "Create Quiz",
      description: "Create a new quiz.",
      inputSchema: quizSchema,
    },
    async (params, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin.post(params, {
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "update_quiz",
    {
      title: "Update Quiz",
      description: "Update quiz metadata.",
      inputSchema: quizSchema.extend({ id: z.string() }),
    },
    async ({ id, ...body }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin({ id }).patch(body, {
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "archive_quiz",
    {
      title: "Archive Quiz",
      description: "Archive quiz by ID.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin({ id }).delete({
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "publish_quiz",
    {
      title: "Publish Quiz",
      description: "Publish quiz by ID.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes
          .admin({ id })
          .publish.post(undefined, {
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "unpublish_quiz",
    {
      title: "Unpublish Quiz",
      description: "Move published quiz back to draft.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes
          .admin({ id })
          .unpublish.post(undefined, {
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "create_question",
    {
      title: "Create Question",
      description: "Create question under quiz.",
      inputSchema: z.object({ quizId: z.string(), question: questionSchema }),
    },
    async ({ quizId, question }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .quiz({ quizId })
          .questions.post(question, {
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "update_question",
    {
      title: "Update Question",
      description: "Update question by id.",
      inputSchema: z.object({
        questionId: z.string(),
        orderNo: z.number().int().nonnegative().optional(),
        prompt: z.string().optional(),
        hint: z.string().optional(),
        rationale: z.string().optional(),
        questionType: z.enum(["single_choice"]).optional(),
        points: z.number().int().positive().optional(),
        isActive: z.boolean().optional(),
      }),
    },
    async ({ questionId, ...body }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .questions({ questionId })
          .patch(body, { headers: { Authorization: `Bearer ${key}` } });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "delete_question",
    {
      title: "Delete Question",
      description: "Delete question by id.",
      inputSchema: z.object({ questionId: z.string() }),
    },
    async ({ questionId }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .questions({ questionId })
          .delete({ headers: { Authorization: `Bearer ${key}` } });
        await unwrap(res);
        return success(true);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "create_option",
    {
      title: "Create Option",
      description: "Create question option.",
      inputSchema: z.object({ questionId: z.string(), option: optionSchema }),
    },
    async ({ questionId, option }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .questions({ questionId })
          .options.post(option, {
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "update_option",
    {
      title: "Update Option",
      description: "Update option by id.",
      inputSchema: z.object({
        optionId: z.string(),
        orderNo: z.number().int().nonnegative().optional(),
        text: z.string().optional(),
        isCorrect: z.boolean().optional(),
        rationale: z.string().optional(),
      }),
    },
    async ({ optionId, ...body }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .options({ optionId })
          .patch(body, { headers: { Authorization: `Bearer ${key}` } });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "delete_option",
    {
      title: "Delete Option",
      description: "Delete option by id.",
      inputSchema: z.object({ optionId: z.string() }),
    },
    async ({ optionId }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .options({ optionId })
          .delete({ headers: { Authorization: `Bearer ${key}` } });
        await unwrap(res);
        return success(true);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "reorder_questions",
    {
      title: "Reorder Questions",
      description: "Reorder questions in quiz.",
      inputSchema: z.object({
        quizId: z.string(),
        updates: z.array(
          z.object({
            questionId: z.string(),
            orderNo: z.number().int().nonnegative(),
          }),
        ),
      }),
    },
    async ({ quizId, updates }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .quiz({ quizId })
          .questions.reorder.patch(
            { updates },
            { headers: { Authorization: `Bearer ${key}` } },
          );
        await unwrap(res);
        return success(true);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "reorder_options",
    {
      title: "Reorder Options",
      description: "Reorder options in question.",
      inputSchema: z.object({
        questionId: z.string(),
        updates: z.array(
          z.object({
            optionId: z.string(),
            orderNo: z.number().int().nonnegative(),
          }),
        ),
      }),
    },
    async ({ questionId, updates }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .questions({
            questionId,
          })
          .options.reorder.patch(
            { updates },
            { headers: { Authorization: `Bearer ${key}` } },
          );
        await unwrap(res);
        return success(true);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "validate_quiz_content",
    {
      title: "Validate Quiz Content",
      description: "Validate quiz rules and completeness.",
      inputSchema: z.object({ quizId: z.string() }),
    },
    async ({ quizId }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.quizzes.admin
          .quiz({ quizId })
          .questions.get({
            headers: { Authorization: `Bearer ${key}` },
          });
        const questions = (await unwrap(res)) ?? [];
        const issues: Array<{ level: "error" | "warning"; message: string }> =
          [];

        if (questions.length === 0) {
          issues.push({ level: "error", message: "Quiz has no questions." });
        }

        for (const question of questions) {
          const correctCount = (question.options ?? []).filter(
            (option: { isCorrect: boolean }) => option.isCorrect,
          ).length;
          if (correctCount !== 1) {
            issues.push({
              level: "error",
              message: `Question ${question.orderNo} must have exactly one correct option.`,
            });
          }
        }

        return success({
          valid: !issues.some((issue) => issue.level === "error"),
          issues,
        });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "bulk_upsert_quiz_content",
    {
      title: "Bulk Upsert Quiz Content",
      description: "Create/update multiple questions.",
      inputSchema: z.object({
        quizId: z.string(),
        questions: z.array(questionSchema),
      }),
    },
    async ({ quizId, questions }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const results: Array<{
          orderNo: number;
          operation: string;
          success: boolean;
        }> = [];
        const errors: Array<{ orderNo: number; error: string }> = [];

        for (const question of questions) {
          try {
            if (question.id) {
              await unwrap(
                await client.api.quizzes.admin
                  .questions({
                    questionId: question.id,
                  })
                  .patch(
                    {
                      orderNo: question.orderNo,
                      prompt: question.prompt,
                      hint: question.hint,
                      rationale: question.rationale,
                      points: question.points,
                      isActive: question.isActive,
                    },
                    { headers: { Authorization: `Bearer ${key}` } },
                  ),
              );
              results.push({
                orderNo: question.orderNo,
                operation: "update",
                success: true,
              });
            } else {
              await unwrap(
                await client.api.quizzes.admin
                  .quiz({ quizId })
                  .questions.post(question, {
                    headers: { Authorization: `Bearer ${key}` },
                  }),
              );
              results.push({
                orderNo: question.orderNo,
                operation: "create",
                success: true,
              });
            }
          } catch (error) {
            errors.push({
              orderNo: question.orderNo,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return success({
          results,
          errors,
          summary: {
            total: questions.length,
            successful: results.length,
            failed: errors.length,
          },
        });
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "clone_quiz",
    {
      title: "Clone Quiz",
      description: "Clone existing quiz as a draft.",
      inputSchema: z.object({
        sourceQuizId: z.string(),
        title: z.string().optional(),
        slug: z.string().optional(),
      }),
    },
    async ({ sourceQuizId, title, slug }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const source = await unwrap(
          await client.api.quizzes.id({ id: sourceQuizId }).get({
            headers: { Authorization: `Bearer ${key}` },
          }),
        );
        const created = await unwrap(
          await client.api.quizzes.admin.post(
            {
              title: title ?? `${source.title} (Copy)`,
              slug,
              description: source.description ?? undefined,
              status: "draft",
              difficulty: source.difficulty ?? undefined,
              estimatedMinutes: source.estimatedMinutes ?? undefined,
              timeLimitSeconds: source.timeLimitSeconds ?? undefined,
              passPercentage: source.passPercentage ?? undefined,
            },
            { headers: { Authorization: `Bearer ${key}` } },
          ),
        );

        for (const question of source.questions ?? []) {
          await unwrap(
            await client.api.quizzes.admin
              .quiz({ quizId: created.id })
              .questions.post(
                {
                  orderNo: question.orderNo,
                  prompt: question.prompt,
                  hint: question.hint ?? undefined,
                  rationale: question.rationale ?? undefined,
                  questionType: "single_choice",
                  points: question.points,
                  isActive: question.isActive,
                  options: (question.options ?? []).map(
                    (option: {
                      orderNo: number;
                      text: string;
                      isCorrect?: boolean;
                      rationale?: string | null;
                    }) => ({
                      orderNo: option.orderNo,
                      text: option.text,
                      isCorrect: Boolean(option.isCorrect),
                      rationale: option.rationale ?? undefined,
                    }),
                  ),
                },
                { headers: { Authorization: `Bearer ${key}` } },
              ),
          );
        }

        return success(created);
      } catch (error) {
        return fail(error);
      }
    },
  );
}
