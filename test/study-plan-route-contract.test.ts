import { describe, expect, it } from "bun:test";
import { courseExplorerPublicRoutes } from "@/server/elysia/routes/course-explorer";
import { studyPlansRoutes } from "@/server/elysia/routes/study-plans";

function contracts(
  routes: Array<{ method: string; path: string }>,
): Set<string> {
  return new Set(routes.map((route) => `${route.method} ${route.path}`));
}

describe("study planner production route contract", () => {
  it("keeps canonical slug and legacy ID plan routes together", () => {
    const registered = contracts(studyPlansRoutes.routes);

    expect(registered).toContain("GET /study-plans/:id");
    expect(registered).toContain("PATCH /study-plans/:id");
    expect(registered).toContain("GET /study-plans/slug/:slug/workspace");
    expect(registered).toContain(
      "PATCH /study-plans/slug/:slug/tasks/:taskSlug",
    );
  });

  it("exposes preview, today, upcoming, and recovery workflows", () => {
    const registered = contracts(studyPlansRoutes.routes);

    expect(registered).toContain("POST /study-plans/preview");
    expect(registered).toContain("GET /study-plans/today");
    expect(registered).toContain("GET /study-plans/upcoming");
    expect(registered).toContain(
      "POST /study-plans/slug/:slug/rebalance/preview",
    );
    expect(registered).toContain("POST /study-plans/slug/:slug/rebalance");
  });

  it("exposes Course Explorer planning context by readable course slug", () => {
    const registered = contracts(courseExplorerPublicRoutes.routes);

    expect(registered).toContain(
      "GET /course-explorer/courses/slug/:slug/planning-context",
    );
  });
});
