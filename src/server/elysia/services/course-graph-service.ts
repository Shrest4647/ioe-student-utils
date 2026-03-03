import { and, eq, inArray, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  academicCourses,
  courseTopics,
  courseUnits,
  topicPrerequisites,
  topicResourceLinks,
} from "@/server/db/schema";
import {
  buildRefKey,
  type CourseGraphDiffResult,
  type CourseGraphInputV1,
  type CourseGraphUpsertResult,
} from "@/types/course-graph";
import { validateCourseGraphInput } from "./course-graph-validator";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function codeify(value: string) {
  return value
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function resolveTargetCourse(
  input: CourseGraphInputV1,
  targetCourseId?: string,
  targetCourseSlug?: string,
) {
  if (targetCourseId) {
    return db.query.academicCourses.findFirst({
      where: { id: targetCourseId },
    });
  }

  if (targetCourseSlug) {
    return db.query.academicCourses.findFirst({
      where: { slug: targetCourseSlug },
    });
  }

  if (input.course.id) {
    return db.query.academicCourses.findFirst({
      where: { id: input.course.id },
    });
  }

  if (input.course.code) {
    return db.query.academicCourses.findFirst({
      where: { code: input.course.code },
    });
  }

  if (input.course.slug) {
    return db.query.academicCourses.findFirst({
      where: { slug: input.course.slug },
    });
  }

  return null;
}

async function getExistingCourseGraph(courseId: string) {
  return db.query.academicCourses.findFirst({
    where: { id: courseId },
    with: {
      units: {
        with: {
          topics: {
            with: {
              prerequisites: true,
              resources: true,
            },
          },
        },
      },
    },
  });
}

export async function computeCourseGraphDiff(
  input: unknown,
  options?: {
    targetCourseId?: string;
    targetCourseSlug?: string;
    mode?: "create" | "merge" | "replace";
  },
): Promise<CourseGraphDiffResult> {
  const mode = options?.mode ?? "merge";
  const validated = await validateCourseGraphInput(input);

  if (!validated.parsed) {
    return {
      mode,
      creates: {
        course: [],
        units: [],
        topics: [],
        prerequisites: [],
        resources: [],
      },
      updates: {
        course: [],
        units: [],
        topics: [],
        prerequisites: [],
        resources: [],
      },
      deactivations: {
        course: [],
        units: [],
        topics: [],
        prerequisites: [],
        resources: [],
      },
      validation: validated.result,
    };
  }

  const parsed = validated.parsed;
  const existingCourse = await resolveTargetCourse(
    parsed,
    options?.targetCourseId,
    options?.targetCourseSlug,
  );

  const creates = {
    course: [] as string[],
    units: [] as string[],
    topics: [] as string[],
    prerequisites: [] as string[],
    resources: [] as string[],
  };

  const updates = {
    course: [] as string[],
    units: [] as string[],
    topics: [] as string[],
    prerequisites: [] as string[],
    resources: [] as string[],
  };

  const deactivations = {
    course: [] as string[],
    units: [] as string[],
    topics: [] as string[],
    prerequisites: [] as string[],
    resources: [] as string[],
  };

  if (!existingCourse) {
    creates.course.push(parsed.course.name);
    for (const unit of parsed.units) {
      creates.units.push(unit.slug ?? unit.name);
      for (const topic of unit.topics) {
        creates.topics.push(topic.slug ?? topic.name);
        for (const prereq of topic.prerequisites ?? []) {
          creates.prerequisites.push(
            `${topic.slug ?? topic.name}<=${buildRefKey(prereq.topicRef)}`,
          );
        }
        for (const link of topic.resources ?? []) {
          creates.resources.push(
            `${topic.slug ?? topic.name}=>${link.resourceId}`,
          );
        }
      }
    }

    return {
      mode,
      creates,
      updates,
      deactivations,
      validation: validated.result,
    };
  }

  updates.course.push(existingCourse.id);

  const existing = await getExistingCourseGraph(existingCourse.id);
  const existingUnits = existing?.units ?? [];
  const existingUnitsById = new Map(
    existingUnits.map((unit) => [unit.id, unit]),
  );
  const existingUnitsBySlug = new Map(
    existingUnits.map((unit) => [unit.slug, unit]),
  );

  const seenUnitIds = new Set<string>();
  const seenTopicIds = new Set<string>();

  for (const unit of parsed.units) {
    const matchedUnit =
      (unit.id ? existingUnitsById.get(unit.id) : undefined) ??
      (unit.slug ? existingUnitsBySlug.get(unit.slug) : undefined);

    if (matchedUnit) {
      updates.units.push(matchedUnit.id);
      seenUnitIds.add(matchedUnit.id);

      const topicsById = new Map(
        matchedUnit.topics.map((topic) => [topic.id, topic]),
      );
      const topicsBySlug = new Map(
        matchedUnit.topics.map((topic) => [topic.slug, topic]),
      );

      for (const topic of unit.topics) {
        const matchedTopic =
          (topic.id ? topicsById.get(topic.id) : undefined) ??
          (topic.slug ? topicsBySlug.get(topic.slug) : undefined);

        if (matchedTopic) {
          updates.topics.push(matchedTopic.id);
          seenTopicIds.add(matchedTopic.id);
        } else {
          creates.topics.push(topic.slug ?? topic.name);
        }

        for (const prereq of topic.prerequisites ?? []) {
          const prereqKey = `${topic.slug ?? topic.name}<=${buildRefKey(prereq.topicRef)}`;
          creates.prerequisites.push(prereqKey);
        }

        for (const link of topic.resources ?? []) {
          creates.resources.push(
            `${topic.slug ?? topic.name}=>${link.resourceId}`,
          );
        }
      }
    } else {
      creates.units.push(unit.slug ?? unit.name);
      for (const topic of unit.topics) {
        creates.topics.push(topic.slug ?? topic.name);
        for (const prereq of topic.prerequisites ?? []) {
          creates.prerequisites.push(
            `${topic.slug ?? topic.name}<=${buildRefKey(prereq.topicRef)}`,
          );
        }
        for (const link of topic.resources ?? []) {
          creates.resources.push(
            `${topic.slug ?? topic.name}=>${link.resourceId}`,
          );
        }
      }
    }
  }

  if (mode === "replace") {
    for (const unit of existingUnits) {
      if (!seenUnitIds.has(unit.id)) {
        deactivations.units.push(unit.id);
      }

      for (const topic of unit.topics) {
        if (!seenTopicIds.has(topic.id)) {
          deactivations.topics.push(topic.id);
        }
      }
    }
  }

  return {
    mode,
    targetCourseId: existingCourse.id,
    creates,
    updates,
    deactivations,
    validation: validated.result,
  };
}

export async function exportCourseGraph(
  courseId: string,
): Promise<CourseGraphInputV1> {
  const existing = await getExistingCourseGraph(courseId);
  if (!existing) {
    throw new Error("Course not found");
  }

  return {
    schemaVersion: "v1",
    course: {
      id: existing.id,
      slug: existing.slug,
      code: existing.code,
      name: existing.name,
      description: existing.description,
      credits: existing.credits,
      isActive: existing.isActive,
    },
    units: existing.units
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((unit) => ({
        id: unit.id,
        slug: unit.slug,
        name: unit.name,
        description: unit.description,
        unitType: unit.unitType,
        sortOrder: unit.sortOrder,
        isActive: unit.isActive,
        topics: unit.topics
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((topic) => ({
            id: topic.id,
            slug: topic.slug,
            name: topic.name,
            description: topic.description,
            priorityLevel: topic.priorityLevel,
            hours: topic.hours,
            weightage: topic.weightage != null ? Number(topic.weightage) : null,
            sortOrder: topic.sortOrder,
            isActive: topic.isActive,
            parentTopicRef: topic.parentTopicId
              ? { id: topic.parentTopicId }
              : null,
            prerequisites: topic.prerequisites.map((prereq) => ({
              topicRef: { id: prereq.prerequisiteTopicId },
              dependencyType: prereq.dependencyType,
            })),
            resources: topic.resources.map((resource) => ({
              resourceId: resource.resourceId,
              relevance: resource.relevance,
              sortOrder: resource.sortOrder,
            })),
          })),
      })),
  };
}

export async function upsertCourseGraph(
  input: unknown,
  options: {
    mode: "create" | "merge" | "replace";
    targetCourseId?: string;
    targetCourseSlug?: string;
  },
): Promise<CourseGraphUpsertResult> {
  const validated = await validateCourseGraphInput(input);
  if (!validated.parsed) {
    throw new Error(JSON.stringify(validated.result));
  }

  if (!validated.result.valid) {
    throw new Error(JSON.stringify(validated.result));
  }

  const parsed = validated.parsed;
  const mode = options.mode;

  const existingCourse = await resolveTargetCourse(
    parsed,
    options.targetCourseId,
    options.targetCourseSlug,
  );

  if (mode === "create" && existingCourse) {
    throw new Error("Course already exists for create mode");
  }

  const now = new Date();

  return db.transaction(async (tx) => {
    let courseId = existingCourse?.id;
    let courseSlug = existingCourse?.slug;
    let courseCode = existingCourse?.code;
    let courseCreated = false;

    const created = {
      units: 0,
      topics: 0,
      prerequisites: 0,
      resources: 0,
    };

    const updated = {
      units: 0,
      topics: 0,
    };

    const deactivated = {
      units: 0,
      topics: 0,
      prerequisites: 0,
      resources: 0,
    };

    if (!courseId) {
      courseId = nanoid();
      courseSlug = parsed.course.slug ?? slugify(parsed.course.name);
      courseCode = parsed.course.code ?? codeify(parsed.course.name);

      await tx.insert(academicCourses).values({
        id: courseId,
        slug: courseSlug,
        code: courseCode,
        name: parsed.course.name,
        description: parsed.course.description ?? null,
        credits: parsed.course.credits ?? null,
        isActive: parsed.course.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      courseCreated = true;
    } else {
      await tx
        .update(academicCourses)
        .set({
          slug: parsed.course.slug ?? existingCourse?.slug,
          code: parsed.course.code ?? existingCourse?.code,
          name: parsed.course.name,
          description: parsed.course.description ?? null,
          credits: parsed.course.credits ?? null,
          isActive: parsed.course.isActive ?? true,
          updatedAt: now,
        })
        .where(eq(academicCourses.id, courseId));

      courseSlug =
        parsed.course.slug ??
        existingCourse?.slug ??
        slugify(parsed.course.name);
      courseCode =
        parsed.course.code ??
        existingCourse?.code ??
        codeify(parsed.course.name);
    }

    const existingUnits = await tx
      .select()
      .from(courseUnits)
      .where(eq(courseUnits.courseId, courseId));

    const existingUnitsById = new Map(
      existingUnits.map((unit) => [unit.id, unit]),
    );
    const existingUnitsBySlug = new Map(
      existingUnits.map((unit) => [unit.slug, unit]),
    );

    const touchedUnitIds = new Set<string>();
    const touchedTopicIds = new Set<string>();

    type TopicWorkItem = {
      topicId: string;
      topicInput: CourseGraphInputV1["units"][number]["topics"][number];
      unitId: string;
    };

    const topicWork: TopicWorkItem[] = [];
    const refToTopicId = new Map<string, string>();

    for (const [unitIndex, unitInput] of parsed.units.entries()) {
      const matchedUnit =
        (unitInput.id ? existingUnitsById.get(unitInput.id) : undefined) ??
        (unitInput.slug ? existingUnitsBySlug.get(unitInput.slug) : undefined);

      let unitId = matchedUnit?.id;
      const unitSlug =
        unitInput.slug ??
        (matchedUnit?.slug
          ? matchedUnit.slug
          : slugify(`${parsed.course.name}-${unitInput.name}-${unitIndex}`));

      if (!unitId) {
        unitId = nanoid();
        await tx.insert(courseUnits).values({
          id: unitId,
          courseId,
          slug: unitSlug,
          name: unitInput.name,
          description: unitInput.description ?? null,
          unitType: unitInput.unitType,
          sortOrder: unitInput.sortOrder ?? unitIndex,
          isActive: unitInput.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        });
        created.units += 1;
      } else {
        await tx
          .update(courseUnits)
          .set({
            slug: unitSlug,
            name: unitInput.name,
            description: unitInput.description ?? null,
            unitType: unitInput.unitType,
            sortOrder: unitInput.sortOrder ?? unitIndex,
            isActive: unitInput.isActive ?? true,
            updatedAt: now,
          })
          .where(eq(courseUnits.id, unitId));
        updated.units += 1;
      }

      touchedUnitIds.add(unitId);

      const existingTopicsForUnit = await tx
        .select()
        .from(courseTopics)
        .where(eq(courseTopics.unitId, unitId));

      const existingTopicsById = new Map(
        existingTopicsForUnit.map((topic) => [topic.id, topic]),
      );
      const existingTopicsBySlug = new Map(
        existingTopicsForUnit.map((topic) => [topic.slug, topic]),
      );

      for (const [topicIndex, topicInput] of unitInput.topics.entries()) {
        const matchedTopic =
          (topicInput.id ? existingTopicsById.get(topicInput.id) : undefined) ??
          (topicInput.slug
            ? existingTopicsBySlug.get(topicInput.slug)
            : undefined);

        let topicId = matchedTopic?.id;
        const topicSlug =
          topicInput.slug ??
          (matchedTopic?.slug
            ? matchedTopic.slug
            : slugify(`${unitInput.name}-${topicInput.name}-${topicIndex}`));

        if (!topicId) {
          topicId = nanoid();
          await tx.insert(courseTopics).values({
            id: topicId,
            unitId,
            slug: topicSlug,
            name: topicInput.name,
            description: topicInput.description ?? null,
            priorityLevel: topicInput.priorityLevel,
            hours: topicInput.hours ?? 0,
            weightage:
              topicInput.weightage != null
                ? String(topicInput.weightage)
                : null,
            sortOrder: topicInput.sortOrder ?? topicIndex,
            parentTopicId: null,
            isExternalReference: false,
            externalTopicId: null,
            isActive: topicInput.isActive ?? true,
            createdAt: now,
            updatedAt: now,
          });
          created.topics += 1;
        } else {
          await tx
            .update(courseTopics)
            .set({
              unitId,
              slug: topicSlug,
              name: topicInput.name,
              description: topicInput.description ?? null,
              priorityLevel: topicInput.priorityLevel,
              hours: topicInput.hours ?? 0,
              weightage:
                topicInput.weightage != null
                  ? String(topicInput.weightage)
                  : null,
              sortOrder: topicInput.sortOrder ?? topicIndex,
              isActive: topicInput.isActive ?? true,
              updatedAt: now,
            })
            .where(eq(courseTopics.id, topicId));
          updated.topics += 1;
        }

        touchedTopicIds.add(topicId);

        if (topicInput.id) refToTopicId.set(`id:${topicInput.id}`, topicId);
        refToTopicId.set(`slug:${topicSlug}`, topicId);
        if (topicInput.externalKey) {
          refToTopicId.set(`external:${topicInput.externalKey}`, topicId);
        }

        topicWork.push({
          topicId,
          topicInput,
          unitId,
        });
      }
    }

    for (const item of topicWork) {
      const parentRef = item.topicInput.parentTopicRef;
      if (!parentRef) {
        await tx
          .update(courseTopics)
          .set({ parentTopicId: null, updatedAt: now })
          .where(eq(courseTopics.id, item.topicId));
        continue;
      }

      const parentKey = buildRefKey(parentRef);
      let parentTopicId = refToTopicId.get(parentKey);

      if (!parentTopicId && parentRef.id) {
        const existing = await tx
          .select({ id: courseTopics.id })
          .from(courseTopics)
          .where(eq(courseTopics.id, parentRef.id))
          .limit(1);
        parentTopicId = existing[0]?.id;
      }

      if (!parentTopicId && parentRef.slug) {
        const existing = await tx
          .select({ id: courseTopics.id })
          .from(courseTopics)
          .where(eq(courseTopics.slug, parentRef.slug))
          .limit(1);
        parentTopicId = existing[0]?.id;
      }

      if (!parentTopicId) {
        throw new Error(
          `Parent topic reference '${parentKey}' cannot be resolved during apply`,
        );
      }

      await tx
        .update(courseTopics)
        .set({ parentTopicId, updatedAt: now })
        .where(eq(courseTopics.id, item.topicId));
    }

    for (const item of topicWork) {
      const existingPrereqs = await tx
        .select()
        .from(topicPrerequisites)
        .where(eq(topicPrerequisites.topicId, item.topicId));

      const desiredPrereqKeys = new Set<string>();

      for (const prereq of item.topicInput.prerequisites ?? []) {
        const refKey = buildRefKey(prereq.topicRef);
        let prerequisiteTopicId = refToTopicId.get(refKey);

        if (!prerequisiteTopicId && prereq.topicRef.id) {
          const byId = await tx
            .select({ id: courseTopics.id })
            .from(courseTopics)
            .where(eq(courseTopics.id, prereq.topicRef.id))
            .limit(1);
          prerequisiteTopicId = byId[0]?.id;
        }

        if (!prerequisiteTopicId && prereq.topicRef.slug) {
          const bySlug = await tx
            .select({ id: courseTopics.id })
            .from(courseTopics)
            .where(eq(courseTopics.slug, prereq.topicRef.slug))
            .limit(1);
          prerequisiteTopicId = bySlug[0]?.id;
        }

        if (!prerequisiteTopicId) {
          throw new Error(`Unresolvable prerequisite topic ref '${refKey}'`);
        }

        const relationKey = `${item.topicId}:${prerequisiteTopicId}:${prereq.dependencyType}`;
        desiredPrereqKeys.add(relationKey);

        const exists = existingPrereqs.some(
          (existing) =>
            existing.prerequisiteTopicId === prerequisiteTopicId &&
            existing.dependencyType === prereq.dependencyType,
        );

        if (!exists) {
          await tx.insert(topicPrerequisites).values({
            id: nanoid(),
            topicId: item.topicId,
            prerequisiteTopicId,
            dependencyType: prereq.dependencyType,
            createdAt: now,
          });
          created.prerequisites += 1;
        }
      }

      if (mode === "replace") {
        for (const existing of existingPrereqs) {
          const key = `${item.topicId}:${existing.prerequisiteTopicId}:${existing.dependencyType}`;
          if (!desiredPrereqKeys.has(key)) {
            await tx
              .delete(topicPrerequisites)
              .where(eq(topicPrerequisites.id, existing.id));
            deactivated.prerequisites += 1;
          }
        }
      }

      const existingResources = await tx
        .select()
        .from(topicResourceLinks)
        .where(eq(topicResourceLinks.topicId, item.topicId));

      const desiredResourceKeys = new Set<string>();

      for (const link of item.topicInput.resources ?? []) {
        const key = `${item.topicId}:${link.resourceId}:${link.relevance}:${link.sortOrder ?? 0}`;
        desiredResourceKeys.add(key);

        const exists = existingResources.some(
          (existing) =>
            existing.resourceId === link.resourceId &&
            existing.relevance === link.relevance &&
            existing.sortOrder === (link.sortOrder ?? 0),
        );

        if (!exists) {
          await tx.insert(topicResourceLinks).values({
            id: nanoid(),
            topicId: item.topicId,
            resourceId: link.resourceId,
            relevance: link.relevance,
            sortOrder: link.sortOrder ?? 0,
            createdAt: now,
          });
          created.resources += 1;
        }
      }

      if (mode === "replace") {
        for (const existing of existingResources) {
          const key = `${item.topicId}:${existing.resourceId}:${existing.relevance}:${existing.sortOrder}`;
          if (!desiredResourceKeys.has(key)) {
            await tx
              .delete(topicResourceLinks)
              .where(eq(topicResourceLinks.id, existing.id));
            deactivated.resources += 1;
          }
        }
      }
    }

    if (mode === "replace") {
      if (touchedUnitIds.size > 0) {
        const inactiveUnits = await tx
          .select({ id: courseUnits.id })
          .from(courseUnits)
          .where(
            and(
              eq(courseUnits.courseId, courseId),
              inArray(courseUnits.id, Array.from(touchedUnitIds)),
            ),
          );

        const activeUnitIds = new Set(inactiveUnits.map((row) => row.id));

        const unitsToDeactivate = existingUnits
          .filter((unit) => !activeUnitIds.has(unit.id) && unit.isActive)
          .map((unit) => unit.id);

        if (unitsToDeactivate.length > 0) {
          await tx
            .update(courseUnits)
            .set({ isActive: false, updatedAt: now })
            .where(inArray(courseUnits.id, unitsToDeactivate));
          deactivated.units += unitsToDeactivate.length;

          await tx
            .update(courseTopics)
            .set({ isActive: false, updatedAt: now })
            .where(inArray(courseTopics.unitId, unitsToDeactivate));
        }
      }

      if (touchedTopicIds.size > 0) {
        const topicsToDeactivate = await tx
          .select({ id: courseTopics.id })
          .from(courseTopics)
          .where(
            and(
              inArray(courseTopics.unitId, Array.from(touchedUnitIds.values())),
              or(
                eq(courseTopics.isActive, true),
                eq(courseTopics.isActive, false),
              ),
            ),
          );

        const toDeactivateIds = topicsToDeactivate
          .map((topic) => topic.id)
          .filter((topicId) => !touchedTopicIds.has(topicId));

        if (toDeactivateIds.length > 0) {
          await tx
            .update(courseTopics)
            .set({ isActive: false, updatedAt: now })
            .where(inArray(courseTopics.id, toDeactivateIds));
          deactivated.topics += toDeactivateIds.length;
        }
      }
    }

    return {
      mode,
      course: {
        id: courseId,
        slug: courseSlug ?? slugify(parsed.course.name),
        code: courseCode ?? codeify(parsed.course.name),
        created: courseCreated,
      },
      created,
      updated,
      deactivated,
      validation: validated.result,
    };
  });
}
