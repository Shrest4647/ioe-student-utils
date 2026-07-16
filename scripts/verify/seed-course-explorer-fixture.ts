import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  academicCourses,
  courseTopics,
  courseUnits,
  resources,
  topicPrerequisites,
  topicResourceLinks,
} from "@/server/db/schema";

const fixture = {
  courseId: "course-explorer-visual-fixture-id",
  courseSlug: "course-explorer-visual-fixture",
  resourceId: "course-explorer-visual-fixture-resource",
};

async function cleanup() {
  await db
    .delete(academicCourses)
    .where(eq(academicCourses.id, fixture.courseId));
  await db.delete(resources).where(eq(resources.id, fixture.resourceId));
}

async function seed() {
  await cleanup();

  await db.insert(academicCourses).values({
    id: fixture.courseId,
    slug: fixture.courseSlug,
    code: "CE 501",
    name: "Computing Systems",
    description:
      "A representative outline for verifying hierarchy, focus, resources, and responsive behavior.",
    credits: "3",
    isActive: true,
  });
  await db.insert(courseUnits).values([
    {
      id: "course-explorer-visual-unit-foundations",
      slug: "computing-foundations",
      courseId: fixture.courseId,
      name: "Computing foundations",
      description: "Core concepts used throughout the course.",
      unitType: "module",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "course-explorer-visual-unit-applications",
      slug: "systems-applications",
      courseId: fixture.courseId,
      name: "Systems applications",
      description: "Apply the foundations to practical systems problems.",
      unitType: "module",
      sortOrder: 2,
      isActive: true,
    },
  ]);
  await db.insert(courseTopics).values([
    {
      id: "course-explorer-visual-topic-architecture",
      slug: "computer-architecture",
      unitId: "course-explorer-visual-unit-foundations",
      name: "Computer architecture",
      description: "Understand processors, memory, and instruction flow.",
      priorityLevel: "core",
      hours: 4,
      weightage: "20",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "course-explorer-visual-topic-memory",
      slug: "memory-hierarchy",
      unitId: "course-explorer-visual-unit-foundations",
      parentTopicId: "course-explorer-visual-topic-architecture",
      name: "Memory hierarchy",
      description: "Compare caches, primary memory, and storage.",
      priorityLevel: "important",
      hours: 2,
      weightage: "12",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: "course-explorer-visual-topic-os",
      slug: "operating-system-services",
      unitId: "course-explorer-visual-unit-applications",
      name: "Operating system services",
      description:
        "Connect hardware foundations to process and memory services.",
      priorityLevel: "core",
      hours: 3,
      weightage: "18",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "course-explorer-visual-topic-observability",
      slug: "systems-observability",
      unitId: "course-explorer-visual-unit-applications",
      name: "Systems observability",
      description: "Use logs and metrics to understand running systems.",
      priorityLevel: "optional",
      hours: 2,
      weightage: null,
      sortOrder: 2,
      isActive: true,
    },
  ]);
  await db.insert(topicPrerequisites).values({
    id: "course-explorer-visual-prerequisite",
    topicId: "course-explorer-visual-topic-os",
    prerequisiteTopicId: "course-explorer-visual-topic-architecture",
    dependencyType: "strong",
  });
  await db.insert(resources).values({
    id: fixture.resourceId,
    title: "Computing systems study guide",
    description: "A disposable resource used for visual verification.",
    s3Url: "https://example.com/computing-systems-study-guide",
  });
  await db.insert(topicResourceLinks).values({
    id: "course-explorer-visual-resource-link",
    topicId: "course-explorer-visual-topic-architecture",
    resourceId: fixture.resourceId,
    relevance: "primary",
    sortOrder: 1,
  });
}

const action = process.argv[2];
if (action === "seed") {
  await seed();
  console.log(`/course-explorer/${fixture.courseSlug}`);
} else if (action === "cleanup") {
  await cleanup();
  console.log("Course Explorer verification fixture removed.");
} else {
  throw new Error("Use 'seed' or 'cleanup'.");
}

process.exit(0);
