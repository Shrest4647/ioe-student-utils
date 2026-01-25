import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import {
  bulkOperation,
  extractErrorMessage,
  formatDate,
  truncateText,
} from "../utils";

/**
 * Register all resource tools with MCP server
 *
 * @param server - MCP server instance
 */
export function registerResourceTools(server: McpServer): void {
  type ResourceQuery = NonNullable<
    Parameters<typeof api.api.resources.get>[0]
  >["query"];
  type ResourceResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.resources.get>>["data"]
  >;
  type Resource = ResourceResponse["data"][number];

  const resourceFilterSchema = z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("Maximum number of resources to return (1-100, default: 20)"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of resources to skip for pagination"),
    search: z
      .string()
      .optional()
      .describe("Search term to filter by resource title or description"),
    category: z.string().optional().describe("Filter by category ID"),
    contentType: z.string().optional().describe("Filter by content type ID"),
  });

  server.registerTool(
    "fetch_resources",
    {
      title: "Fetch Resources",
      description:
        "Retrieve resources from IOESU database with optional filtering (search, category, content type).",
      inputSchema: resourceFilterSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const query: ResourceQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.category) query.category = params.category;
        if (params.contentType) query.contentType = params.contentType;

        const response = await api.api.resources.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          query,
        });

        if (response.error) {
          throw new Error(
            extractErrorMessage(
              response.error.value,
              "Failed to fetch resources via API",
            ),
          );
        }

        if (!response.data?.success) {
          throw new Error("API request failed");
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        const formattedResults = results.map((resource: Resource) => ({
          ...resource,
          createdAt: formatDate(resource.createdAt) || "",
          updatedAt: formatDate(resource.updatedAt) || "",
          description: truncateText(resource.description || "", 500),
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
                    category: params.category,
                    contentType: params.contentType,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_resources error:", error);

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
                      : "Failed to fetch resources",
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
    "get_resource_by_id",
    {
      title: "Get Resource by ID",
      description:
        "Retrieve a single resource with full details and attachments by its ID.",
      inputSchema: z.object({
        id: z.string().describe("Resource ID"),
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

        const response = await api.api.resources({ id: params.id }).get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch resource via API",
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
        console.error("get_resource_by_id error:", error);

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
                      : "Failed to fetch resource",
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
    "fetch_resource_categories",
    {
      title: "Fetch Resource Categories",
      description: "Retrieve all available resource categories.",
      inputSchema: z.object({}),
    },
    async (_params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.resources.categories.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch resource categories via API",
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
        console.error("fetch_resource_categories error:", error);

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
                      : "Failed to fetch resource categories",
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
    "fetch_content_types",
    {
      title: "Fetch Content Types",
      description: "Retrieve all resource content types.",
      inputSchema: z.object({}),
    },
    async (_params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.resources["content-types"].get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch content types via API",
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
        console.error("fetch_content_types error:", error);

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
                      : "Failed to fetch content types",
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

  const attachmentSchema = z.object({
    name: z.string().describe("Attachment name"),
    type: z.enum(["file", "url"]).describe("Attachment type"),
    url: z.string().describe("File S3 URL or external URL"),
  });

  const resourceCreateSchema = z.object({
    title: z.string().describe("Resource title"),
    description: z.string().optional().describe("Resource description"),
    contentTypeId: z.string().describe("Content type ID"),
    categoryIds: z
      .array(z.string())
      .optional()
      .describe("Array of category IDs"),
    attachments: z
      .array(attachmentSchema)
      .optional()
      .describe("Array of attachments (file or URL)"),
  });

  type ResourceCreateInput = NonNullable<
    Parameters<typeof api.api.resources.post>[0]
  >;

  server.registerTool(
    "create_resource",
    {
      title: "Create Resource",
      description: "Create a new resource with attachments.",
      inputSchema: resourceCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: ResourceCreateInput = {
          title: params.title,
          description: params.description,
          contentTypeId: params.contentTypeId,
          categoryIds: params.categoryIds,
          attachments: params.attachments,
        };

        const response = await api.api.resources.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to create resource via API",
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
        console.error("create_resource error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create resource",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_resources",
    {
      title: "Bulk Create Resources",
      description: "Create multiple resources in a single batch operation.",
      inputSchema: z.object({
        resources: z.array(resourceCreateSchema),
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
          params.resources,
          async (resource) => {
            const body: ResourceCreateInput = {
              title: resource.title,
              description: resource.description,
              contentTypeId: resource.contentTypeId,
              categoryIds: resource.categoryIds,
              attachments: resource.attachments,
            };

            const response = await api.api.resources.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                extractErrorMessage(
                  response.error?.value,
                  "Failed to create resource",
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
        console.error("bulk_create_resources error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create resources",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Note: Resources API uses PUT for updates, not PATCH
  const resourceUpdateSchema = z.object({
    id: z.string().describe("Resource ID to update"),
    title: z.string().optional().describe("Resource title"),
    description: z.string().optional().describe("Resource description"),
    contentTypeId: z.string().optional().describe("Content type ID"),
    categoryIds: z
      .array(z.string())
      .optional()
      .describe("Array of category IDs"),
    isFeatured: z.boolean().optional().describe("Mark as featured"),
  });

  server.registerTool(
    "update_resource",
    {
      title: "Update Resource",
      description:
        "Update an existing resource's details (attachments managed separately).",
      inputSchema: resourceUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.resources({ id: params.id }).put(
          {
            title: params.title,
            description: params.description,
            contentTypeId: params.contentTypeId,
            categoryIds: params.categoryIds,
            isFeatured: params.isFeatured,
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
              "Failed to update resource via API",
            ),
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: response.data.message || "Resource updated",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("update_resource error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update resource",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_resources",
    {
      title: "Bulk Update Resources",
      description: "Update multiple resources in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(resourceUpdateSchema)
          .describe("Array of resource update objects"),
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
            const response = await api.api.resources({ id: update.id }).put(
              {
                title: update.title,
                description: update.description,
                contentTypeId: update.contentTypeId,
                categoryIds: update.categoryIds,
                isFeatured: update.isFeatured,
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
                  "Failed to update resource",
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
        console.error("bulk_update_resources error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update resources",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_resource",
    {
      title: "Delete Resource",
      description: "Permanently delete a resource.",
      inputSchema: z.object({
        id: z.string().describe("Resource ID to delete"),
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

        const response = await api.api.resources({ id: params.id }).delete({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to delete resource via API",
            ),
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Resource deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_resource error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete resource",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_resources",
    {
      title: "Bulk Delete Resources",
      description:
        "Permanently delete multiple resources in a single batch operation.",
      inputSchema: z.object({
        ids: z.array(z.string()).describe("Array of resource IDs to delete"),
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
            const response = await api.api.resources({ id }).delete({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                extractErrorMessage(
                  response.error?.value,
                  "Failed to delete resource",
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
        console.error("bulk_delete_resources error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk delete resources",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const categoryCreateSchema = z.object({
    name: z.string().describe("Category name"),
    description: z.string().optional().describe("Category description"),
  });

  server.registerTool(
    "create_resource_category",
    {
      title: "Create Resource Category",
      description: "Create a new resource category.",
      inputSchema: categoryCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.resources.categories.post(
          {
            name: params.name,
            description: params.description,
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
              "Failed to create category via API",
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
        console.error("create_resource_category error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create category",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_resource_categories",
    {
      title: "Bulk Create Resource Categories",
      description:
        "Create multiple resource categories in a single batch operation.",
      inputSchema: z.object({
        categories: z.array(categoryCreateSchema),
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
          params.categories,
          async (category) => {
            const response = await api.api.resources.categories.post(
              {
                name: category.name,
                description: category.description,
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
                  "Failed to create category",
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
        console.error("bulk_create_resource_categories error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create categories",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const contentTypeCreateSchema = z.object({
    name: z.string().describe("Content type name"),
    description: z.string().optional().describe("Content type description"),
  });

  server.registerTool(
    "create_content_type",
    {
      title: "Create Content Type",
      description: "Create a new resource content type.",
      inputSchema: contentTypeCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.resources["content-types"].post(
          {
            name: params.name,
            description: params.description,
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
              "Failed to create content type via API",
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
        console.error("create_content_type error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create content type",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_content_types",
    {
      title: "Bulk Create Content Types",
      description: "Create multiple content types in a single batch operation.",
      inputSchema: z.object({
        contentTypes: z.array(contentTypeCreateSchema),
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
          params.contentTypes,
          async (contentType) => {
            const response = await api.api.resources["content-types"].post(
              {
                name: contentType.name,
                description: contentType.description,
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
                  "Failed to create content type",
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
        console.error("bulk_create_content_types error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create content types",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
