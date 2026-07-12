import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import {
  academicPrograms,
  collegeDepartmentProgramToCourses,
  collegeDepartments,
  collegeDepartmentsToPrograms,
} from "@/server/db/schema";
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

function makeAwaitableRows<T>(rows: T[]) {
  const query = Promise.resolve(rows) as Promise<T[]> & {
    where: (..._args: unknown[]) => Promise<T[]> & {
      where: (..._args: unknown[]) => unknown;
    };
  };
  query.where = () => query;
  return query;
}

describe("Programs API", () => {
  const originalSelect = (db as any).select;
  const originalInsert = (db as any).insert;
  const originalUpdate = (db as any).update;
  const originalDelete = (db as any).delete;
  const originalGetSession = (auth.api as any).getSession;
  const originalProgramsFindMany = (db as any).query.academicPrograms.findMany;
  const originalProgramsFindFirst = (db as any).query.academicPrograms
    .findFirst;
  const originalCoursesFindMany = (db as any).query.academicCourses.findMany;
  const originalMappingsFindFirst = (db as any).query
    .collegeDepartmentsToPrograms.findFirst;

  const setSession = (user: typeof adminUser | typeof regularUser | null) => {
    (auth.api as any).getSession = mock(async () =>
      user ? { user, session: { id: "session-1" } } : null,
    );
  };

  beforeEach(() => {
    setSession(null);

    (db as any).query.academicPrograms.findMany = mock(async () => [
      { id: "p1", name: "Program One" },
      { id: "p2", name: "Program Two" },
    ]);
    (db as any).query.academicPrograms.findFirst = mock(async () => null);
    (db as any).query.academicCourses.findMany = mock(async () => []);
    (db as any).query.collegeDepartmentsToPrograms.findFirst = mock(
      async () => null,
    );

    (db as any).insert = mock(() => ({
      values: mock(async () => undefined),
    }));
    (db as any).update = mock(() => ({
      set: mock(() => ({
        where: mock(() => ({
          returning: mock(async () => [{ id: "updated" }]),
        })),
      })),
    }));
    (db as any).delete = mock(() => ({
      where: mock(async () => undefined),
    }));

    (db as any).select = mock((_fields?: Record<string, unknown>) => ({
      from: (table: unknown) => {
        if (table === collegeDepartments) {
          return {
            where: async () => [{ id: "cd1" }, { id: "cd2" }],
          };
        }
        if (table === collegeDepartmentsToPrograms) {
          return makeAwaitableRows([{ id: "p1" }, { id: "p2" }]);
        }
        if (table === academicPrograms) {
          return {
            where: async () => [{ count: 2 }],
          };
        }
        if (table === collegeDepartmentProgramToCourses) {
          return {
            where: async () => [{ courseId: "c1" }],
          };
        }
        return {
          where: async () => [],
          limit: async () => [],
        };
      },
    }));
  });

  afterEach(() => {
    (db as any).select = originalSelect;
    (db as any).insert = originalInsert;
    (db as any).update = originalUpdate;
    (db as any).delete = originalDelete;
    (auth.api as any).getSession = originalGetSession;
    (db as any).query.academicPrograms.findMany = originalProgramsFindMany;
    (db as any).query.academicPrograms.findFirst = originalProgramsFindFirst;
    (db as any).query.academicCourses.findMany = originalCoursesFindMany;
    (db as any).query.collegeDepartmentsToPrograms.findFirst =
      originalMappingsFindFirst;
  });

  it("applies relation filters using all matching college-department ids and aligns metadata count", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/programs?departmentId=dep-1"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.metadata.totalCount).toBe(2);

    const findManyArgs = (
      (db as any).query.academicPrograms.findMany as ReturnType<typeof mock>
    ).mock.calls[0]?.[0];
    expect(findManyArgs?.where?.id?.in).toEqual(["p1", "p2"]);
  });

  it("returns 404 when fetching unknown program code", async () => {
    const response = await elysiaApi.handle(
      new Request("http://localhost/api/programs/code/does-not-exist"),
    );
    expect(response.status).toBe(404);
  });

  it("supports legacy and corrected college-department mapping admin paths", async () => {
    setSession(adminUser);

    const legacy = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/programs/admin/program-1/collegeDeptments/cd-1",
          { method: "POST" },
        ),
      )
      .then((res) => res.json());

    const corrected = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/programs/admin/program-1/collegeDepartments/cd-1",
          { method: "POST" },
        ),
      )
      .then((res) => res.json());

    expect(legacy.success).toBe(true);
    expect(corrected.success).toBe(true);
  });

  it("blocks non-admin access to admin routes", async () => {
    setSession(regularUser);

    const response = await elysiaApi.handle(
      new Request("http://localhost/api/programs/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Program A" }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("returns 404 for delete mapping when id does not exist", async () => {
    setSession(adminUser);
    (db as any).query.collegeDepartmentsToPrograms.findFirst = mock(
      async () => null,
    );

    const response = await elysiaApi.handle(
      new Request("http://localhost/api/programs/admin/non-existent-mapping", {
        method: "DELETE",
      }),
    );

    expect(response.status).toBe(404);
  });
});
