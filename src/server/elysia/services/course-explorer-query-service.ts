import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  academicCourseSlugAliases,
  academicCourses,
  academicPrograms,
  collegeDepartmentProgramToCourses,
  collegeDepartmentsToPrograms,
} from "@/server/db/schema";
import type {
  CourseCatalogResult,
  CourseLearningTopic,
  CourseLearningUnit,
  CourseLearningView,
  CourseResolution,
  TopicFocusReason,
} from "@/types/course-learning";

interface CatalogOptions {
  search?: string;
  page?: number;
  limit?: number;
  readiness?: "ready" | "upcoming" | "all";
}

export async function resolveCourseReference(
  reference: string,
): Promise<CourseResolution | null> {
  const normalizedReference = decodeURIComponent(reference).trim();
  if (!normalizedReference) return null;

  const canonical = await db.query.academicCourses.findFirst({
    where: { slug: normalizedReference, isActive: true },
    columns: { id: true, slug: true, code: true, name: true },
  });

  if (canonical) {
    return { ...canonical, matchedBy: "slug" };
  }

  const aliasRows = await db
    .select({
      id: academicCourses.id,
      slug: academicCourses.slug,
      code: academicCourses.code,
      name: academicCourses.name,
    })
    .from(academicCourseSlugAliases)
    .innerJoin(
      academicCourses,
      eq(academicCourseSlugAliases.courseId, academicCourses.id),
    )
    .where(
      and(
        eq(academicCourseSlugAliases.slug, normalizedReference),
        eq(academicCourses.isActive, true),
      ),
    )
    .limit(1);

  if (aliasRows[0]) {
    return { ...aliasRows[0], matchedBy: "alias" };
  }

  const fallbackRows = await db
    .select({
      id: academicCourses.id,
      slug: academicCourses.slug,
      code: academicCourses.code,
      name: academicCourses.name,
    })
    .from(academicCourses)
    .where(
      and(
        eq(academicCourses.isActive, true),
        or(
          eq(academicCourses.id, normalizedReference),
          sql`lower(${academicCourses.code}) = lower(${normalizedReference})`,
        ),
      ),
    )
    .limit(1);

  const fallback = fallbackRows[0];
  if (!fallback) return null;

  return {
    ...fallback,
    matchedBy: fallback.id === normalizedReference ? "id" : "code",
  };
}

export async function listCourseCatalog(
  options: CatalogOptions = {},
): Promise<CourseCatalogResult> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 24));
  const search = options.search?.trim();
  const readiness = options.readiness ?? "all";
  const pattern = search ? `%${search}%` : undefined;

  const activeUnitCount = sql<number>`(
    select count(*)
    from "course_unit" as catalog_unit
    where catalog_unit."course_id" = "academic_course"."id"
      and catalog_unit."is_active" = true
  )`;
  const activeTopicCount = sql<number>`(
    select count(*)
    from "course_topic" as catalog_topic
    inner join "course_unit" as catalog_unit
      on catalog_unit."id" = catalog_topic."unit_id"
    where catalog_unit."course_id" = "academic_course"."id"
      and catalog_unit."is_active" = true
      and catalog_topic."is_active" = true
  )`;
  const resourceCount = sql<number>`(
    select count(*)
    from "topic_resource_link" as catalog_resource
    inner join "course_topic" as catalog_topic
      on catalog_topic."id" = catalog_resource."topic_id"
    inner join "course_unit" as catalog_unit
      on catalog_unit."id" = catalog_topic."unit_id"
    where catalog_unit."course_id" = "academic_course"."id"
      and catalog_unit."is_active" = true
      and catalog_topic."is_active" = true
  )`;

  const rows = await db
    .select({
      id: academicCourses.id,
      slug: academicCourses.slug,
      code: academicCourses.code,
      name: academicCourses.name,
      description: academicCourses.description,
      credits: academicCourses.credits,
      updatedAt: academicCourses.updatedAt,
      activeUnitCount,
      activeTopicCount,
      resourceCount,
    })
    .from(academicCourses)
    .where(
      and(
        eq(academicCourses.isActive, true),
        pattern
          ? or(
              ilike(academicCourses.name, pattern),
              ilike(academicCourses.code, pattern),
              sql`exists (
                select 1
                from "course_topic" as search_topic
                inner join "course_unit" as search_unit
                  on search_unit."id" = search_topic."unit_id"
                where search_unit."course_id" = "academic_course"."id"
                  and search_unit."is_active" = true
                  and search_topic."is_active" = true
                  and search_topic."name" ilike ${pattern}
              )`,
            )
          : undefined,
      ),
    )
    .orderBy(asc(academicCourses.code));

  const normalized = rows.map((row) => {
    const topicCount = Number(row.activeTopicCount ?? 0);
    return {
      ...row,
      activeUnitCount: Number(row.activeUnitCount ?? 0),
      activeTopicCount: topicCount,
      resourceCount: Number(row.resourceCount ?? 0),
      hasExplorerContent: topicCount > 0,
      updatedAt: row.updatedAt?.toISOString() ?? null,
    };
  });

  const readyCount = normalized.filter(
    (course) => course.hasExplorerContent,
  ).length;
  const upcomingCount = normalized.length - readyCount;
  const filtered = normalized.filter((course) => {
    if (readiness === "ready") return course.hasExplorerContent;
    if (readiness === "upcoming") return !course.hasExplorerContent;
    return true;
  });
  const offset = (page - 1) * limit;
  const data = filtered.slice(offset, offset + limit);
  const totalPages = Math.ceil(filtered.length / limit);

  return {
    data,
    metadata: {
      totalCount: filtered.length,
      readyCount,
      upcomingCount,
      currentPage: page,
      totalPages,
      limit,
      hasMore: page < totalPages,
    },
  };
}

export async function getCourseLearningView(
  reference: string,
): Promise<{ resolution: CourseResolution; view: CourseLearningView } | null> {
  const resolution = await resolveCourseReference(reference);
  if (!resolution) return null;

  const course = await db.query.academicCourses.findFirst({
    where: { id: resolution.id, isActive: true },
    with: {
      units: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        with: {
          topics: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            with: {
              prerequisites: {
                with: {
                  prerequisiteTopic: {
                    columns: {
                      id: true,
                      slug: true,
                      name: true,
                    },
                  },
                },
              },
              resources: {
                columns: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  const placements = await db
    .select({
      id: collegeDepartmentProgramToCourses.id,
      yearNumber: collegeDepartmentProgramToCourses.yearNumber,
      partNumber: collegeDepartmentProgramToCourses.partNumber,
      courseType: collegeDepartmentProgramToCourses.courseType,
      programId: academicPrograms.id,
      programCode: academicPrograms.code,
      programName: academicPrograms.name,
    })
    .from(collegeDepartmentProgramToCourses)
    .innerJoin(
      collegeDepartmentsToPrograms,
      eq(
        collegeDepartmentProgramToCourses.programId,
        collegeDepartmentsToPrograms.id,
      ),
    )
    .innerJoin(
      academicPrograms,
      eq(collegeDepartmentsToPrograms.programId, academicPrograms.id),
    )
    .where(
      and(
        eq(collegeDepartmentProgramToCourses.courseId, resolution.id),
        eq(collegeDepartmentProgramToCourses.isActive, true),
        eq(collegeDepartmentsToPrograms.isActive, true),
        eq(academicPrograms.isActive, true),
      ),
    );

  const programs = Array.from(
    new Map(
      placements.map((placement) => [
        placement.programId,
        {
          id: placement.programId,
          code: placement.programCode,
          name: placement.programName,
        },
      ]),
    ).values(),
  );
  const curriculumPlacements = Array.from(
    new Map(
      placements.map((placement) => [
        [
          placement.programId,
          placement.yearNumber,
          placement.partNumber,
          placement.courseType,
        ].join(":"),
        {
          id: placement.id,
          program: {
            id: placement.programId,
            code: placement.programCode,
            name: placement.programName,
          },
          yearNumber: placement.yearNumber,
          partNumber: placement.partNumber,
          courseType: placement.courseType,
        },
      ]),
    ).values(),
  );

  const flatTopics = course.units.flatMap((unit) =>
    unit.topics.map((topic) => ({ topic, unitId: unit.id })),
  );
  const topicById = new Map(flatTopics.map(({ topic }) => [topic.id, topic]));

  const units: CourseLearningUnit[] = course.units.map((unit) => {
    const mappedTopics = unit.topics.map<CourseLearningTopic>((topic) => ({
      id: topic.id,
      slug: topic.slug,
      name: topic.name,
      description: topic.description,
      priority: topic.priorityLevel,
      hours: topic.hours,
      weightage: normalizeWeightage(topic.weightage),
      sortOrder: topic.sortOrder,
      parentTopicId: topic.parentTopicId,
      resourceCount: topic.resources.length,
      prerequisites: topic.prerequisites
        .filter((item) => item.prerequisiteTopic !== null)
        .map((item) => ({
          id: item.prerequisiteTopicId,
          slug: item.prerequisiteTopic?.slug ?? "",
          name: item.prerequisiteTopic?.name ?? "Unknown topic",
          dependencyType: item.dependencyType,
        })),
      children: [],
    }));

    const mappedById = new Map(mappedTopics.map((topic) => [topic.id, topic]));
    const roots: CourseLearningTopic[] = [];
    for (const topic of mappedTopics) {
      const parent = topic.parentTopicId
        ? mappedById.get(topic.parentTopicId)
        : undefined;
      if (parent) parent.children.push(topic);
      else roots.push(topic);
    }

    return {
      id: unit.id,
      slug: unit.slug,
      name: unit.name,
      description: unit.description,
      unitType: unit.unitType,
      sortOrder: unit.sortOrder,
      estimatedHours: mappedTopics.reduce((sum, topic) => sum + topic.hours, 0),
      topicCount: mappedTopics.length,
      topics: roots,
    };
  });

  const examTargets = flatTopics
    .map(({ topic }) => topic)
    .filter((topic) => (normalizeWeightage(topic.weightage) ?? 0) > 0);
  const essentialTargets = flatTopics
    .map(({ topic }) => topic)
    .filter((topic) => topic.priorityLevel === "core");

  const focus = {
    exam: buildFocusReasons(examTargets, topicById, (topic) => {
      const weightage = normalizeWeightage(topic.weightage);
      return weightage ? `${weightage}% exam weight` : "Exam-relevant topic";
    }),
    essentials: buildFocusReasons(
      essentialTargets,
      topicById,
      () => "Core syllabus topic",
    ),
  };

  const activeTopicCount = flatTopics.length;
  const resourceTotal = flatTopics.reduce(
    (sum, { topic }) => sum + topic.resources.length,
    0,
  );

  return {
    resolution,
    view: {
      course: {
        id: course.id,
        slug: course.slug,
        code: course.code,
        name: course.name,
        description: course.description,
        credits: course.credits,
        updatedAt: course.updatedAt?.toISOString() ?? null,
      },
      programs,
      placements: curriculumPlacements,
      readiness: {
        activeUnitCount: course.units.length,
        activeTopicCount,
        resourceCount: resourceTotal,
        hasExplorerContent: activeTopicCount > 0,
      },
      units,
      focus,
    },
  };
}

export function normalizeWeightage(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : null;
}

export function buildFocusReasons(
  targets: Array<{
    id: string;
    slug: string;
    weightage: string | null;
    prerequisites: Array<{
      prerequisiteTopicId: string;
      dependencyType: "strong" | "weak";
    }>;
  }>,
  topicById: Map<
    string,
    {
      id: string;
      slug: string;
      weightage: string | null;
      prerequisites: Array<{
        prerequisiteTopicId: string;
        dependencyType: "strong" | "weak";
      }>;
    }
  >,
  targetReason: (topic: (typeof targets)[number]) => string,
): TopicFocusReason[] {
  const reasons = new Map<string, TopicFocusReason>();

  const addPrerequisites = (topicId: string, visited: Set<string>) => {
    if (visited.has(topicId)) return;
    visited.add(topicId);
    const topic = topicById.get(topicId);
    if (!topic) return;

    for (const prerequisite of topic.prerequisites) {
      if (prerequisite.dependencyType !== "strong") continue;
      const prerequisiteTopic = topicById.get(prerequisite.prerequisiteTopicId);
      if (!prerequisiteTopic) continue;
      if (!reasons.has(prerequisiteTopic.slug)) {
        reasons.set(prerequisiteTopic.slug, {
          slug: prerequisiteTopic.slug,
          reason: "Required foundation",
          isPrerequisite: true,
        });
      }
      addPrerequisites(prerequisiteTopic.id, visited);
    }
  };

  for (const target of targets) {
    reasons.set(target.slug, {
      slug: target.slug,
      reason: targetReason(target),
      isPrerequisite: false,
    });
    addPrerequisites(target.id, new Set());
  }

  return Array.from(reasons.values());
}
