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
    throw new Error(
      res?.error?.value?.message ?? res?.data?.error ?? "API request failed",
    );
  }
  return res.data.data;
}

export function registerFlashcardTools(server: McpServer): void {
  const deckSchema = z.object({
    slug: z.string().optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(["draft", "published", "archived"]).optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    language: z.string().optional(),
    srsAlgorithm: z.enum(["sm2", "fsrs"]).optional(),
    newCardsPerDay: z.number().int().positive().optional(),
    maxReviewsPerDay: z.number().int().positive().optional(),
    learningSteps: z.array(z.number().int().positive()).optional(),
    graduatingIntervalDays: z.number().int().positive().optional(),
    easyIntervalDays: z.number().int().positive().optional(),
  });

  const cardSchema = z.object({
    id: z.string().optional(),
    orderNo: z.number().int().positive(),
    front: z.string().min(1),
    back: z.string().min(1),
    hint: z.string().optional(),
    explanation: z.string().optional(),
    media: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
  });

  server.registerTool(
    "fetch_flashcard_decks",
    {
      title: "Fetch Flashcard Decks",
      description: "Retrieve flashcard decks with optional filters.",
      inputSchema: z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        tag: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    },
    async (params, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.get({
          headers: { Authorization: `Bearer ${key}` },
          query: {
            search: params.search,
            status: params.status,
            difficulty: params.difficulty,
            tag: params.tag,
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
    "get_flashcard_deck_by_id",
    {
      title: "Get Flashcard Deck by ID",
      description: "Fetch full flashcard deck details by id.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.id({ id }).get({
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "get_flashcard_deck_by_slug",
    {
      title: "Get Flashcard Deck by Slug",
      description: "Fetch published flashcard deck by slug.",
      inputSchema: z.object({ slug: z.string() }),
    },
    async ({ slug }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.slug({ slug }).get({
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "create_flashcard_deck",
    {
      title: "Create Flashcard Deck",
      description: "Create a flashcard deck.",
      inputSchema: deckSchema,
    },
    async (params, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin.post(params, {
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "update_flashcard_deck",
    {
      title: "Update Flashcard Deck",
      description: "Update flashcard deck metadata.",
      inputSchema: deckSchema.extend({ id: z.string() }),
    },
    async ({ id, ...body }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin({ id }).patch(body, {
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "archive_flashcard_deck",
    {
      title: "Archive Flashcard Deck",
      description: "Archive a flashcard deck.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin({ id }).delete({
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "publish_flashcard_deck",
    {
      title: "Publish Flashcard Deck",
      description: "Publish flashcard deck by id.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards
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
    "unpublish_flashcard_deck",
    {
      title: "Unpublish Flashcard Deck",
      description: "Move flashcard deck back to draft.",
      inputSchema: z.object({ id: z.string() }),
    },
    async ({ id }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards
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
    "clone_flashcard_deck",
    {
      title: "Clone Flashcard Deck",
      description: "Clone a flashcard deck as draft.",
      inputSchema: z.object({
        id: z.string(),
        title: z.string().optional(),
        slug: z.string().optional(),
      }),
    },
    async ({ id, title, slug }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin({ id }).clone.post(
          { title, slug },
          {
            headers: { Authorization: `Bearer ${key}` },
          },
        );
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "create_flashcard_card",
    {
      title: "Create Flashcard Card",
      description: "Create a card in a deck.",
      inputSchema: z.object({
        deckId: z.string(),
        card: cardSchema.omit({ id: true }),
      }),
    },
    async ({ deckId, card }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .deck({ deckId })
          .cards.post(card, {
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "update_flashcard_card",
    {
      title: "Update Flashcard Card",
      description: "Update card by id.",
      inputSchema: z.object({
        cardId: z.string(),
        orderNo: z.number().int().positive().optional(),
        front: z.string().optional(),
        back: z.string().optional(),
        hint: z.string().optional(),
        explanation: z.string().optional(),
        media: z.record(z.string(), z.unknown()).optional(),
        isActive: z.boolean().optional(),
      }),
    },
    async ({ cardId, ...body }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .cards({ cardId })
          .patch(body, {
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "delete_flashcard_card",
    {
      title: "Delete Flashcard Card",
      description: "Delete card by id.",
      inputSchema: z.object({ cardId: z.string() }),
    },
    async ({ cardId }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .cards({ cardId })
          .delete({ headers: { Authorization: `Bearer ${key}` } });
        await unwrap(res);
        return success(true);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "reorder_flashcard_cards",
    {
      title: "Reorder Flashcard Cards",
      description: "Reorder cards in a deck.",
      inputSchema: z.object({
        deckId: z.string(),
        updates: z.array(
          z.object({
            cardId: z.string(),
            orderNo: z.number().int().positive(),
          }),
        ),
      }),
    },
    async ({ deckId, updates }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .deck({ deckId })
          .cards.reorder.patch(
            { updates },
            {
              headers: { Authorization: `Bearer ${key}` },
            },
          );
        await unwrap(res);
        return success(true);
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "bulk_upsert_flashcard_content",
    {
      title: "Bulk Upsert Flashcard Content",
      description: "Create or update multiple cards.",
      inputSchema: z.object({
        deckId: z.string(),
        cards: z.array(cardSchema),
      }),
    },
    async ({ deckId, cards }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .deck({ deckId })
          .cards["bulk-upsert"].post(
            { cards },
            {
              headers: { Authorization: `Bearer ${key}` },
            },
          );
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "validate_flashcard_content",
    {
      title: "Validate Flashcard Content",
      description: "Run validation checks before publishing a deck.",
      inputSchema: z.object({ deckId: z.string() }),
    },
    async ({ deckId }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .deck({ deckId })
          .validate.get({
            headers: { Authorization: `Bearer ${key}` },
          });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "create_flashcard_tag",
    {
      title: "Create Flashcard Tag",
      description: "Create a flashcard tag.",
      inputSchema: z.object({
        name: z.string().min(1),
        slug: z.string().optional(),
      }),
    },
    async (params, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin.tags.post(params, {
          headers: { Authorization: `Bearer ${key}` },
        });
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "assign_flashcard_tags",
    {
      title: "Assign Flashcard Tags",
      description: "Assign tag ids to a deck.",
      inputSchema: z.object({
        deckId: z.string(),
        tagIds: z.array(z.string()),
      }),
    },
    async ({ deckId, tagIds }, ctx) => {
      try {
        const key = getApiKey(ctx);
        const res = await client.api.flashcards.admin
          .deck({ deckId })
          .tags.patch(
            { tagIds },
            {
              headers: { Authorization: `Bearer ${key}` },
            },
          );
        return success(await unwrap(res));
      } catch (error) {
        return fail(error);
      }
    },
  );

  server.registerTool(
    "simulate_srs_schedule",
    {
      title: "Simulate SRS Schedule",
      description: "Preview SRS due-at schedule for a sequence of ratings.",
      inputSchema: z.object({
        algorithm: z.enum(["sm2", "fsrs"]).default("sm2"),
        ratings: z.array(z.enum(["again", "hard", "good", "easy"])).min(1),
        learningSteps: z.array(z.number().int().positive()).default([1, 10]),
        graduatingIntervalDays: z.number().int().positive().default(1),
        easyIntervalDays: z.number().int().positive().default(4),
      }),
    },
    async ({
      algorithm,
      ratings,
      learningSteps,
      graduatingIntervalDays,
      easyIntervalDays,
    }) => {
      try {
        const { computeNextState } = await import(
          "@/server/services/flashcard-srs"
        );

        let state: any = null;
        let now = new Date();
        const timeline: Array<Record<string, unknown>> = [];

        for (const rating of ratings) {
          state = computeNextState({
            policy: {
              srsAlgorithm: algorithm,
              learningSteps,
              graduatingIntervalDays,
              easyIntervalDays,
            },
            previous: state,
            rating,
            now,
          });

          timeline.push({
            rating,
            dueAt: state.dueAt,
            intervalDays: state.intervalDays,
            state: state.state,
            easeFactor: state.easeFactor,
            repetition: state.repetition,
          });
          now = new Date(now.getTime() + 30 * 1000);
        }

        return success({ timeline });
      } catch (error) {
        return fail(error);
      }
    },
  );
}
