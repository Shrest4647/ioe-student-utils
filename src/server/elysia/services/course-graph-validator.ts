import { inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { resources } from "@/server/db/schema";
import {
  buildRefKey,
  COURSE_GRAPH_LIMITS,
  type CourseGraphInputV1,
  type CourseGraphValidationResult,
  type ValidationIssue,
} from "@/types/course-graph";

const graphEntityRefSchema = z
  .object({
    id: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    externalKey: z.string().min(1).optional(),
  })
  .refine((value) => !!(value.id || value.slug || value.externalKey), {
    message: "Reference requires one of id, slug, or externalKey",
  });

const courseGraphInputSchema: z.ZodType<CourseGraphInputV1> = z.object({
  schemaVersion: z.literal("v1"),
  course: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    code: z.string().optional(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    credits: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
    externalKey: z.string().optional(),
  }),
  units: z.array(
    z.object({
      id: z.string().optional(),
      slug: z.string().optional(),
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      unitType: z.enum(["module", "chapter"]),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
      externalKey: z.string().optional(),
      topics: z.array(
        z.object({
          id: z.string().optional(),
          slug: z.string().optional(),
          name: z.string().min(1),
          description: z.string().nullable().optional(),
          priorityLevel: z.enum(["core", "important", "optional"]),
          hours: z.number().int().nonnegative().optional(),
          weightage: z.number().nullable().optional(),
          sortOrder: z.number().int().optional(),
          isActive: z.boolean().optional(),
          externalKey: z.string().optional(),
          parentTopicRef: graphEntityRefSchema.nullable().optional(),
          prerequisites: z
            .array(
              z.object({
                topicRef: graphEntityRefSchema,
                dependencyType: z.enum(["strong", "weak"]),
              }),
            )
            .optional(),
          resources: z
            .array(
              z.object({
                resourceId: z.string().min(1),
                relevance: z.enum(["primary", "supplementary", "practice"]),
                sortOrder: z.number().int().optional(),
              }),
            )
            .optional(),
        }),
      ),
    }),
  ),
});

type TopicPointer = {
  unitIndex: number;
  topicIndex: number;
  unitRef: string;
  topicRef: string;
};

function makePath(unitIndex: number, topicIndex?: number, suffix?: string) {
  const unitPath = `units[${unitIndex}]`;
  if (topicIndex === undefined) {
    return suffix ? `${unitPath}.${suffix}` : unitPath;
  }
  const topicPath = `${unitPath}.topics[${topicIndex}]`;
  return suffix ? `${topicPath}.${suffix}` : topicPath;
}

function detectCycles(
  edges: Array<{ from: string; to: string; path: string }>,
  issues: ValidationIssue[],
) {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const next = adjacency.get(edge.from) ?? [];
    next.push(edge.to);
    adjacency.set(edge.from, next);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  const dfs = (node: string) => {
    visited.add(node);
    inStack.add(node);

    for (const next of adjacency.get(node) ?? []) {
      if (!visited.has(next)) {
        dfs(next);
      } else if (inStack.has(next)) {
        issues.push({
          severity: "error",
          code: "PREREQUISITE_CYCLE",
          path: "units",
          message: `Detected prerequisite cycle involving ${node} -> ${next}`,
        });
      }
    }

    inStack.delete(node);
  };

  for (const node of adjacency.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }
}

export async function validateCourseGraphInput(input: unknown): Promise<{
  parsed: CourseGraphInputV1 | null;
  result: CourseGraphValidationResult;
}> {
  const issues: ValidationIssue[] = [];
  const parsedResult = courseGraphInputSchema.safeParse(input);

  if (!parsedResult.success) {
    for (const issue of parsedResult.error.issues) {
      issues.push({
        severity: "error",
        code: "SCHEMA_INVALID",
        path: issue.path.join("."),
        message: issue.message,
      });
    }

    return {
      parsed: null,
      result: {
        valid: false,
        issues,
        summary: {
          errors: issues.length,
          warnings: 0,
        },
      },
    };
  }

  const parsed = parsedResult.data;

  if (parsed.units.length > COURSE_GRAPH_LIMITS.maxUnits) {
    issues.push({
      severity: "error",
      code: "LIMIT_UNITS",
      path: "units",
      message: `Units exceed max limit (${COURSE_GRAPH_LIMITS.maxUnits})`,
    });
  }

  const topicRefs = new Map<string, TopicPointer>();
  const topicSlugs = new Set<string>();
  const unitSlugs = new Set<string>();
  let topicCount = 0;
  let prereqCount = 0;
  let resourceCount = 0;
  let coreTopics = 0;

  for (const [unitIndex, unit] of parsed.units.entries()) {
    if (unit.slug) {
      if (unitSlugs.has(unit.slug)) {
        issues.push({
          severity: "error",
          code: "DUPLICATE_UNIT_SLUG",
          path: makePath(unitIndex, undefined, "slug"),
          message: `Duplicate unit slug '${unit.slug}'`,
        });
      }
      unitSlugs.add(unit.slug);
    }

    for (const [topicIndex, topic] of unit.topics.entries()) {
      topicCount += 1;
      prereqCount += topic.prerequisites?.length ?? 0;
      resourceCount += topic.resources?.length ?? 0;

      if (topic.priorityLevel === "core") {
        coreTopics += 1;
      }

      if (!topic.description) {
        issues.push({
          severity: "warning",
          code: "TOPIC_DESCRIPTION_MISSING",
          path: makePath(unitIndex, topicIndex, "description"),
          message: `Topic '${topic.name}' has no description`,
        });
      }

      if ((topic.hours ?? 0) === 0) {
        issues.push({
          severity: "warning",
          code: "TOPIC_ZERO_HOURS",
          path: makePath(unitIndex, topicIndex, "hours"),
          message: `Topic '${topic.name}' has zero hours`,
        });
      }

      if (topic.slug) {
        if (topicSlugs.has(topic.slug)) {
          issues.push({
            severity: "error",
            code: "DUPLICATE_TOPIC_SLUG",
            path: makePath(unitIndex, topicIndex, "slug"),
            message: `Duplicate topic slug '${topic.slug}'`,
          });
        }
        topicSlugs.add(topic.slug);
      }

      const pointer: TopicPointer = {
        unitIndex,
        topicIndex,
        unitRef: unit.id ?? unit.slug ?? unit.externalKey ?? String(unitIndex),
        topicRef:
          topic.id ??
          topic.slug ??
          topic.externalKey ??
          `${unitIndex}:${topicIndex}`,
      };

      for (const key of [
        topic.id ? `id:${topic.id}` : undefined,
        topic.slug ? `slug:${topic.slug}` : undefined,
        topic.externalKey ? `external:${topic.externalKey}` : undefined,
      ]) {
        if (!key) continue;
        if (topicRefs.has(key)) {
          issues.push({
            severity: "error",
            code: "DUPLICATE_TOPIC_REF",
            path: makePath(unitIndex, topicIndex),
            message: `Duplicate topic reference '${key}'`,
          });
          continue;
        }
        topicRefs.set(key, pointer);
      }
    }
  }

  if (topicCount > COURSE_GRAPH_LIMITS.maxTopics) {
    issues.push({
      severity: "error",
      code: "LIMIT_TOPICS",
      path: "units",
      message: `Topics exceed max limit (${COURSE_GRAPH_LIMITS.maxTopics})`,
    });
  }

  if (prereqCount > COURSE_GRAPH_LIMITS.maxPrerequisites) {
    issues.push({
      severity: "error",
      code: "LIMIT_PREREQUISITES",
      path: "units",
      message: `Prerequisites exceed max limit (${COURSE_GRAPH_LIMITS.maxPrerequisites})`,
    });
  }

  if (resourceCount > COURSE_GRAPH_LIMITS.maxResources) {
    issues.push({
      severity: "error",
      code: "LIMIT_RESOURCES",
      path: "units",
      message: `Resource links exceed max limit (${COURSE_GRAPH_LIMITS.maxResources})`,
    });
  }

  const cycleEdges: Array<{ from: string; to: string; path: string }> = [];

  for (const [unitIndex, unit] of parsed.units.entries()) {
    for (const [topicIndex, topic] of unit.topics.entries()) {
      const ownRef =
        topic.id != null
          ? `id:${topic.id}`
          : topic.slug != null
            ? `slug:${topic.slug}`
            : topic.externalKey != null
              ? `external:${topic.externalKey}`
              : undefined;

      if (topic.parentTopicRef) {
        const parentKey = buildRefKey(topic.parentTopicRef);
        const resolvedParent = topicRefs.get(parentKey);

        if (!resolvedParent) {
          issues.push({
            severity: "error",
            code: "PARENT_TOPIC_NOT_FOUND",
            path: makePath(unitIndex, topicIndex, "parentTopicRef"),
            message: `Parent topic reference '${parentKey}' does not exist in payload`,
          });
        } else if (resolvedParent.unitIndex !== unitIndex) {
          issues.push({
            severity: "error",
            code: "PARENT_TOPIC_DIFFERENT_UNIT",
            path: makePath(unitIndex, topicIndex, "parentTopicRef"),
            message: "Parent topic must belong to the same unit",
          });
        }
      }

      for (const [prereqIndex, prereq] of (
        topic.prerequisites ?? []
      ).entries()) {
        const key = buildRefKey(prereq.topicRef);
        const resolved = topicRefs.get(key);
        if (!resolved) {
          issues.push({
            severity: "error",
            code: "PREREQUISITE_TOPIC_NOT_FOUND",
            path: makePath(
              unitIndex,
              topicIndex,
              `prerequisites[${prereqIndex}].topicRef`,
            ),
            message: `Prerequisite topic '${key}' was not found in payload`,
          });
          continue;
        }

        const from = ownRef ?? `${unitIndex}:${topicIndex}`;
        const to = key;

        cycleEdges.push({
          from,
          to,
          path: makePath(
            unitIndex,
            topicIndex,
            `prerequisites[${prereqIndex}]`,
          ),
        });
      }
    }
  }

  detectCycles(cycleEdges, issues);

  const resourceIds = parsed.units.flatMap((unit) =>
    unit.topics.flatMap((topic) =>
      (topic.resources ?? []).map((resourceLink) => resourceLink.resourceId),
    ),
  );

  if (resourceIds.length > 0) {
    const uniqueResourceIds = Array.from(new Set(resourceIds));
    const foundResources = await db
      .select({ id: resources.id })
      .from(resources)
      .where(inArray(resources.id, uniqueResourceIds));

    const foundSet = new Set(foundResources.map((resource) => resource.id));

    for (const [unitIndex, unit] of parsed.units.entries()) {
      for (const [topicIndex, topic] of unit.topics.entries()) {
        for (const [resourceIndex, resourceLink] of (
          topic.resources ?? []
        ).entries()) {
          if (!foundSet.has(resourceLink.resourceId)) {
            issues.push({
              severity: "error",
              code: "RESOURCE_NOT_FOUND",
              path: makePath(
                unitIndex,
                topicIndex,
                `resources[${resourceIndex}].resourceId`,
              ),
              message: `Resource '${resourceLink.resourceId}' does not exist or is not published`,
            });
          }
        }
      }
    }
  }

  if (coreTopics === 0) {
    issues.push({
      severity: "warning",
      code: "NO_CORE_TOPICS",
      path: "units",
      message: "Course graph has no core topics",
    });
  }

  const errorCount = issues.filter(
    (issue) => issue.severity === "error",
  ).length;
  const warningCount = issues.filter(
    (issue) => issue.severity === "warning",
  ).length;

  if (topicCount > 0 && resourceCount / topicCount < 0.2) {
    issues.push({
      severity: "warning",
      code: "SPARSE_RESOURCE_LINKAGE",
      path: "units",
      message: "Less than 20% of topics have resource links",
    });
  }

  return {
    parsed,
    result: {
      valid: errorCount === 0,
      issues,
      summary: {
        errors: errorCount,
        warnings: warningCount,
      },
    },
  };
}
