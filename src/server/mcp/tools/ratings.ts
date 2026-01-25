import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation, extractErrorMessage } from "../utils";

/**
 * Register all rating tools with MCP server
 *
 * @param server - MCP server instance
 */
export function registerRatingTools(server: McpServer): void {
  server.registerTool(
    "fetch_rating_categories",
    {
      title: "Fetch Rating Categories",
      description: "Retrieve all rating categories.",
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

        const response = await api.api.ratings.categories.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch rating categories via API",
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
        console.error("fetch_rating_categories error:", error);

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
                      : "Failed to fetch rating categories",
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
    "get_rating_category_by_id",
    {
      title: "Get Rating Category by ID",
      description: "Retrieve a single rating category by its ID.",
      inputSchema: z.object({
        id: z.string().describe("Rating category ID"),
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

        const response = await api.api.ratings
          .categories({ id: params.id })
          .get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch rating category via API",
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
        console.error("get_rating_category_by_id error:", error);

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
                      : "Failed to fetch rating category",
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

  const ratingCategoryCreateSchema = z.object({
    name: z.string().describe("Category name"),
    description: z.string().optional().describe("Category description"),
    sortOrder: z.string().optional().describe("Display order"),
    isActive: z.boolean().default(true).describe("Active status"),
  });

  type RatingCategoryCreateInput = NonNullable<
    Parameters<typeof api.api.ratings.admin.categories.post>[0]
  >;

  server.registerTool(
    "create_rating_category",
    {
      title: "Create Rating Category",
      description: "Create a new rating category.",
      inputSchema: ratingCategoryCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: RatingCategoryCreateInput = {
          name: params.name,
          description: params.description,
          sortOrder: params.sortOrder,
          isActive: params.isActive,
        };

        const response = await api.api.ratings.admin.categories.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to create rating category via API",
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
        console.error("create_rating_category error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create rating category",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_rating_categories",
    {
      title: "Bulk Create Rating Categories",
      description:
        "Create multiple rating categories in a single batch operation.",
      inputSchema: z.object({
        categories: z.array(ratingCategoryCreateSchema),
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
            const body: RatingCategoryCreateInput = {
              name: category.name,
              description: category.description,
              sortOrder: category.sortOrder,
              isActive: category.isActive,
            };

            const response = await api.api.ratings.admin.categories.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

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
        console.error("bulk_create_rating_categories error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create rating categories",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const ratingCategoryUpdateSchema = ratingCategoryCreateSchema.extend({
    id: z.string().describe("Category ID to update"),
  });

  server.registerTool(
    "update_rating_category",
    {
      title: "Update Rating Category",
      description: "Update an existing rating category's details.",
      inputSchema: ratingCategoryUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.ratings.admin
          .categories({ id: params.id })
          .patch(
            {
              name: params.name,
              description: params.description,
              sortOrder: params.sortOrder,
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
              "Failed to update rating category via API",
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
        console.error("update_rating_category error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update rating category",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_rating_category",
    {
      title: "Delete Rating Category",
      description: "Delete a rating category permanently.",
      inputSchema: z.object({
        id: z.string().describe("Category ID to delete"),
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

        const response = await api.api.ratings.admin
          .categories({ id: params.id })
          .delete({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to delete rating category via API",
            ),
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Rating category deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_rating_category error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete rating category",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const entityTypeEnum = z.enum([
    "university",
    "college",
    "department",
    "program",
    "course",
    "collegeDepartment",
    "collegeDepartmentProgram",
    "collegeDepartmentProgramCourse",
  ]);

  const ratingCreateSchema = z.object({
    entityType: entityTypeEnum.describe("Type of entity being rated"),
    entityId: z.string().describe("ID of the entity being rated"),
    categoryId: z.string().describe("Rating category ID"),
    rating: z.string().describe("Rating value (e.g., '4.5', '5')"),
    review: z.string().optional().describe("Review text"),
  });

  type RatingCreateInput = NonNullable<
    Parameters<typeof api.api.ratings.post>[0]
  >;

  server.registerTool(
    "submit_rating",
    {
      title: "Submit Rating",
      description: "Submit a rating for an entity (university, college, etc).",
      inputSchema: ratingCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: RatingCreateInput = {
          entityType: params.entityType,
          entityId: params.entityId,
          categoryId: params.categoryId,
          rating: params.rating,
          review: params.review,
        };

        const response = await api.api.ratings.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to submit rating via API",
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
        console.error("submit_rating error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to submit rating",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_submit_ratings",
    {
      title: "Bulk Submit Ratings",
      description: "Submit multiple ratings in a single batch operation.",
      inputSchema: z.object({
        ratings: z.array(ratingCreateSchema),
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
          params.ratings,
          async (rating) => {
            const body: RatingCreateInput = {
              entityType: rating.entityType,
              entityId: rating.entityId,
              categoryId: rating.categoryId,
              rating: rating.rating,
              review: rating.review,
            };

            const response = await api.api.ratings.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });

            if (response.error || !response.data?.success) {
              throw new Error(
                extractErrorMessage(
                  response.error?.value,
                  "Failed to submit rating",
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
        console.error("bulk_submit_ratings error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk submit ratings",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "fetch_entity_ratings",
    {
      title: "Fetch Entity Ratings",
      description: "Retrieve ratings for a specific entity.",
      inputSchema: z.object({
        entityType: z
          .enum(["university", "college", "program"])
          .describe("Entity type"),
        entityId: z.string().describe("Entity ID"),
        categoryId: z.string().optional().describe("Filter by category ID"),
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let response: any;

        if (params.entityType === "university") {
          response = await api.api
            .universities({ id: params.entityId })
            .ratings.get({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
              query: {
                categoryId: params.categoryId,
              },
            });
        } else if (params.entityType === "college") {
          response = await api.api
            .colleges({ id: params.entityId })
            .ratings.get({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
              query: {
                categoryId: params.categoryId,
              },
            });
        } else if (params.entityType === "program") {
          response = await api.api
            .programs({ id: params.entityId })
            .ratings.get({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
              query: {
                categoryId: params.categoryId,
              },
            });
        } else {
          throw new Error(`Unsupported entity type: ${params.entityType}`);
        }

        if (response.error || !response.data?.success) {
          throw new Error(
            extractErrorMessage(
              response.error?.value,
              "Failed to fetch ratings via API",
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
        console.error("fetch_entity_ratings error:", error);

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
                      : "Failed to fetch ratings",
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
