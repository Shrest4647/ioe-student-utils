import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
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

describe("Departments API", () => {
  const originalSelect = (db as any).select;
  const originalInsert = (db as any).insert;
  const originalUpdate = (db as any).update;
  const originalGetSession = (auth.api as any).getSession;
  const originalDepartmentsFindMany = (db as any).query.departments.findMany;
  const originalDepartmentsFindFirst = (db as any).query.departments.findFirst;
  const originalCollegeDepartmentsFindMany = (db as any).query
    .collegeDepartments.findMany;
  const originalRatingsFindMany = (db as any).query.ratings.findMany;

  const setSession = (user: typeof adminUser | typeof regularUser | null) => {
    (auth.api as any).getSession = mock(async () =>
      user ? { user, session: { id: "session-1" } } : null,
    );
  };

  beforeEach(() => {
    setSession(null);

    (db as any).query.departments.findMany = mock(async () => [
      { id: "d1", name: "Computer Engineering", slug: "computer-engineering" },
    ]);
    (db as any).query.departments.findFirst = mock(async () => null);
    (db as any).query.collegeDepartments.findMany = mock(async () => [
      {
        college: {
          id: "c1",
          name: "Pulchowk Campus",
          slug: "pulchowk",
          description: null,
          websiteUrl: null,
          university: { id: "u1", name: "Tribhuvan University" },
        },
      },
    ]);
    (db as any).query.ratings.findMany = mock(async () => []);

    (db as any).insert = mock(() => ({
      values: mock(async () => undefined),
    }));
    (db as any).update = mock(() => ({
      set: mock(() => ({
        where: mock(() => ({
          returning: mock(async () => [{ id: "d1" }]),
        })),
      })),
    }));

    (db as any).select = mock((fields?: Record<string, unknown>) => {
      const isCountQuery = !!fields && "count" in fields;
      if (isCountQuery) {
        return {
          from: () => ({
            where: async () => [{ count: 1 }],
            innerJoin: () => ({
              where: async () => [{ count: 1 }],
            }),
          }),
        };
      }

      return {
        from: () => ({
          innerJoin: () => ({
            where: () => ({
              limit: () => ({
                offset: () => ({
                  orderBy: async () => [
                    {
                      id: "cd1",
                      name: "Computer Engineering",
                      slug: "computer",
                    },
                  ],
                }),
              }),
            }),
          }),
          where: async () => [{ ratingId: "r1" }],
        }),
      };
    });
  });

  afterEach(() => {
    (db as any).select = originalSelect;
    (db as any).insert = originalInsert;
    (db as any).update = originalUpdate;
    (auth.api as any).getSession = originalGetSession;
    (db as any).query.departments.findMany = originalDepartmentsFindMany;
    (db as any).query.departments.findFirst = originalDepartmentsFindFirst;
    (db as any).query.collegeDepartments.findMany =
      originalCollegeDepartmentsFindMany;
    (db as any).query.ratings.findMany = originalRatingsFindMany;
  });

  it("lists departments with metadata", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/departments?search=computer"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.metadata.totalCount).toBe(1);
  });

  it("returns 404 for unknown department slug", async () => {
    const response = await elysiaApi.handle(
      new Request("http://localhost/api/departments/slug/does-not-exist"),
    );
    expect(response.status).toBe(404);
  });

  it("returns colleges for a department with mapped university info", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/departments/d1/colleges"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data[0].name).toBe("Pulchowk Campus");
    expect(response.data[0].university.name).toBe("Tribhuvan University");
  });

  it("blocks non-admin users from admin create", async () => {
    setSession(regularUser);

    const response = await elysiaApi.handle(
      new Request("http://localhost/api/departments/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Computer Engineering" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("handles slug collision during admin create", async () => {
    setSession(adminUser);
    (db as any).query.departments.findFirst = mock(async ({ where }: any) => {
      if (where?.slug === "computer-engineering") {
        return { id: "existing-dept" };
      }
      return null;
    });

    const response = await elysiaApi
      .handle(
        new Request("http://localhost/api/departments/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Computer Engineering" }),
        }),
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.slug).toMatch(/^computer-engineering-/);
  });
});
