import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { countries, universities } from "@/server/db/schema";
import { elysiaApi } from "@/server/elysia";

const adminUser = {
  id: "admin-1",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
} as const;

const regularUser = {
  id: "user-1",
  name: "Regular User",
  email: "user@example.com",
  role: "user",
} as const;

describe("Universities API", () => {
  const originalSelect = (db as any).select;
  const originalInsert = (db as any).insert;
  const originalUpdate = (db as any).update;
  const originalDelete = (db as any).delete;
  const originalGetSession = (auth.api as any).getSession;
  const originalUniversitiesFindMany = (db as any).query.universities.findMany;
  const originalUniversitiesFindFirst = (db as any).query.universities
    .findFirst;
  const originalRatingsFindMany = (db as any).query.ratings.findMany;

  const setSession = (user: typeof adminUser | typeof regularUser | null) => {
    (auth.api as any).getSession = mock(async () =>
      user ? { user, session: { id: "session-1" } } : null,
    );
  };

  beforeEach(() => {
    setSession(null);

    (db as any).query.universities.findMany = mock(async () => [
      { id: "u1", name: "Tribhuvan University", isActive: true },
    ]);
    (db as any).query.universities.findFirst = mock(async () => null);
    (db as any).query.ratings.findMany = mock(async () => []);

    (db as any).insert = mock(() => ({
      values: mock(async () => undefined),
    }));
    (db as any).update = mock(() => ({
      set: mock(() => ({
        where: mock(() => ({
          returning: mock(async () => [{ id: "u1" }]),
        })),
      })),
    }));
    (db as any).delete = mock(() => ({
      where: mock(async () => undefined),
    }));

    (db as any).select = mock((fields?: Record<string, unknown>) => {
      const isCountQuery = !!fields && "count" in fields;
      if (isCountQuery) {
        return {
          from: (table: unknown) => {
            if (table === universities) {
              return {
                where: async () => [{ count: 1 }],
              };
            }
            return { where: async () => [{ count: 0 }] };
          },
        };
      }

      return {
        from: (table: unknown) => {
          if (table === countries) {
            return {
              where: () => ({
                limit: async () => [{ code: "NP", name: "Nepal" }],
              }),
            };
          }
          return {
            where: async () => [{ ratingId: "r1" }],
          };
        },
      };
    });
  });

  afterEach(() => {
    (db as any).select = originalSelect;
    (db as any).insert = originalInsert;
    (db as any).update = originalUpdate;
    (db as any).delete = originalDelete;
    (auth.api as any).getSession = originalGetSession;
    (db as any).query.universities.findMany = originalUniversitiesFindMany;
    (db as any).query.universities.findFirst = originalUniversitiesFindFirst;
    (db as any).query.ratings.findMany = originalRatingsFindMany;
  });

  it("lists active universities and includes pagination metadata", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/universities?search=tribhuvan"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.length).toBe(1);
    expect(response.metadata.totalCount).toBe(1);
  });

  it("resolves country code filtering path", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/universities?country=NP"))
      .then((res) => res.json());
    expect(response.success).toBe(true);
  });

  it("returns 404 for unknown university slug", async () => {
    const response = await elysiaApi.handle(
      new Request("http://localhost/api/universities/slug/does-not-exist"),
    );
    expect(response.status).toBe(404);
  });

  it("blocks non-admin users from admin create", async () => {
    setSession(regularUser);

    const response = await elysiaApi.handle(
      new Request("http://localhost/api/universities/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Tribhuvan University" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("handles slug collision during admin create", async () => {
    setSession(adminUser);
    (db as any).query.universities.findFirst = mock(async ({ where }: any) => {
      if (where?.slug === "tribhuvan-university") {
        return { id: "existing-uni" };
      }
      return null;
    });

    const response = await elysiaApi
      .handle(
        new Request("http://localhost/api/universities/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Tribhuvan University" }),
        }),
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.slug).toMatch(/^tribhuvan-university-/);
  });

  it("preserves delete not-found behavior", async () => {
    setSession(adminUser);
    (db as any).query.universities.findFirst = mock(async () => null);

    const response = await elysiaApi.handle(
      new Request("http://localhost/api/universities/admin/not-found", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(404);
  });
});
