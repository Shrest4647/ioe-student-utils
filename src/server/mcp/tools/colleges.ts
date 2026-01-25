import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation, extractErrorMessage, formatDate } from "../utils";

/**
 * Register all college tools with MCP server
 *
 * @param server - MCP server instance
 */
export function registerCollegeTools(server: McpServer): void {
  type CollegeQuery = NonNullable<
    Parameters<typeof api.api.colleges.get>[0]
  >["query"];
  type CollegeResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.colleges.get>>["data"]
  >;
  type College = CollegeResponse["data"][number];

  const collegeFilterSchema = z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of colleges to return (1-100, default: 20)"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of colleges to skip for pagination"),
    search: z
      .string()
      .optional()
      .describe("Search term to filter by college name"),
    universityId: z.string().optional().describe("Filter by university ID"),
  });

  server.registerTool(
    "fetch_colleges",
    {
      title: "Fetch Colleges",
      description:
        "Retrieve colleges from IOESU database with optional filtering.",
      inputSchema: collegeFilterSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const query: CollegeQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.universityId) query.universityId = params.universityId;

        const response = await api.api.colleges.get({
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
              : "Failed to fetch colleges via API",
          );
        }

        if (!response.data?.success) {
          throw new Error("API request failed");
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        const formattedResults = results.map((college: College) => ({
          ...college,
          createdAt: formatDate(college.createdAt) || "",
          updatedAt: formatDate(college.updatedAt) || "",
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
                    universityId: params.universityId,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_colleges error:", error);

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
                      : "Failed to fetch colleges",
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
    "get_college_by_slug",
    {
      title: "Get College by Slug",
      description: "Retrieve a single college with full relations by its slug.",
      inputSchema: z.object({
        slug: z.string().describe("College slug"),
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

        const response = await api.api.colleges
          .slug({ slug: params.slug })
          .get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to fetch college via API",
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
        console.error("get_college_by_slug error:", error);

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
                      : "Failed to fetch college",
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
    "fetch_college_departments",
    {
      title: "Fetch College Departments",
      description: "Retrieve departments for a specific college.",
      inputSchema: z.object({
        collegeId: z.string().describe("College ID"),
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
          .colleges({ id: params.collegeId })
          .departments.get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to fetch college departments via API",
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
        console.error("fetch_college_departments error:", error);

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
                      : "Failed to fetch college departments",
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
    "fetch_college_department_programs",
    {
      title: "Fetch College Department Programs",
      description: "Retrieve programs for a specific college department.",
      inputSchema: z.object({
        collegeId: z.string().describe("College ID"),
        departmentId: z.string().describe("Department ID"),
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
          .colleges({ id: params.collegeId })
          .departments({ departmentId: params.departmentId })
          .programs.get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to fetch college department programs via API",
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
        console.error("fetch_college_department_programs error:", error);

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
                      : "Failed to fetch college department programs",
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
    "fetch_college_program_courses",
    {
      title: "Fetch College Program Courses",
      description: "Retrieve courses for a specific college program.",
      inputSchema: z.object({
        collegeId: z.string().describe("College ID"),
        departmentId: z.string().describe("Department ID"),
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
          .colleges({ id: params.collegeId })
          .departments({ departmentId: params.departmentId })
          .programs({ programId: params.programId })
          .courses.get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to fetch college program courses via API",
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
        console.error("fetch_college_program_courses error:", error);

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
                      : "Failed to fetch college program courses",
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

  const collegeCreateSchema = z.object({
    universityId: z.string().describe("Parent university ID"),
    name: z.string().describe("College name"),
    description: z.string().optional().describe("College description"),
    websiteUrl: z.string().optional().describe("College website URL"),
    location: z.string().optional().describe("Location"),
    isActive: z.boolean().default(true).describe("Active status"),
  });

  type CollegeCreateInput = NonNullable<
    Parameters<typeof api.api.colleges.admin.post>[0]
  >;

  server.registerTool(
    "create_college",
    {
      title: "Create College",
      description: "Create a new college under a university.",
      inputSchema: collegeCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: CollegeCreateInput = {
          universityId: params.universityId,
          name: params.name,
          description: params.description,
          websiteUrl: params.websiteUrl,
          location: params.location,
          isActive: params.isActive,
        };

        const response = await api.api.colleges.admin.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to create college via API",
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
        console.error("create_college error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create college",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_colleges",
    {
      title: "Bulk Create Colleges",
      description: "Create multiple colleges in a single batch operation.",
      inputSchema: z.object({
        colleges: z.array(collegeCreateSchema),
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
          params.colleges,
          async (college) => {
            const body: CollegeCreateInput = {
              universityId: college.universityId,
              name: college.name,
              description: college.description,
              websiteUrl: college.websiteUrl,
              location: college.location,
              isActive: college.isActive,
            };

            const response = await api.api.colleges.admin.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to create college",
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
        console.error("bulk_create_colleges error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create colleges",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const collegeUpdateSchema = collegeCreateSchema.extend({
    id: z.string().describe("College ID to update"),
  });

  server.registerTool(
    "update_college",
    {
      title: "Update College",
      description: "Update an existing college's details.",
      inputSchema: collegeUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.colleges.admin({ id: params.id }).patch(
          {
            name: params.name,
            description: params.description,
            websiteUrl: params.websiteUrl,
            location: params.location,
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
              "Failed to update college via API",
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
        console.error("update_college error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update college",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_colleges",
    {
      title: "Bulk Update Colleges",
      description: "Update multiple colleges in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(collegeUpdateSchema)
          .describe("Array of college update objects"),
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
            const response = await api.api.colleges
              .admin({ id: update.id })
              .patch(
                {
                  name: update.name,
                  description: update.description,
                  websiteUrl: update.websiteUrl,
                  location: update.location,
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
                response.error?.value?.message || "Failed to update college",
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
        console.error("bulk_update_colleges error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update colleges",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_college",
    {
      title: "Delete College",
      description: "Deactivate (soft delete) a college.",
      inputSchema: z.object({
        id: z.string().describe("College ID to deactivate"),
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

        const response = await api.api.colleges.admin({ id: params.id }).patch(
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
              "Failed to deactivate college via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "College deactivated successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_college error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to deactivate college",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_colleges",
    {
      title: "Bulk Delete Colleges",
      description: "Deactivate multiple colleges in a single batch operation.",
      inputSchema: z.object({
        ids: z.array(z.string()).describe("Array of college IDs to deactivate"),
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
            const response = await api.api.colleges.admin({ id }).patch(
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
                  "Failed to deactivate college",
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
        console.error("bulk_delete_colleges error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk deactivate colleges",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
  server.registerTool(
    "sync_college_departments",
    {
      title: "Sync College Departments",
      description: "Update the list of departments for a college (add/remove).",
      inputSchema: z.object({
        collegeId: z.string().describe("College ID"),
        departmentIds: z.array(z.string()).describe("List of Department IDs"),
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

        const response = await api.api.colleges
          .admin({ id: params.collegeId })
          .departments.post(
            {
              departmentIds: params.departmentIds,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to sync college departments",
            ),
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
        console.error("sync_college_departments error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to sync college departments",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "sync_college_department_programs",
    {
      title: "Sync College Department Programs",
      description: "Update the list of programs for a college department.",
      inputSchema: z.object({
        collegeId: z.string().describe("College ID"),
        departmentId: z.string().describe("Department ID"),
        programIds: z.array(z.string()).describe("List of Program IDs"),
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

        const response = await api.api.colleges
          .admin({ id: params.collegeId })
          .departments({ departmentId: params.departmentId })
          .programs.post(
            {
              programIds: params.programIds,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to sync college department programs",
            ),
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
        console.error("sync_college_department_programs error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to sync college department programs",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "sync_college_program_courses",
    {
      title: "Sync College Program Courses",
      description: "Update the list of courses for a college program.",
      inputSchema: z.object({
        collegeId: z.string().describe("College ID"),
        departmentId: z.string().describe("Department ID"),
        programId: z.string().describe("Program ID"),
        courseIds: z.array(z.string()).describe("List of Course IDs"),
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

        const response = await api.api.colleges
          .admin({ id: params.collegeId })
          .departments({ departmentId: params.departmentId })
          .programs({ programId: params.programId })
          .courses.post(
            {
              courseIds: params.courseIds,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to sync college program courses",
            ),
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
        console.error("sync_college_program_courses error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to sync college program courses",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
