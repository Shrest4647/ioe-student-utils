import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@/server/db";
import { elysiaApi } from "@/server/elysia";

describe("Quiz API", () => {
  const originalSelect = (db as any).select;
  const originalFindFirst = (db as any).query.quizzes.findFirst;

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

    (db as any).query.quizzes.findFirst = mock(
      ({ where }: { where?: { slug?: string; status?: string } }) => {
        if (where?.slug === "does-not-exist" && where?.status === "published") {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          id: "quiz-1",
          slug: "sample-quiz",
          status: "published",
        });
      },
    );
  });

  afterEach(() => {
    (db as any).select = originalSelect;
    (db as any).query.quizzes.findFirst = originalFindFirst;
  });

  it("lists quizzes", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/quizzes"))
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(0);
  });

  it("returns 404 for unknown slug", async () => {
    const response = await elysiaApi.handle(
      new Request("http://localhost/api/quizzes/slug/does-not-exist"),
    );
    expect(response.status).toBe(404);
  });
});
