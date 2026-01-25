import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation, formatDate, truncateText } from "../utils";

/**
 * Register all academic tools (programs and courses) with MCP server
 *
 * @param server - MCP server instance
 */
export function registerAcademicTools(server: McpServer): void {
  type ProgramQuery = NonNullable<
    Parameters<typeof api.api.programs.get>[0]
  >["query"];
  type ProgramResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.programs.get>>["data"]
  >;
  type Program = ProgramResponse["data"][number];

  const degreeLevelEnum = z.enum([
    "certificate",
    "diploma",
    "associate",
    "undergraduate",
    "postgraduate",
    "doctoral",
    "postdoctoral",
  ]);

  const programFilterSchema = z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of programs to return (1-100, default: 20)"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of programs to skip for pagination"),
    search: z
      .string()
      .optional()
      .describe("Search term to filter by program name"),
    degreeLevel: degreeLevelEnum.optional().describe("Filter by degree level"),
    collegeId: z.string().optional().describe("Filter by college ID"),
    departmentId: z.string().optional().describe("Filter by department ID"),
  });

  server.registerTool(
    "fetch_programs",
    {
      title: "Fetch Programs",
      description:
        "Retrieve academic programs from IOESU database with optional filtering.",
      inputSchema: programFilterSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const query: ProgramQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.degreeLevel) query.degreeLevel = params.degreeLevel;
        if (params.collegeId) query.collegeId = params.collegeId;
        if (params.departmentId) query.departmentId = params.departmentId;

        const response = await api.api.programs.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          query,
        });

        if (response.error) {
          console.error(response.error);
          throw new Error(
            response.error.value &&
              typeof response.error.value === "object" &&
              "message" in response.error.value
              ? (response.error.value.message as string)
              : "Failed to fetch programs via API",
          );
        }

        if (!response.data?.success) {
          throw new Error("API request failed");
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        const formattedResults = results.map((program: Program) => ({
          ...program,
          createdAt: formatDate(program.createdAt) || "",
          updatedAt: formatDate(program.updatedAt) || "",
          description: truncateText(program.description || "", 500),
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: formattedResults,
                  pagination: {
                    limit: params.limit,
                    offset: params.offset,
                    totalCount: metadata?.totalCount,
                    totalPages: metadata?.totalPages,
                    hasMore: metadata?.hasMore,
                  },
                  filters: {
                    search: params.search,
                    degreeLevel: params.degreeLevel,
                    collegeId: params.collegeId,
                    departmentId: params.departmentId,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_programs error:", error);

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
                      : "Failed to fetch programs",
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
    "get_program_by_code",
    {
      title: "Get Program by Code",
      description: "Retrieve a single program with full relations by its code.",
      inputSchema: z.object({
        code: z.string().describe("Program code"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.programs
          .code({ code: params.code })
          .get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to fetch program via API",
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
        console.error("get_program_by_code error:", error);

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
                      : "Failed to fetch program",
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

  const programCreateSchema = z.object({
    name: z.string().describe("Program name"),
    code: z
      .string()
      .optional()
      .describe("Program code (auto-generated if not provided)"),
    description: z.string().optional().describe("Program description"),
    credits: z.string().optional().describe("Total credit hours"),
    degreeLevels: degreeLevelEnum.optional().describe("Degree level"),
    isActive: z.boolean().default(true).describe("Active status"),
  });

  type ProgramCreateInput = NonNullable<
    Parameters<typeof api.api.programs.admin.post>[0]
  >;

  server.registerTool(
    "create_program",
    {
      title: "Create Program",
      description: "Create a new academic program.",
      inputSchema: programCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: ProgramCreateInput = {
          name: params.name,
          code: params.code,
          description: params.description,
          credits: params.credits,
          degreeLevels: params.degreeLevels,
          isActive: params.isActive,
        };

        const response = await api.api.programs.admin.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to create program via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: response.data.data,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("create_program error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create program",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_programs",
    {
      title: "Bulk Create Programs",
      description: "Create multiple programs in a single batch operation.",
      inputSchema: z.object({
        programs: z.array(programCreateSchema),
        onError: z
          .enum(["continue", "abort"])
          .default("continue")
          .describe("Behavior on error: 'continue' or 'abort'"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const result = await bulkOperation(
          params.programs,
          async (program) => {
            const body: ProgramCreateInput = {
              name: program.name,
              code: program.code,
              description: program.description,
              credits: program.credits,
              degreeLevels: program.degreeLevels,
              isActive: program.isActive,
            };

            const response = await api.api.programs.admin.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to create program",
              );
            }

            return response.data;
          },
          params.onError,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_create_programs error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create programs",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const programUpdateSchema = programCreateSchema.extend({
    id: z.string().describe("Program ID to update"),
  });

  server.registerTool(
    "update_program",
    {
      title: "Update Program",
      description: "Update an existing program's details.",
      inputSchema: programUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.programs.admin({ id: params.id }).patch(
          {
            name: params.name,
            code: params.code,
            description: params.description,
            credits: params.credits,
            degreeLevels: params.degreeLevels,
            isActive: params.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to update program via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: response.data,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("update_program error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update program",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_programs",
    {
      title: "Bulk Update Programs",
      description: "Update multiple programs in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(programUpdateSchema)
          .describe("Array of program update objects"),
        onError: z
          .enum(["continue", "abort"])
          .default("continue")
          .describe("Behavior on error: 'continue' or 'abort'"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const result = await bulkOperation(
          params.updates,
          async (update) => {
            const response = await api.api.programs
              .admin({ id: update.id })
              .patch(
                {
                  name: update.name,
                  code: update.code,
                  description: update.description,
                  credits: update.credits,
                  degreeLevels: update.degreeLevels,
                  isActive: update.isActive,
                },
                {
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                  },
                },
              );

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to update program",
              );
            }

            return response.data;
          },
          params.onError,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_update_programs error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update programs",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_program",
    {
      title: "Delete Program",
      description: "Deactivate (soft delete) a program.",
      inputSchema: z.object({
        id: z.string().describe("Program ID to deactivate"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.programs.admin({ id: params.id }).patch(
          {
            isActive: false,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to deactivate program via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Program deactivated successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_program error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to deactivate program",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_programs",
    {
      title: "Bulk Delete Programs",
      description: "Deactivate multiple programs in a single batch operation.",
      inputSchema: z.object({
        ids: z.array(z.string()).describe("Array of program IDs to deactivate"),
        onError: z
          .enum(["continue", "abort"])
          .default("continue")
          .describe("Behavior on error: 'continue' or 'abort'"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const result = await bulkOperation(
          params.ids,
          async (id) => {
            const response = await api.api.programs.admin({ id }).patch(
              {
                isActive: false,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            );

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message ||
                  "Failed to deactivate program",
              );
            }

            return response.data;
          },
          params.onError,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_delete_programs error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk deactivate programs",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "fetch_program_courses",
    {
      title: "Fetch Program Courses",
      description: "Retrieve courses for a specific program.",
      inputSchema: z.object({
        programId: z.string().describe("Program ID"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api
          .programs({ id: params.programId })
          .courses.get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to fetch program courses via API",
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
        console.error("fetch_program_courses error:", error);

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
                      : "Failed to fetch program courses",
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

  // Course tools
  const courseCreateSchema = z.object({
    name: z.string().describe("Course name"),
    code: z
      .string()
      .optional()
      .describe("Course code (auto-generated if not provided)"),
    description: z.string().optional().describe("Course description"),
    credits: z.string().optional().describe("Credit hours"),
    isActive: z.boolean().default(true).describe("Active status"),
  });

  type CourseCreateInput = NonNullable<
    Parameters<typeof api.api.courses.admin.post>[0]
  >;

  server.registerTool(
    "create_course",
    {
      title: "Create Course",
      description: "Create a new academic course.",
      inputSchema: courseCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: CourseCreateInput = {
          name: params.name,
          code: params.code,
          description: params.description,
          credits: params.credits,
          isActive: params.isActive,
        };

        const response = await api.api.courses.admin.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to create course via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: response.data.data,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("create_course error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create course",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_courses",
    {
      title: "Bulk Create Courses",
      description: "Create multiple courses in a single batch operation.",
      inputSchema: z.object({
        courses: z.array(courseCreateSchema),
        onError: z
          .enum(["continue", "abort"])
          .default("continue")
          .describe("Behavior on error: 'continue' or 'abort'"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const result = await bulkOperation(
          params.courses,
          async (course) => {
            const body: CourseCreateInput = {
              name: course.name,
              code: course.code,
              description: course.description,
              credits: course.credits,
              isActive: course.isActive,
            };

            const response = await api.api.courses.admin.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to create course",
              );
            }

            return response.data;
          },
          params.onError,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_create_courses error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create courses",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const courseUpdateSchema = courseCreateSchema.extend({
    id: z.string().describe("Course ID to update"),
  });

  server.registerTool(
    "update_course",
    {
      title: "Update Course",
      description: "Update an existing course's details.",
      inputSchema: courseUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.courses.admin({ id: params.id }).patch(
          {
            name: params.name,
            code: params.code,
            description: params.description,
            credits: params.credits,
            isActive: params.isActive,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to update course via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: response.data,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("update_course error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update course",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_courses",
    {
      title: "Bulk Update Courses",
      description: "Update multiple courses in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(courseUpdateSchema)
          .describe("Array of course update objects"),
        onError: z
          .enum(["continue", "abort"])
          .default("continue")
          .describe("Behavior on error: 'continue' or 'abort'"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const result = await bulkOperation(
          params.updates,
          async (update) => {
            const response = await api.api.courses
              .admin({ id: update.id })
              .patch(
                {
                  name: update.name,
                  code: update.code,
                  description: update.description,
                  credits: update.credits,
                  isActive: update.isActive,
                },
                {
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                  },
                },
              );

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to update course",
              );
            }

            return response.data;
          },
          params.onError,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_update_courses error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update courses",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_course",
    {
      title: "Delete Course",
      description: "Deactivate (soft delete) a course.",
      inputSchema: z.object({
        id: z.string().describe("Course ID to deactivate"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.courses.admin({ id: params.id }).patch(
          {
            isActive: false,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to deactivate course via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Course deactivated successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_course error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to deactivate course",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_courses",
    {
      title: "Bulk Delete Courses",
      description: "Deactivate multiple courses in a single batch operation.",
      inputSchema: z.object({
        ids: z.array(z.string()).describe("Array of course IDs to deactivate"),
        onError: z
          .enum(["continue", "abort"])
          .default("continue")
          .describe("Behavior on error: 'continue' or 'abort'"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const result = await bulkOperation(
          params.ids,
          async (id) => {
            const response = await api.api.courses.admin({ id }).patch(
              {
                isActive: false,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            );

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to deactivate course",
              );
            }

            return response.data;
          },
          params.onError,
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("bulk_delete_courses error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk deactivate courses",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
