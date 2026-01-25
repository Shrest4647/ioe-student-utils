import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation, extractErrorMessage, formatDate } from "../utils";

/**
 * Register all department tools with MCP server
 *
 * @param server - MCP server instance
 */
export function registerDepartmentTools(server: McpServer): void {
  type DepartmentQuery = NonNullable<
    Parameters<typeof api.api.departments.get>[0]
  >["query"];
  type DepartmentResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.departments.get>>["data"]
  >;
  type Department = DepartmentResponse["data"][number];

  const departmentFilterSchema = z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of departments to return (1-100, default: 20)"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of departments to skip for pagination"),
    search: z
      .string()
      .optional()
      .describe("Search term to filter by department name"),
    collegeId: z.string().optional().describe("Filter by college ID"),
  });

  server.registerTool(
    "fetch_departments",
    {
      title: "Fetch Departments",
      description:
        "Retrieve departments from IOESU database with optional filtering.",
      inputSchema: departmentFilterSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const query: DepartmentQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.collegeId) query.collegeId = params.collegeId;

        const response = await api.api.departments.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          query,
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch departments via API",
            ),
          );
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        const formattedResults = results.map((department: Department) => ({
          ...department,
          createdAt: formatDate(department.createdAt) || "",
          updatedAt: formatDate(department.updatedAt) || "",
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
                    collegeId: params.collegeId,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_departments error:", error);

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
                      : "Failed to fetch departments",
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
    "get_department_by_slug",
    {
      title: "Get Department by Slug",
      description: "Retrieve a single department with details by its slug.",
      inputSchema: z.object({
        slug: z.string().describe("Department slug"),
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

        const response = await api.api.departments
          .slug({ slug: params.slug })
          .get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch department via API",
            ),
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
        console.error("get_department_by_slug error:", error);

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
                      : "Failed to fetch department",
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

  const departmentCreateSchema = z.object({
    name: z.string().describe("Department name"),
    description: z.string().optional().describe("Department description"),
    websiteUrl: z.string().optional().describe("Department website URL"),
    isActive: z.boolean().default(true).describe("Active status"),
  });

  type DepartmentCreateInput = NonNullable<
    Parameters<typeof api.api.departments.admin.post>[0]
  >;

  server.registerTool(
    "create_department",
    {
      title: "Create Department",
      description: "Create a new master department.",
      inputSchema: departmentCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: DepartmentCreateInput = {
          name: params.name,
          description: params.description,
          websiteUrl: params.websiteUrl,
          isActive: params.isActive,
        };

        const response = await api.api.departments.admin.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to create department via API",
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
        console.error("create_department error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create department",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_departments",
    {
      title: "Bulk Create Departments",
      description: "Create multiple departments in a single batch operation.",
      inputSchema: z.object({
        departments: z.array(departmentCreateSchema),
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
          params.departments,
          async (department) => {
            const body: DepartmentCreateInput = {
              name: department.name,
              description: department.description,
              websiteUrl: department.websiteUrl,
              isActive: department.isActive,
            };

            const response = await api.api.departments.admin.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                extractErrorMessage(
                  response.error?.value,
                  "Failed to create department",
                ),
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
        console.error("bulk_create_departments error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create departments",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const departmentUpdateSchema = departmentCreateSchema.extend({
    id: z.string().describe("Department ID to update"),
  });

  server.registerTool(
    "update_department",
    {
      title: "Update Department",
      description: "Update an existing department's details.",
      inputSchema: departmentUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.departments
          .admin({ id: params.id })
          .patch(
            {
              name: params.name,
              description: params.description,
              websiteUrl: params.websiteUrl,
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
            extractErrorMessage(
              response.error?.value,
              "Failed to update department via API",
            ),
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
        console.error("update_department error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update department",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_departments",
    {
      title: "Bulk Update Departments",
      description: "Update multiple departments in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(departmentUpdateSchema)
          .describe("Array of department update objects"),
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
            const response = await api.api.departments
              .admin({ id: update.id })
              .patch(
                {
                  name: update.name,
                  description: update.description,
                  websiteUrl: update.websiteUrl,
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
                extractErrorMessage(
                  response.error?.value,
                  "Failed to update department",
                ),
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
        console.error("bulk_update_departments error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update departments",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
