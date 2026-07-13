import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  academicCourseSlugAliases,
  academicCourses,
  courseTopics,
  courseUnits,
  resources,
  topicResourceLinks,
} from "@/server/db/schema";
import { elysiaApi } from "@/server/elysia";

interface CatalogCourse {
  id: string;
  slug: string;
  code: string;
  hasExplorerContent: boolean;
}

const DATABASE_TEST_TIMEOUT = 20_000;
const fixtureSuffix = crypto.randomUUID().slice(0, 8);
const fixture = {
  courseId: `course-explorer-test-id-${fixtureSuffix}`,
  courseSlug: `course-explorer-test-${fixtureSuffix}`,
  courseCode: `CX${fixtureSuffix.toUpperCase()}`,
  legacySlug: `legacy-course-explorer-${fixtureSuffix}`,
  unitId: `course-explorer-unit-${fixtureSuffix}`,
  unitSlug: `course-explorer-unit-${fixtureSuffix}`,
  topicId: `course-explorer-topic-${fixtureSuffix}`,
  topicSlug: `course-explorer-topic-${fixtureSuffix}`,
  resourceId: `course-explorer-resource-${fixtureSuffix}`,
  resourceUrl: `https://example.com/course-explorer-${fixtureSuffix}`,
};

async function canReachDatabase() {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

const databaseAvailable = await canReachDatabase();
const databaseIt = databaseAvailable ? it : it.skip;

beforeAll(async () => {
  if (!databaseAvailable) return;

  await db.insert(academicCourses).values({
    id: fixture.courseId,
    slug: fixture.courseSlug,
    code: fixture.courseCode,
    name: "Course Explorer integration fixture",
    description: "Owned and cleaned up by the Course Explorer API suite.",
    isActive: true,
  });
  await db.insert(academicCourseSlugAliases).values({
    id: `course-explorer-alias-${fixtureSuffix}`,
    courseId: fixture.courseId,
    slug: fixture.legacySlug,
  });
  await db.insert(courseUnits).values({
    id: fixture.unitId,
    slug: fixture.unitSlug,
    courseId: fixture.courseId,
    name: "Integration unit",
    unitType: "module",
    sortOrder: 1,
    isActive: true,
  });
  await db.insert(courseTopics).values({
    id: fixture.topicId,
    slug: fixture.topicSlug,
    unitId: fixture.unitId,
    name: "Integration topic",
    priorityLevel: "core",
    weightage: "20",
    hours: 2,
    sortOrder: 1,
    isActive: true,
  });
  await db.insert(resources).values({
    id: fixture.resourceId,
    title: "Course Explorer integration resource",
    s3Url: fixture.resourceUrl,
  });
  await db.insert(topicResourceLinks).values({
    id: `course-explorer-resource-link-${fixtureSuffix}`,
    topicId: fixture.topicId,
    resourceId: fixture.resourceId,
    relevance: "primary",
    sortOrder: 1,
  });
});

afterAll(async () => {
  if (!databaseAvailable) return;
  await db
    .delete(academicCourses)
    .where(eq(academicCourses.id, fixture.courseId));
  await db.delete(resources).where(eq(resources.id, fixture.resourceId));
});

async function getCatalogCourses(search?: string): Promise<CatalogCourse[]> {
  const query = new URLSearchParams({ readiness: "all", limit: "100" });
  if (search) query.set("search", search);
  const response = await elysiaApi
    .handle(
      new Request(`http://localhost/api/course-explorer/catalog?${query}`),
    )
    .then((result) => result.json());

  expect(response.success).toBe(true);
  expect(response.data).toBeInstanceOf(Array);
  expect(response.data.length).toBeGreaterThan(0);
  return response.data;
}

async function getCourseFixture(requireContent = false) {
  const courses = await getCatalogCourses(fixture.courseCode);
  const course = courses.find((item) => item.slug === fixture.courseSlug);
  expect(course).toBeDefined();
  if (requireContent) expect(course?.hasExplorerContent).toBe(true);
  return course as CatalogCourse;
}

async function getCourseBySlug(slug: string) {
  return elysiaApi
    .handle(
      new Request(`http://localhost/api/course-explorer/courses/slug/${slug}`),
    )
    .then((result) => result.json());
}

describe("Course Explorer API", () => {
  databaseIt(
    "returns the legacy-compatible course list",
    async () => {
      const response = await elysiaApi
        .handle(new Request("http://localhost/api/course-explorer/courses"))
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.data).toBeInstanceOf(Array);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "returns a course by its catalog slug",
    async () => {
      const fixture = await getCourseFixture();
      const response = await getCourseBySlug(fixture.slug);

      expect(response.success).toBe(true);
      expect(response.data.slug).toBe(fixture.slug);
      expect(response.data.canonicalSlug).toBe(fixture.slug);
      expect(response.data.matchedBy).toBe("slug");
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "resolves aliases, course codes, and internal IDs to the canonical slug",
    async () => {
      const course = await getCourseFixture();

      const codeResponse = await getCourseBySlug(course.code);
      expect(codeResponse.success).toBe(true);
      expect(codeResponse.data.canonicalSlug).toBe(course.slug);
      expect(codeResponse.data.matchedBy).toBe("code");

      const idResponse = await getCourseBySlug(course.id);
      expect(idResponse.success).toBe(true);
      expect(idResponse.data.canonicalSlug).toBe(course.slug);
      expect(idResponse.data.matchedBy).toBe("id");

      const aliasResponse = await getCourseBySlug(fixture.legacySlug);
      expect(aliasResponse.success).toBe(true);
      expect(aliasResponse.data.canonicalSlug).toBe(course.slug);
      expect(aliasResponse.data.matchedBy).toBe("alias");
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "returns optional mindmap data for a real course",
    async () => {
      const fixture = await getCourseFixture();
      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/courses/slug/${fixture.slug}/mindmap`,
          ),
        )
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.data.nodes).toBeInstanceOf(Array);
      expect(response.data.edges).toBeInstanceOf(Array);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "keeps the legacy mindmap focus filter compatible",
    async () => {
      const fixture = await getCourseFixture();
      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/courses/slug/${fixture.slug}/mindmap?path=exam-prep`,
          ),
        )
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.data.nodes).toBeInstanceOf(Array);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "returns explorer-ready catalog metadata",
    async () => {
      const response = await elysiaApi
        .handle(
          new Request(
            "http://localhost/api/course-explorer/catalog?readiness=all&limit=100",
          ),
        )
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.metadata.readyCount).toBeGreaterThanOrEqual(0);
      expect(response.metadata.upcomingCount).toBeGreaterThanOrEqual(0);
      expect(response.metadata.totalCount).toBeGreaterThanOrEqual(
        response.data.length,
      );
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "returns outline hierarchy separately from focus metadata",
    async () => {
      const fixture = await getCourseFixture(true);
      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/courses/slug/${fixture.slug}/learning-view`,
          ),
        )
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.data.units).toBeInstanceOf(Array);
      expect(response.data.focus.exam).toBeInstanceOf(Array);
      expect(response.data.focus.essentials).toBeInstanceOf(Array);
      expect(response.data.readiness.hasExplorerContent).toBe(true);
      expect(response.data.readiness.resourceCount).toBe(1);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "returns units and topics through compatibility routes",
    async () => {
      const fixture = await getCourseFixture(true);
      const courseResponse = await getCourseBySlug(fixture.slug);
      const unit = courseResponse.data.units[0];
      expect(unit).toBeDefined();

      const unitResponse = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/units/slug/${unit.slug}`,
          ),
        )
        .then((result) => result.json());
      expect(unitResponse.success).toBe(true);
      expect(unitResponse.data.slug).toBe(unit.slug);

      const topicsResponse = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/units/slug/${unit.slug}/topics`,
          ),
        )
        .then((result) => result.json());
      expect(topicsResponse.success).toBe(true);
      expect(topicsResponse.data).toBeInstanceOf(Array);
      expect(topicsResponse.data.length).toBeGreaterThan(0);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "keeps topic-view compatibility without fabricating progress",
    async () => {
      const fixture = await getCourseFixture(true);
      const courseResponse = await getCourseBySlug(fixture.slug);
      const unit = courseResponse.data.units[0];
      const topicsResponse = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/units/slug/${unit.slug}/topics`,
          ),
        )
        .then((result) => result.json());
      const topic = topicsResponse.data[0];
      expect(topic).toBeDefined();

      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/topics/slug/${topic.slug}/view`,
            { method: "POST" },
          ),
        )
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.tracked).toBe(false);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "returns the selected topic's linked learning resources",
    async () => {
      const response = await elysiaApi
        .handle(
          new Request(
            `http://localhost/api/course-explorer/topics/slug/${fixture.topicSlug}`,
          ),
        )
        .then((result) => result.json());

      expect(response.success).toBe(true);
      expect(response.data.resources).toHaveLength(1);
      expect(response.data.resources[0].relevance).toBe("primary");
      expect(response.data.resources[0].resource.s3Url).toBe(
        fixture.resourceUrl,
      );
    },
    DATABASE_TEST_TIMEOUT,
  );
});

describe("Course Explorer Admin API", () => {
  databaseIt(
    "requires authentication for course creation",
    async () => {
      const response = await elysiaApi.handle(
        new Request("http://localhost/api/course-explorer/admin/courses", {
          method: "POST",
          body: JSON.stringify({ name: "Unauthorized course" }),
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect([401, 403]).toContain(response.status);
    },
    DATABASE_TEST_TIMEOUT,
  );

  databaseIt(
    "requires authentication for unit creation",
    async () => {
      const response = await elysiaApi.handle(
        new Request("http://localhost/api/course-explorer/admin/units", {
          method: "POST",
          body: JSON.stringify({
            courseId: "test-course-id",
            slug: "unauthorized-unit",
            name: "Unauthorized unit",
            unitType: "module",
          }),
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect([401, 403]).toContain(response.status);
    },
    DATABASE_TEST_TIMEOUT,
  );

  for (const action of ["validate", "diff", "upsert"] as const) {
    databaseIt(
      `requires auth for course graph ${action}`,
      async () => {
        const response = await elysiaApi.handle(
          new Request(
            `http://localhost/api/course-explorer/admin/course-graphs/${action}`,
            {
              method: "POST",
              body: JSON.stringify(
                action === "upsert"
                  ? { input: {}, mode: "merge" }
                  : { input: {} },
              ),
              headers: { "Content-Type": "application/json" },
            },
          ),
        );

        expect([401, 403]).toContain(response.status);
      },
      DATABASE_TEST_TIMEOUT,
    );
  }
});
