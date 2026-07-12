import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import type { CourseGraphInputV1 } from "@/types/course-graph";
import { ensureToolAccess } from "../guards";

/**
 * Register all course explorer bulk operation tools with MCP server
 *
 * These tools enable AI agents to perform bulk operations on course data including:
 * - Bulk create/update courses
 * - Bulk create/update units
 * - Bulk create/update topics
 * - Bulk create prerequisite relationships
 * - Bulk link resources to topics
 *
 * @param server - MCP server instance
 */
export function registerCourseExplorerTools(server: McpServer): void {
  // ============================================================================
  // Course Bulk Operations
  // ============================================================================

  const courseItemSchema = z.object({
    id: z
      .string()
      .optional()
      .describe("Course ID (for updates, omit for creates)"),
    name: z.string().describe("Course name"),
    slug: z
      .string()
      .optional()
      .describe("URL-friendly slug (auto-generated if not provided)"),
    code: z
      .string()
      .optional()
      .describe("Course code (auto-generated if not provided)"),
    description: z.string().optional().describe("Course description"),
    credits: z.string().optional().describe("Course credits"),
    isActive: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether the course is active"),
  });

  type CourseCreateInput = {
    name: string;
    slug?: string;
    code?: string;
    description?: string;
    credits?: string;
    isActive?: boolean;
  };

  type CourseUpdateInput = Partial<CourseCreateInput>;

  server.registerTool(
    "bulk_upsert_courses",
    {
      title: "Bulk Upsert Courses",
      description:
        "Create or update multiple courses in a single operation. If an ID is provided, the course will be updated; otherwise, a new course will be created.",
      inputSchema: z.object({
        courses: z
          .array(courseItemSchema)
          .min(1)
          .max(100)
          .describe("Array of courses to create or update (1-100 items)"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "bulk_upsert_courses",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const results = [];
        const errors = [];

        for (const course of params.courses) {
          try {
            if (course.id) {
              // Update existing course
              const body: CourseUpdateInput = {
                name: course.name,
                slug: course.slug,
                description: course.description,
                code: course.code,
                credits: course.credits,
                isActive: course.isActive,
              };

              const response = await api.api["course-explorer"].admin
                .courses({
                  id: course.id,
                })
                .patch(body, {
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                  },
                });

              if (response.error) {
                errors.push({
                  course: course.name,
                  error: "Failed to update course",
                });
              } else {
                results.push({
                  id: course.id,
                  name: course.name,
                  operation: "update",
                  success: true,
                });
              }
            } else {
              // Create new course
              const body: CourseCreateInput = {
                name: course.name,
                slug: course.slug,
                description: course.description,
                code: course.code,
                credits: course.credits,
                isActive: course.isActive,
              };

              const response = await api.api[
                "course-explorer"
              ].admin.courses.post(body, {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

              if (response.error || !response.data?.success) {
                errors.push({
                  course: course.name,
                  error: "Failed to create course",
                });
              } else {
                results.push({
                  id: response.data.data?.id,
                  slug: response.data.data?.slug,
                  name: course.name,
                  operation: "create",
                  success: true,
                });
              }
            }
          } catch (error) {
            errors.push({
              course: course.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: errors.length === 0,
                  data: results,
                  errors: errors.length > 0 ? errors : undefined,
                  summary: {
                    total: params.courses.length,
                    successful: results.length,
                    failed: errors.length,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_upsert_courses error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to process courses",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // Unit Bulk Operations
  // ============================================================================

  const unitItemSchema = z.object({
    id: z
      .string()
      .optional()
      .describe("Unit ID (for updates, omit for creates)"),
    courseId: z.string().describe("Parent course ID"),
    name: z.string().describe("Unit name"),
    slug: z
      .string()
      .optional()
      .describe("URL-friendly slug (auto-generated if not provided)"),
    description: z.string().optional().describe("Unit description"),
    unitType: z
      .enum(["module", "chapter"])
      .describe("Unit type: module or chapter"),
    sortOrder: z
      .number()
      .optional()
      .default(0)
      .describe("Sort order for display"),
    isActive: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether the unit is active"),
  });

  type UnitCreateInput = {
    courseId: string;
    name: string;
    slug?: string;
    description?: string;
    unitType: "module" | "chapter";
    sortOrder?: number;
    isActive?: boolean;
  };

  type UnitUpdateInput = Partial<Omit<UnitCreateInput, "courseId">>;

  server.registerTool(
    "bulk_upsert_units",
    {
      title: "Bulk Upsert Units",
      description:
        "Create or update multiple course units in a single operation. Units are the building blocks of courses (modules or chapters). If an ID is provided, the unit will be updated; otherwise, a new unit will be created.",
      inputSchema: z.object({
        units: z
          .array(unitItemSchema)
          .min(1)
          .max(100)
          .describe("Array of units to create or update (1-100 items)"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "bulk_upsert_units",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const results = [];
        const errors = [];

        for (const unit of params.units) {
          try {
            if (unit.id) {
              // Update existing unit
              const body: UnitUpdateInput = {
                name: unit.name,
                slug: unit.slug,
                description: unit.description,
                unitType: unit.unitType,
                sortOrder: unit.sortOrder,
                isActive: unit.isActive,
              };

              const response = await api.api["course-explorer"].admin
                .units({
                  id: unit.id,
                })
                .patch(body, {
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                  },
                });

              if (response.error) {
                errors.push({
                  unit: unit.name,
                  error: "Failed to update unit",
                });
              } else {
                results.push({
                  id: unit.id,
                  name: unit.name,
                  courseId: unit.courseId,
                  operation: "update",
                  success: true,
                });
              }
            } else {
              // Create new unit
              const body: UnitCreateInput = {
                courseId: unit.courseId,
                name: unit.name,
                slug: unit.slug,
                description: unit.description,
                unitType: unit.unitType,
                sortOrder: unit.sortOrder,
                isActive: unit.isActive,
              };

              const response = await api.api[
                "course-explorer"
              ].admin.units.post(body, {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

              if (response.error || !response.data?.success) {
                errors.push({
                  unit: unit.name,
                  error: "Failed to create unit",
                });
              } else {
                results.push({
                  id: response.data.data?.id,
                  slug: response.data.data?.slug,
                  name: unit.name,
                  courseId: unit.courseId,
                  operation: "create",
                  success: true,
                });
              }
            }
          } catch (error) {
            errors.push({
              unit: unit.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: errors.length === 0,
                  data: results,
                  errors: errors.length > 0 ? errors : undefined,
                  summary: {
                    total: params.units.length,
                    successful: results.length,
                    failed: errors.length,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_upsert_units error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to process units",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // Topic Bulk Operations
  // ============================================================================

  const topicItemSchema = z.object({
    id: z
      .string()
      .optional()
      .describe("Topic ID (for updates, omit for creates)"),
    unitId: z.string().describe("Parent unit ID"),
    name: z.string().describe("Topic name"),
    slug: z
      .string()
      .optional()
      .describe("URL-friendly slug (auto-generated if not provided)"),
    description: z.string().optional().describe("Topic description"),
    priorityLevel: z
      .enum(["core", "important", "optional"])
      .describe("Priority level: core, important, or optional"),
    hours: z.number().optional().default(0).describe("Estimated study hours"),
    weightage: z.number().optional().describe("Exam weightage percentage"),
    sortOrder: z
      .number()
      .optional()
      .default(0)
      .describe("Sort order for display"),
    parentTopicId: z
      .string()
      .optional()
      .describe("Parent topic ID for nested topics"),
    isActive: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether the topic is active"),
  });

  type TopicCreateInput = {
    unitId: string;
    name: string;
    slug?: string;
    description?: string;
    priorityLevel: "core" | "important" | "optional";
    hours?: number;
    weightage?: number;
    sortOrder?: number;
    parentTopicId?: string;
    isActive?: boolean;
  };

  server.registerTool(
    "bulk_upsert_topics",
    {
      title: "Bulk Upsert Topics",
      description:
        "Create or update multiple topics in a single operation. Topics are the learning items within units. If an ID is provided, the topic will be updated; otherwise, a new topic will be created.",
      inputSchema: z.object({
        topics: z
          .array(topicItemSchema)
          .min(1)
          .max(100)
          .describe("Array of topics to create or update (1-100 items)"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "bulk_upsert_topics",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const results = [];
        const errors = [];

        for (const topic of params.topics) {
          try {
            if (topic.id) {
              const response = await api.api["course-explorer"].admin
                .topics({
                  id: topic.id,
                })
                .patch(
                  {
                    name: topic.name,
                    slug: topic.slug,
                    description: topic.description,
                    priorityLevel: topic.priorityLevel,
                    hours: topic.hours,
                    weightage: topic.weightage,
                    sortOrder: topic.sortOrder,
                    parentTopicId: topic.parentTopicId,
                    isActive: topic.isActive,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                    },
                  },
                );

              if (response.error) {
                errors.push({
                  topic: topic.name,
                  error: "Failed to update topic",
                });
              } else {
                results.push({
                  id: topic.id,
                  name: topic.name,
                  unitId: topic.unitId,
                  operation: "update",
                  success: true,
                });
              }
            } else {
              // Create new topic
              const body: TopicCreateInput = {
                unitId: topic.unitId,
                name: topic.name,
                slug: topic.slug,
                description: topic.description,
                priorityLevel: topic.priorityLevel,
                hours: topic.hours,
                weightage: topic.weightage,
                sortOrder: topic.sortOrder,
                parentTopicId: topic.parentTopicId,
                isActive: topic.isActive,
              };

              const response = await api.api[
                "course-explorer"
              ].admin.topics.post(body, {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

              if (response.error || !response.data?.success) {
                errors.push({
                  topic: topic.name,
                  error: "Failed to create topic",
                });
              } else {
                results.push({
                  id: response.data.data?.id,
                  slug: response.data.data?.slug,
                  name: topic.name,
                  unitId: topic.unitId,
                  operation: "create",
                  success: true,
                });
              }
            }
          } catch (error) {
            errors.push({
              topic: topic.name,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: errors.length === 0,
                  data: results,
                  errors: errors.length > 0 ? errors : undefined,
                  summary: {
                    total: params.topics.length,
                    successful: results.length,
                    failed: errors.length,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_upsert_topics error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to process topics",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // Prerequisite Bulk Operations
  // ============================================================================

  const prerequisiteItemSchema = z.object({
    topicId: z.string().describe("Topic ID that has the prerequisite"),
    prerequisiteTopicId: z
      .string()
      .describe("Topic ID that is the prerequisite"),
    dependencyType: z
      .enum(["strong", "weak"])
      .describe("Dependency type: strong (required) or weak (recommended)"),
  });

  type PrerequisiteCreateInput = {
    prerequisiteTopicId: string;
    dependencyType: "strong" | "weak";
  };

  server.registerTool(
    "bulk_create_prerequisites",
    {
      title: "Bulk Create Prerequisites",
      description:
        "Create multiple prerequisite relationships between topics in a single operation. Prerequisites define learning dependencies where one topic must be completed before another.",
      inputSchema: z.object({
        prerequisites: z
          .array(prerequisiteItemSchema)
          .min(1)
          .max(100)
          .describe(
            "Array of prerequisite relationships to create (1-100 items)",
          ),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "bulk_create_prerequisites",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const results = [];
        const errors = [];

        for (const prereq of params.prerequisites) {
          try {
            const body: PrerequisiteCreateInput = {
              prerequisiteTopicId: prereq.prerequisiteTopicId,
              dependencyType: prereq.dependencyType,
            };

            const response = await api.api["course-explorer"].admin
              .topics({ id: prereq.topicId })
              .prerequisites.post(body, {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

            if (response.error || !response.data?.success) {
              errors.push({
                topicId: prereq.topicId,
                prerequisiteTopicId: prereq.prerequisiteTopicId,
                error: "Failed to create prerequisite",
              });
            } else {
              results.push({
                id: response.data.data?.id,
                topicId: prereq.topicId,
                prerequisiteTopicId: prereq.prerequisiteTopicId,
                dependencyType: prereq.dependencyType,
                success: true,
              });
            }
          } catch (error) {
            errors.push({
              topicId: prereq.topicId,
              prerequisiteTopicId: prereq.prerequisiteTopicId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: errors.length === 0,
                  data: results,
                  errors: errors.length > 0 ? errors : undefined,
                  summary: {
                    total: params.prerequisites.length,
                    successful: results.length,
                    failed: errors.length,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_create_prerequisites error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to create prerequisites",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // Resource Link Bulk Operations
  // ============================================================================

  const resourceLinkItemSchema = z.object({
    topicId: z.string().describe("Topic ID to link the resource to"),
    resourceId: z.string().describe("Resource ID to link"),
    relevance: z
      .enum(["primary", "supplementary", "practice"])
      .describe(
        "Relevance: primary (main material), supplementary (extra reading), or practice (exercises)",
      ),
    sortOrder: z
      .number()
      .optional()
      .default(0)
      .describe("Sort order for display"),
  });

  type ResourceLinkCreateInput = {
    resourceId: string;
    relevance: "primary" | "supplementary" | "practice";
    sortOrder?: number;
  };

  server.registerTool(
    "bulk_link_resources",
    {
      title: "Bulk Link Resources to Topics",
      description:
        "Link multiple existing resources to topics in a single operation. Resources must already exist in the resource library.",
      inputSchema: z.object({
        links: z
          .array(resourceLinkItemSchema)
          .min(1)
          .max(100)
          .describe("Array of resource-topic links to create (1-100 items)"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "bulk_link_resources",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const results = [];
        const errors = [];

        for (const link of params.links) {
          try {
            const body: ResourceLinkCreateInput = {
              resourceId: link.resourceId,
              relevance: link.relevance,
              sortOrder: link.sortOrder,
            };

            const response = await api.api["course-explorer"].admin
              .topics({ id: link.topicId })
              .resources.post(body, {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

            if (response.error || !response.data?.success) {
              errors.push({
                topicId: link.topicId,
                resourceId: link.resourceId,
                error: "Failed to link resource",
              });
            } else {
              results.push({
                id: response.data.data?.id,
                topicId: link.topicId,
                resourceId: link.resourceId,
                relevance: link.relevance,
                success: true,
              });
            }
          } catch (error) {
            errors.push({
              topicId: link.topicId,
              resourceId: link.resourceId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: errors.length === 0,
                  data: results,
                  errors: errors.length > 0 ? errors : undefined,
                  summary: {
                    total: params.links.length,
                    successful: results.length,
                    failed: errors.length,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_link_resources error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to link resources",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ============================================================================
  // Fetch Operations for Reference
  // ============================================================================

  server.registerTool(
    "fetch_courses",
    {
      title: "Fetch Courses",
      description:
        "Retrieve courses from the IOESU database with optional filtering and pagination.",
      inputSchema: z.object({
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Maximum number of courses to return (1-100, default: 20)"),
        offset: z
          .number()
          .int()
          .min(0)
          .default(0)
          .describe("Number of courses to skip for pagination"),
        search: z
          .string()
          .optional()
          .describe("Search term to filter by course name"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "fetch_courses",
        );

        const page = Math.floor(params.offset / params.limit) + 1;

        const response = await api.api["course-explorer"].courses.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          query: {
            limit: params.limit.toString(),
            page: page.toString(),
            search: params.search,
          },
        });

        if (response.error) {
          throw new Error(
            response.error.value &&
              typeof response.error.value === "object" &&
              "message" in response.error.value
              ? (response.error.value.message as string)
              : "Failed to fetch courses via API",
          );
        }

        if (!response.data?.success) {
          throw new Error("API request failed");
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: results,
                  pagination: {
                    limit: params.limit,
                    offset: params.offset,
                    totalCount: metadata?.totalCount,
                    totalPages: metadata?.totalPages,
                    hasMore: metadata?.hasMore,
                  },
                  filters: {
                    search: params.search,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_courses error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to fetch courses",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_course_structure",
    {
      title: "Get Course Structure",
      description:
        "Retrieve the complete hierarchical structure of a course including units, topics, prerequisites, and resource links.",
      inputSchema: z.object({
        courseId: z.string().optional().describe("Course ID"),
        courseSlug: z
          .string()
          .optional()
          .describe("Course slug (alternative to ID)"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "get_course_structure",
        );

        if (!params.courseId && !params.courseSlug) {
          throw new Error("Either courseId or courseSlug must be provided");
        }

        let response: any;
        if (params.courseSlug) {
          response = await api.api["course-explorer"].courses
            .slug({
              slug: params.courseSlug,
            })
            .get({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });
        } else {
          const courseId = params.courseId ?? "";
          response = await api.api["course-explorer"]
            .courses({
              id: courseId,
            })
            .get({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });
        }

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to fetch course structure",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: response.data.data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("get_course_structure error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to fetch course structure",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "validate_course_graph",
    {
      title: "Validate Course Graph",
      description:
        "Validate a nested course graph payload before persistence. Returns structured warnings/errors.",
      inputSchema: z.object({
        input: z.custom<CourseGraphInputV1>(),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "validate_course_graph",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const response = await api.api["course-explorer"].admin[
          "course-graphs"
        ].validate.post(
          {
            input: params.input as unknown as Record<string, unknown>,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to validate graph",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: response.data.data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("validate_course_graph error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to validate course graph",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "preview_course_graph_diff",
    {
      title: "Preview Course Graph Diff",
      description:
        "Preview deterministic create/update/deactivate changes for a nested course graph payload.",
      inputSchema: z.object({
        input: z.custom<CourseGraphInputV1>(),
        targetCourseId: z.string().optional(),
        targetCourseSlug: z.string().optional(),
        mode: z
          .enum(["create", "merge", "replace"])
          .optional()
          .default("merge"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "preview_course_graph_diff",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        const response = await api.api["course-explorer"].admin[
          "course-graphs"
        ].diff.post(
          {
            input: params.input as unknown as Record<string, unknown>,
            targetCourseId: params.targetCourseId,
            targetCourseSlug: params.targetCourseSlug,
            mode: params.mode,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to preview graph diff",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: response.data.data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("preview_course_graph_diff error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to preview course graph diff",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "upsert_course_graph",
    {
      title: "Upsert Course Graph",
      description:
        "Apply a nested course graph atomically (create/merge/replace). Supports dry run mode.",
      inputSchema: z.object({
        input: z.custom<CourseGraphInputV1>(),
        targetCourseId: z.string().optional(),
        targetCourseSlug: z.string().optional(),
        mode: z.enum(["create", "merge", "replace"]).default("merge"),
        dryRun: z.boolean().optional().default(false),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "upsert_course_graph",
          {
            roles: ["admin", "instructor", "mcp_admin"],
          },
        );

        if (params.dryRun) {
          const [validation, diff] = await Promise.all([
            api.api["course-explorer"].admin["course-graphs"].validate.post(
              {
                input: params.input as unknown as Record<string, unknown>,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            ),
            api.api["course-explorer"].admin["course-graphs"].diff.post(
              {
                input: params.input as unknown as Record<string, unknown>,
                targetCourseId: params.targetCourseId,
                targetCourseSlug: params.targetCourseSlug,
                mode: params.mode,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            ),
          ]);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    dryRun: true,
                    validation: validation.data?.data,
                    diff: diff.data?.data,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        const response = await api.api["course-explorer"].admin[
          "course-graphs"
        ].upsert.post(
          {
            input: params.input as unknown as Record<string, unknown>,
            targetCourseId: params.targetCourseId,
            targetCourseSlug: params.targetCourseSlug,
            mode: params.mode,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to upsert graph",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: response.data.data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("upsert_course_graph error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to upsert course graph",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "export_course_graph",
    {
      title: "Export Course Graph",
      description:
        "Export an existing course into the canonical course graph payload shape.",
      inputSchema: z.object({
        courseId: z.string(),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = await ensureToolAccess(
          requestContext as any,
          "export_course_graph",
        );
        const response = await api.api["course-explorer"].admin
          .courses({ id: params.courseId })
          .graph.get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to export course graph",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: response.data.data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("export_course_graph error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Failed to export course graph",
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
