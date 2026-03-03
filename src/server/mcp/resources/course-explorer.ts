import {
  type McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { academicCourses } from "@/server/db/schema";
import { exportCourseGraph } from "@/server/elysia/services/course-graph-service";
import { COURSE_GRAPH_LIMITS } from "@/types/course-graph";
import { ensureResourcePermission } from "../guards";

async function findCourseBySlug(slug: string) {
  return db.query.academicCourses.findFirst({
    where: { slug },
  });
}

export function registerCourseExplorerResources(server: McpServer): void {
  server.registerResource(
    "course-graph-schema-v1",
    "ioesu://course-explorer/schema/course-graph-v1",
    {
      title: "Course Graph Schema v1",
      description:
        "Canonical nested course graph payload schema for Course Explorer authoring.",
      mimeType: "application/json",
    },
    async (_uri, extra) => {
      ensureResourcePermission(extra as any, "course_explorer", "read");

      return {
        contents: [
          {
            uri: "ioesu://course-explorer/schema/course-graph-v1",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                schemaVersion: "v1",
                limits: COURSE_GRAPH_LIMITS,
                shape: {
                  course: {
                    id: "string?",
                    slug: "string?",
                    code: "string?",
                    name: "string",
                    description: "string|null?",
                    credits: "string|null?",
                    isActive: "boolean?",
                    externalKey: "string?",
                  },
                  units: [
                    {
                      id: "string?",
                      slug: "string?",
                      name: "string",
                      description: "string|null?",
                      unitType: "module|chapter",
                      sortOrder: "number?",
                      isActive: "boolean?",
                      externalKey: "string?",
                      topics: [
                        {
                          id: "string?",
                          slug: "string?",
                          name: "string",
                          description: "string|null?",
                          priorityLevel: "core|important|optional",
                          hours: "number?",
                          weightage: "number|null?",
                          sortOrder: "number?",
                          parentTopicRef: "{id?|slug?|externalKey?}|null?",
                          prerequisites: [
                            {
                              topicRef: "{id?|slug?|externalKey?}",
                              dependencyType: "strong|weak",
                            },
                          ],
                          resources: [
                            {
                              resourceId: "string",
                              relevance: "primary|supplementary|practice",
                              sortOrder: "number?",
                            },
                          ],
                          isActive: "boolean?",
                          externalKey: "string?",
                        },
                      ],
                    },
                  ],
                },
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerResource(
    "course-graph-enums",
    "ioesu://course-explorer/reference/enums",
    {
      title: "Course Explorer Enums",
      description:
        "Reference enum values for priority, relevance, dependency, and unit types.",
      mimeType: "application/json",
    },
    async (_uri, extra) => {
      ensureResourcePermission(extra as any, "course_explorer", "read");

      return {
        contents: [
          {
            uri: "ioesu://course-explorer/reference/enums",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                unitType: ["module", "chapter"],
                priorityLevel: ["core", "important", "optional"],
                dependencyType: ["strong", "weak"],
                relevance: ["primary", "supplementary", "practice"],
                upsertMode: ["create", "merge", "replace"],
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerResource(
    "course-graph-template",
    new ResourceTemplate("ioesu://course-explorer/courses/{slug}/graph", {
      list: async () => {
        const courses = await db
          .select({ slug: academicCourses.slug })
          .from(academicCourses)
          .where(eq(academicCourses.isActive, true))
          .limit(100);
        return {
          resources: courses.map((course) => ({
            uri: `ioesu://course-explorer/courses/${course.slug}/graph`,
            name: course.slug,
          })),
        };
      },
    }),
    {
      title: "Course Graph Export",
      description: "Exports a course graph payload for a course slug.",
      mimeType: "application/json",
    },
    async (_uri, variables, extra) => {
      ensureResourcePermission(extra as any, "course_explorer", "read");

      const slug = String(variables.slug ?? "");
      const course = await findCourseBySlug(slug);
      if (!course) {
        throw new Error(`Course with slug '${slug}' not found`);
      }

      const graph = await exportCourseGraph(course.id);

      return {
        contents: [
          {
            uri: `ioesu://course-explorer/courses/${slug}/graph`,
            mimeType: "application/json",
            text: JSON.stringify(graph, null, 2),
          },
        ],
      };
    },
  );

  server.registerResource(
    "course-summary-template",
    new ResourceTemplate("ioesu://course-explorer/courses/{slug}/summary", {
      list: async () => {
        const courses = await db
          .select({ slug: academicCourses.slug, name: academicCourses.name })
          .from(academicCourses)
          .where(eq(academicCourses.isActive, true))
          .limit(100);

        return {
          resources: courses.map((course) => ({
            uri: `ioesu://course-explorer/courses/${course.slug}/summary`,
            name: course.name,
          })),
        };
      },
    }),
    {
      title: "Course Graph Summary",
      description: "Returns a lightweight summary for a course graph.",
      mimeType: "application/json",
    },
    async (_uri, variables, extra) => {
      ensureResourcePermission(extra as any, "course_explorer", "read");

      const slug = String(variables.slug ?? "");
      const course = await db.query.academicCourses.findFirst({
        where: { slug, isActive: true },
        with: {
          units: {
            where: { isActive: true },
            with: {
              topics: {
                where: { isActive: true },
                columns: {
                  id: true,
                  priorityLevel: true,
                },
              },
            },
          },
        },
      });

      if (!course) {
        throw new Error(`Course with slug '${slug}' not found`);
      }

      const topicCount = course.units.reduce(
        (acc, unit) => acc + unit.topics.length,
        0,
      );

      const coreTopicCount = course.units.reduce(
        (acc, unit) =>
          acc +
          unit.topics.filter((topic) => topic.priorityLevel === "core").length,
        0,
      );

      return {
        contents: [
          {
            uri: `ioesu://course-explorer/courses/${slug}/summary`,
            mimeType: "application/json",
            text: JSON.stringify(
              {
                id: course.id,
                slug: course.slug,
                code: course.code,
                name: course.name,
                units: course.units.length,
                topics: topicCount,
                coreTopics: coreTopicCount,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
