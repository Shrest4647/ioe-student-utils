import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation, extractErrorMessage, formatDate } from "../utils";

/**
 * Register all university tools with MCP server
 *
 * @param server - MCP server instance
 */
export function registerUniversityTools(server: McpServer): void {
  type UniversityQuery = NonNullable<
    Parameters<typeof api.api.universities.get>[0]
  >["query"];
  type UniversityResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.universities.get>>["data"]
  >;
  type University = UniversityResponse["data"][number];

  const universityFilterSchema = z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe(
        "Maximum number of universities to return (1-100, default: 20)",
      ),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of universities to skip for pagination"),
    search: z
      .string()
      .optional()
      .describe("Search term to filter by university name"),
    country: z
      .string()
      .optional()
      .describe("Filter by country code (e.g., 'US', 'UK', 'NP')"),
  });

  server.registerTool(
    "fetch_universities",
    {
      title: "Fetch Universities",
      description:
        "Retrieve universities from IOESU database with optional filtering.",
      inputSchema: universityFilterSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const query: UniversityQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.country) query.country = params.country;

        const response = await api.api.universities.get({
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
              : "Failed to fetch universities via API",
          );
        }

        if (!response.data?.success) {
          throw new Error("API request failed");
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        const formattedResults = results.map((university: University) => ({
          ...university,
          createdAt: formatDate(university.createdAt) || "",
          updatedAt: formatDate(university.updatedAt) || "",
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
                    country: params.country,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_universities error:", error);

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
                      : "Failed to fetch universities",
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
    "get_university_by_slug",
    {
      title: "Get University by Slug",
      description:
        "Retrieve a single university with full relations by its slug.",
      inputSchema: z.object({
        slug: z.string().describe("University slug"),
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

        const response = await api.api.universities
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
              "Failed to fetch university via API",
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
        console.error("get_university_by_slug error:", error);

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
                      : "Failed to fetch university",
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

  const universityCreateSchema = z.object({
    name: z.string().describe("University name"),
    description: z.string().optional().describe("University description"),
    websiteUrl: z.string().optional().describe("Official website URL"),
    logoUrl: z.string().optional().describe("Logo S3 URL"),
    establishedYear: z.string().optional().describe("Founding year"),
    location: z.string().optional().describe("City/region"),
    country: z.string().optional().describe("Country name"),
    isActive: z.boolean().default(true).describe("Active status"),
  });

  type UniversityCreateInput = NonNullable<
    Parameters<typeof api.api.universities.admin.post>[0]
  >;

  server.registerTool(
    "create_university",
    {
      title: "Create University",
      description: "Create a new university with full metadata.",
      inputSchema: universityCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: UniversityCreateInput = {
          name: params.name,
          description: params.description,
          websiteUrl: params.websiteUrl,
          logoUrl: params.logoUrl,
          establishedYear: params.establishedYear,
          location: params.location,
          country: params.country,
          isActive: params.isActive,
        };

        const response = await api.api.universities.admin.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to create university via API",
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
        console.error("create_university error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create university",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_universities",
    {
      title: "Bulk Create Universities",
      description: "Create multiple universities in a single batch operation.",
      inputSchema: z.object({
        universities: z.array(universityCreateSchema),
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
          params.universities,
          async (university) => {
            const body: UniversityCreateInput = {
              name: university.name,
              description: university.description,
              websiteUrl: university.websiteUrl,
              logoUrl: university.logoUrl,
              establishedYear: university.establishedYear,
              location: university.location,
              country: university.country,
              isActive: university.isActive,
            };

            const response = await api.api.universities.admin.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message || "Failed to create university",
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
        console.error("bulk_create_universities error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create universities",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const universityUpdateSchema = universityCreateSchema.extend({
    id: z.string().describe("University ID to update"),
  });

  server.registerTool(
    "update_university",
    {
      title: "Update University",
      description: "Update an existing university's details.",
      inputSchema: universityUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.universities
          .admin({ id: params.id })
          .patch(
            {
              name: params.name,
              description: params.description,
              websiteUrl: params.websiteUrl,
              logoUrl: params.logoUrl,
              establishedYear: params.establishedYear,
              location: params.location,
              country: params.country,
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
              "Failed to update university via API",
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
        console.error("update_university error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update university",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_universities",
    {
      title: "Bulk Update Universities",
      description: "Update multiple universities in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(universityUpdateSchema)
          .describe("Array of university update objects"),
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
            const response = await api.api.universities
              .admin({ id: update.id })
              .patch(
                {
                  name: update.name,
                  description: update.description,
                  websiteUrl: update.websiteUrl,
                  logoUrl: update.logoUrl,
                  establishedYear: update.establishedYear,
                  location: update.location,
                  country: update.country,
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
                response.error?.value?.message || "Failed to update university",
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
        console.error("bulk_update_universities error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update universities",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_university",
    {
      title: "Delete University",
      description: "Deactivate (soft delete) a university.",
      inputSchema: z.object({
        id: z.string().describe("University ID to deactivate"),
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

        const response = await api.api.universities
          .admin({ id: params.id })
          .patch(
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
              "Failed to deactivate university via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "University deactivated successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_university error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to deactivate university",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_universities",
    {
      title: "Bulk Delete Universities",
      description:
        "Deactivate multiple universities in a single batch operation.",
      inputSchema: z.object({
        ids: z
          .array(z.string())
          .describe("Array of university IDs to deactivate"),
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
            const response = await api.api.universities.admin({ id }).patch(
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
                  "Failed to deactivate university",
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
        console.error("bulk_delete_universities error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk deactivate universities",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
