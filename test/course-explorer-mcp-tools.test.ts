import { describe, expect, it } from "bun:test";
import { canUseTool, TOOL_PERMISSIONS } from "@/server/mcp/auth";
import { registerCourseExplorerResources } from "@/server/mcp/resources/course-explorer";

describe("Course Explorer MCP permissions", () => {
  it("registers graph and granular tools in permission map", () => {
    expect(TOOL_PERMISSIONS.fetch_courses).toBeDefined();
    expect(TOOL_PERMISSIONS.get_course_structure).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_upsert_courses).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_upsert_units).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_upsert_topics).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_create_prerequisites).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_link_resources).toBeDefined();
    expect(TOOL_PERMISSIONS.validate_course_graph).toBeDefined();
    expect(TOOL_PERMISSIONS.preview_course_graph_diff).toBeDefined();
    expect(TOOL_PERMISSIONS.upsert_course_graph).toBeDefined();
    expect(TOOL_PERMISSIONS.export_course_graph).toBeDefined();
  });

  it("enforces read/write capability by permission scope", () => {
    expect(canUseTool("fetch_courses", { course_explorer: ["read"] })).toBe(
      true,
    );
    expect(
      canUseTool("upsert_course_graph", { course_explorer: ["read"] }),
    ).toBe(false);
    expect(
      canUseTool("upsert_course_graph", { course_explorer: ["write"] }),
    ).toBe(true);
  });
});

describe("Course Explorer MCP resources", () => {
  it("registers schema, enum, and course template resources", () => {
    const calls: string[] = [];
    const fakeServer = {
      registerResource: (name: string) => {
        calls.push(name);
      },
    };

    registerCourseExplorerResources(fakeServer as any);

    expect(calls).toContain("course-graph-schema-v1");
    expect(calls).toContain("course-graph-enums");
    expect(calls).toContain("course-graph-template");
    expect(calls).toContain("course-summary-template");
  });
});
