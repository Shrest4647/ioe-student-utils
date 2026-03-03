import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@/server/db";
import { elysiaApi } from "@/server/elysia";

describe("Flashcards API", () => {
  const originalSelect = (db as any).select;
  const originalFindFirst = (db as any).query.flashcardDecks.findFirst;

  beforeEach(() => {
    (db as any).select = (fields?: Record<string, unknown>) => {
      const isCountQuery = !!fields && "count" in fields;
      if (isCountQuery) {
        return {
          from: () => ({
            where: () => Promise.resolve([{ count: 0 }]),
          }),
        };
      }

      return {
        from: () => ({
          where: () => ({
            orderBy: () => ({
              limit: () => ({
                offset: () => Promise.resolve([]),
              }),
            }),
          }),
        }),
      };
    };

    (db as any).query.flashcardDecks.findFirst = mock(
      ({ where }: { where?: { slug?: string; status?: string } }) => {
        if (where?.slug === "does-not-exist" && where?.status === "published") {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: "deck-1",
          slug: "sample-deck",
          status: "published",
        });
      },
    );
  });

  afterEach(() => {
    (db as any).select = originalSelect;
    (db as any).query.flashcardDecks.findFirst = originalFindFirst;
  });

  it("lists flashcard decks", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/flashcards"))
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(0);
  });

  it("returns 404 for unknown slug", async () => {
    const response = await elysiaApi.handle(
      new Request("http://localhost/api/flashcards/slug/does-not-exist"),
    );
    expect(response.status).toBe(404);
  });
});
