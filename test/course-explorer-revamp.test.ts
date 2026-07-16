import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SyllabusOutline } from "@/components/course-explorer/syllabus-outline";
import {
  buildCanonicalCourseSlug,
  isOpaqueCourseReference,
  normalizeCourseSlug,
  withCourseSearchParams,
} from "@/lib/course-slug";
import {
  buildFocusReasons,
  normalizeWeightage,
} from "@/server/elysia/services/course-explorer-query-service";
import type { CourseLearningUnit } from "@/types/course-learning";

describe("course slug contract", () => {
  it("uses a normalized course code as the canonical public slug", () => {
    expect(
      buildCanonicalCourseSlug({
        code: "CT 501",
        name: "Object Oriented Programming",
      }),
    ).toBe("ct-501");
  });

  it("normalizes punctuation and diacritics without opaque suffixes", () => {
    expect(normalizeCourseSlug("  Résumé & Research / I  ")).toBe(
      "resume-research-i",
    );
  });

  it("recognizes UUID and long nanoid-style legacy references", () => {
    expect(
      isOpaqueCourseReference("d7df452f-93b3-49ca-8424-0e819effcf4e"),
    ).toBe(true);
    expect(isOpaqueCourseReference("i2HvjyySxGkJ69Tcp8eRQ")).toBe(true);
    expect(isOpaqueCourseReference("ct-501")).toBe(false);
  });

  it("preserves selected topic and focus context across canonical redirects", () => {
    expect(
      withCourseSearchParams("/course-explorer/ct-501", {
        topic: "binary-search-trees",
        focus: "exam",
      }),
    ).toBe("/course-explorer/ct-501?topic=binary-search-trees&focus=exam");
  });
});

describe("course focus behavior", () => {
  type FocusTopic = {
    id: string;
    slug: string;
    weightage: string | null;
    prerequisites: Array<{
      prerequisiteTopicId: string;
      dependencyType: "strong" | "weak";
    }>;
  };

  const foundation: FocusTopic = {
    id: "foundation",
    slug: "foundation",
    weightage: null,
    prerequisites: [],
  };
  const target: FocusTopic = {
    id: "target",
    slug: "target",
    weightage: "12.00",
    prerequisites: [
      { prerequisiteTopicId: foundation.id, dependencyType: "strong" as const },
    ],
  };

  it("keeps strong prerequisite closure in exam focus", () => {
    const result = buildFocusReasons(
      [target],
      new Map<string, FocusTopic>([
        [foundation.id, foundation],
        [target.id, target],
      ]),
      (topic) => `${normalizeWeightage(topic.weightage)}% exam weight`,
    );

    expect(result).toContainEqual({
      slug: "target",
      reason: "12% exam weight",
      isPrerequisite: false,
    });
    expect(result).toContainEqual({
      slug: "foundation",
      reason: "Required foundation",
      isPrerequisite: true,
    });
  });

  it("does not present invalid weightage as exam evidence", () => {
    expect(normalizeWeightage("101")).toBeNull();
    expect(normalizeWeightage("-1")).toBeNull();
    expect(normalizeWeightage("not-a-number")).toBeNull();
  });
});

describe("outline-first interaction", () => {
  const units: CourseLearningUnit[] = [
    {
      id: "unit",
      slug: "unit",
      name: "Unit one",
      description: null,
      unitType: "module",
      sortOrder: 1,
      estimatedHours: 2,
      topicCount: 1,
      topics: [
        {
          id: "topic",
          slug: "selected-topic",
          name: "Selected topic",
          description: null,
          priority: "core",
          hours: 2,
          weightage: 20,
          sortOrder: 1,
          parentTopicId: null,
          resourceCount: 0,
          prerequisites: [],
          children: [],
        },
      ],
    },
  ];

  it("renders selected topic detail inline with an accessible current row", () => {
    const markup = renderToStaticMarkup(
      createElement(SyllabusOutline, {
        units,
        selectedTopicSlug: "selected-topic",
        focusMode: "overview",
        focusReasons: new Map(),
        search: "",
        onSearchChange: () => {},
        onSelectTopic: () => {},
        renderSelectedTopicDetail: () =>
          createElement("div", null, "Inline selected topic detail"),
      }),
    );

    expect(markup).toContain('aria-current="true"');
    expect(markup).toContain("Inline selected topic detail");
  });
});
