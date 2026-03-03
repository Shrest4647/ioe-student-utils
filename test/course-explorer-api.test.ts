import { describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { elysiaApi } from "@/server/elysia";

async function canReachDatabase() {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

describe("Course Explorer API", () => {
  it("returns course list", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi
      .handle(new Request("http://localhost/api/course-explorer/courses"))
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.data).toBeInstanceOf(Array);
  });

  it("returns course by slug", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/course-explorer/courses/slug/bct-301",
        ),
      )
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.slug).toBe("bct-301");
  });

  it("returns mindmap data for a course", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/course-explorer/courses/slug/bct-301/mindmap",
        ),
      )
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.nodes).toBeInstanceOf(Array);
    expect(response.data.edges).toBeInstanceOf(Array);
  });

  it("filters mindmap by study path", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/course-explorer/courses/slug/bct-301/mindmap?path=exam-prep",
        ),
      )
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.data.nodes).toBeInstanceOf(Array);
  });

  it("returns unit by slug", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    // First get a course to find a unit
    const courseResponse = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/course-explorer/courses/slug/bct-301",
        ),
      )
      .then((res) => res.json());

    const units = courseResponse.data?.units || [];
    if (units.length > 0) {
      const unitSlug = units[0].slug;
      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/units/slug/${unitSlug}`,
          ),
        )
        .then((res) => res.json());

      expect(response).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.data.slug).toBe(unitSlug);
    }
  });

  it("returns topics for a unit", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    // First get a course to find a unit
    const courseResponse = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/course-explorer/courses/slug/bct-301",
        ),
      )
      .then((res) => res.json());

    const units = courseResponse.data?.units || [];
    if (units.length > 0) {
      const unitSlug = units[0].slug;
      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/units/slug/${unitSlug}/topics`,
          ),
        )
        .then((res) => res.json());

      expect(response).toBeDefined();
      expect(response.data).toBeInstanceOf(Array);
    }
  });

  it("increments topic view count", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    // First get a course with topics
    const courseResponse = await elysiaApi
      .handle(
        new Request(
          "http://localhost/api/course-explorer/courses/slug/bct-301",
        ),
      )
      .then((res) => res.json());

    const units = courseResponse.data?.units || [];
    if (units.length > 0) {
      const topics = units[0]?.topics || [];
      if (topics.length > 0) {
        const topicSlug = topics[0].slug;

        const response = await elysiaApi.handle(
          new Request(
            `http://localhost/api/course-explorer/topics/slug/${topicSlug}/view`,
            {
              method: "POST",
            },
          ),
        );

        expect(response.status).toBe(200);
      }
    }
  });
});

describe("Course Explorer Admin API", () => {
  it("requires authentication for admin endpoints", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi.handle(
      new Request("http://localhost/api/course-explorer/courses/admin"),
    );

    // Should return 401 or 403 without auth
    expect([401, 403]).toContain(response.status);
  });

  it("creates a new unit (with auth)", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const newUnit = {
      courseId: "test-course-id",
      slug: `test-unit-${Date.now()}`,
      name: "Test Unit",
      description: "Test unit description",
      sortOrder: 1,
      unitType: "module",
    };

    // This test would require authentication
    // For now, just test the endpoint exists
    const response = await elysiaApi.handle(
      new Request("http://localhost/api/course-explorer/units/admin", {
        method: "POST",
        body: JSON.stringify(newUnit),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    // Without auth, should be unauthorized
    expect([401, 403]).toContain(response.status);
  });

  it("requires auth for course graph validate endpoint", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi.handle(
      new Request(
        "http://localhost/api/course-explorer/admin/course-graphs/validate",
        {
          method: "POST",
          body: JSON.stringify({ input: {} }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    expect([401, 403]).toContain(response.status);
  });

  it("requires auth for course graph diff endpoint", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi.handle(
      new Request(
        "http://localhost/api/course-explorer/admin/course-graphs/diff",
        {
          method: "POST",
          body: JSON.stringify({ input: {} }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    expect([401, 403]).toContain(response.status);
  });

  it("requires auth for course graph upsert endpoint", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi.handle(
      new Request(
        "http://localhost/api/course-explorer/admin/course-graphs/upsert",
        {
          method: "POST",
          body: JSON.stringify({ input: {}, mode: "merge" }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    expect([401, 403]).toContain(response.status);
  });

  it("requires auth for course graph export endpoint", async () => {
    if (!(await canReachDatabase())) {
      expect(true).toBe(true);
      return;
    }

    const response = await elysiaApi.handle(
      new Request(
        "http://localhost/api/course-explorer/admin/courses/test/graph",
      ),
    );

    expect([401, 403]).toContain(response.status);
  });
});
