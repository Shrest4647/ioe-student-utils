import { describe, expect, it } from "bun:test";
import {
  computeCourseGraphDiff,
  upsertCourseGraph,
} from "@/server/elysia/services/course-graph-service";
import { validateCourseGraphInput } from "@/server/elysia/services/course-graph-validator";

describe("Course Graph Validator", () => {
  it("returns structured schema issues for invalid payload", async () => {
    const result = await validateCourseGraphInput({});

    expect(result.parsed).toBeNull();
    expect(result.result.valid).toBe(false);
    expect(result.result.issues.length).toBeGreaterThan(0);
    expect(result.result.issues[0]?.code).toBe("SCHEMA_INVALID");
  });

  it("detects duplicate unit slug as hard validation error", async () => {
    const payload = {
      schemaVersion: "v1" as const,
      course: {
        name: "Duplicate Unit Course",
      },
      units: [
        {
          slug: "same-unit",
          name: "Unit A",
          unitType: "module" as const,
          topics: [
            {
              slug: "topic-a",
              name: "Topic A",
              priorityLevel: "core" as const,
            },
          ],
        },
        {
          slug: "same-unit",
          name: "Unit B",
          unitType: "module" as const,
          topics: [
            {
              slug: "topic-b",
              name: "Topic B",
              priorityLevel: "important" as const,
            },
          ],
        },
      ],
    };

    const result = await validateCourseGraphInput(payload);
    expect(result.result.valid).toBe(false);
    expect(
      result.result.issues.some(
        (issue) => issue.code === "DUPLICATE_UNIT_SLUG",
      ),
    ).toBe(true);
  });
});

describe("Course Graph Service", () => {
  it("returns validation payload in diff response for invalid input", async () => {
    const diff = await computeCourseGraphDiff({});

    expect(diff.validation.valid).toBe(false);
    expect(diff.validation.issues.length).toBeGreaterThan(0);
    expect(diff.creates.course.length).toBe(0);
    expect(diff.updates.course.length).toBe(0);
  });

  it("rejects upsert for invalid graph input", async () => {
    await expect(upsertCourseGraph({}, { mode: "merge" })).rejects.toThrowError(
      /"valid":false/,
    );
  });
});
