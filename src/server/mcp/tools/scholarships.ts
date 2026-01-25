import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation, formatDate, truncateText } from "../utils";

/**
 * Register all scholarship tools with MCP server
 *
 * @param server - MCP server instance
 */

export function registerScholarshipTools(server: McpServer): void {
  type ScholarshipQuery = NonNullable<
    Parameters<typeof api.api.scholarships.get>[0]
  >["query"];
  type ScholarshipResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.scholarships.get>>["data"]
  >;
  type Scholarship = ScholarshipResponse["data"][number];

  const scholarshipFilterSchema = z.object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe(
        "Maximum number of scholarships to return (1-100, default: 20)",
      ),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of scholarships to skip for pagination"),
    search: z
      .string()
      .optional()
      .describe("Search term to filter by scholarship name or description"),
    country: z
      .string()
      .optional()
      .describe("Filter by country code (e.g., 'US', 'UK', 'DE')"),
    degree: z.string().optional().describe("Filter by degree level ID"),
    field: z.string().optional().describe("Filter by field of study ID"),
    fundingType: z
      .enum(["fully_funded", "partial", "tuition_only"])
      .optional()
      .describe("Filter by funding type"),
    status: z
      .enum(["active", "inactive", "archived"])
      .optional()
      .describe("Filter by scholarship status"),
  });

  server.registerTool(
    "fetch_scholarships",
    {
      title: "Fetch Scholarships",
      description:
        "Retrieve scholarships from IOESU database with optional filtering (search, country, degree, funding, status).",
      inputSchema: scholarshipFilterSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const query: ScholarshipQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.country) query.country = params.country;
        if (params.field) query.field = params.field;
        if (params.degree) query.degree = params.degree;
        if (params.status) query.status = params.status;
        if (params.fundingType) query.fundingType = params.fundingType;

        const response = await api.api.scholarships.get({
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
              : "Failed to fetch scholarships via API",
          );
        }

        if (!response.data?.success) {
          throw new Error("API request failed");
        }

        const results = response.data.data || [];
        const metadata = response.data.metadata;

        const formattedResults = results.map((scholarship: Scholarship) => ({
          ...scholarship,
          createdAt: formatDate(scholarship.createdAt) || "",
          updatedAt: formatDate(scholarship.updatedAt) || "",
          description: truncateText(scholarship.description || "", 500),
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
                    field: params.field,
                    degree: params.degree,
                    fundingType: params.fundingType,
                    status: params.status,
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_scholarships error:", error);

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
                      : "Failed to fetch scholarships",
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

  const scholarshipCreateSchema = z.object({
    name: z.string().describe("Scholarship name"),
    slug: z.string().describe("URL-friendly identifier"),
    description: z.string().optional().describe("Markdown description"),
    providerName: z.string().optional().describe("Provider/organization name"),
    websiteUrl: z.url().optional().describe("Official website URL"),
    fundingType: z
      .enum(["fully_funded", "partial", "tuition_only"])
      .optional()
      .describe("Funding type"),
    isActive: z.boolean().default(true).describe("Active status"),
    status: z
      .enum(["active", "inactive", "archived"])
      .default("active")
      .describe("Scholarship status"),
    countryCodes: z
      .array(z.string().length(2))
      .optional()
      .describe("Associated country codes (e.g., ['US', 'UK'])"),
    degreeIds: z
      .array(z.string())
      .optional()
      .describe("Associated degree level IDs"),
    fieldIds: z
      .array(z.string())
      .optional()
      .describe("Associated field of study IDs"),
  });

  type ScholarshipCreateInput = NonNullable<
    Parameters<typeof api.api.scholarships.admin.post>[0]
  >;

  server.registerTool(
    "create_scholarship",
    {
      title: "Create Scholarship",
      description: "Create a new scholarship record with full metadata.",
      inputSchema: scholarshipCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const body: ScholarshipCreateInput = {
          name: params.name,
          slug: params.slug,
          description: params.description,
          providerName: params.providerName,
          websiteUrl: params.websiteUrl,
          fundingType: params.fundingType,
          isActive: params.isActive,
          status: params.status,
          countryCodes: params.countryCodes,
          degreeIds: params.degreeIds,
          fieldIds: params.fieldIds,
        };

        const response = await api.api.scholarships.admin.post(body, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to create scholarship via API",
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
        console.error("create_scholarship error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create scholarship",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const scholarshipBulkCreateSchema = z.object({
    scholarships: z.array(scholarshipCreateSchema),
  });

  server.registerTool(
    "bulk_create_scholarships",
    {
      title: "Bulk Create Scholarships",
      description: "Create multiple scholarships in a single batch operation.",
      inputSchema: scholarshipBulkCreateSchema,
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
          params.scholarships,
          async (scholarship) => {
            const body: ScholarshipCreateInput = {
              name: scholarship.name,
              slug: scholarship.slug,
              description: scholarship.description,
              providerName: scholarship.providerName,
              websiteUrl: scholarship.websiteUrl,
              fundingType: scholarship.fundingType,
              isActive: scholarship.isActive,
              status: scholarship.status,
              countryCodes: scholarship.countryCodes,
              degreeIds: scholarship.degreeIds,
              fieldIds: scholarship.fieldIds,
            };

            return await api.api.scholarships.admin.post(body, {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });
          },
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
        console.error("bulk_create_scholarships error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create scholarships",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const scholarshipUpdateSchema = scholarshipCreateSchema.extend({
    id: z.string().describe("Scholarship ID to update"),
  });

  server.registerTool(
    "update_scholarship",
    {
      title: "Update Scholarship",
      description: "Update an existing scholarship's details.",
      inputSchema: scholarshipUpdateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.scholarships
          .admin({ id: params.id })
          .patch(
            {
              name: params.name,
              slug: params.slug,
              description: params.description,
              providerName: params.providerName,
              websiteUrl: params.websiteUrl,
              fundingType: params.fundingType,
              isActive: params.isActive,
              status: params.status,
              countryCodes: params.countryCodes,
              degreeIds: params.degreeIds,
              fieldIds: params.fieldIds,
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
              "Failed to update scholarship via API",
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
        console.error("update_scholarship error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update scholarship",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_update_scholarships",
    {
      title: "Bulk Update Scholarships",
      description: "Update multiple scholarships in a single batch operation.",
      inputSchema: z.object({
        updates: z
          .array(scholarshipUpdateSchema)
          .describe("Array of scholarship update objects"),
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
            return await api.api.scholarships.admin({ id: update.id }).patch(
              {
                name: update.name,
                slug: update.slug,
                description: update.description,
                providerName: update.providerName,
                websiteUrl: update.websiteUrl,
                fundingType: update.fundingType,
                isActive: update.isActive,
                status: update.status,
                countryCodes: update.countryCodes,
                degreeIds: update.degreeIds,
                fieldIds: update.fieldIds,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            );
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
        console.error("bulk_update_scholarships error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk update scholarships",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_scholarship",
    {
      title: "Delete Scholarship",
      description: "Permanently delete a scholarship and its related data.",
      inputSchema: z.object({
        id: z.string().describe("Scholarship ID to delete"),
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

        const response = await api.api.scholarships
          .admin({ id: params.id })
          .delete(
            {},
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to delete scholarship via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Scholarship deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_scholarship error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete scholarship",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_scholarships",
    {
      title: "Bulk Delete Scholarships",
      description:
        "Permanently delete multiple scholarships in a single batch operation.",
      inputSchema: z.object({
        ids: z
          .array(z.string())
          .describe("Array of scholarship IDs to delete"),
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
            return await api.api.scholarships.admin({ id }).delete(
              {},
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            );
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
        console.error("bulk_delete_scholarships error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk delete scholarships",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_scholarship_by_id",
    {
      title: "Get Scholarship by ID",
      description:
        "Retrieve a single scholarship with full relations (rounds, events) by its ID or slug.",
      inputSchema: z.object({
        slug: z.string().describe("Scholarship slug"),
        includeRounds: z
          .boolean()
          .default(true)
          .describe("Include scholarship rounds"),
        includeEvents: z
          .boolean()
          .default(true)
          .describe("Include round events"),
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

        const response = await api.api.scholarships({ slug: params.slug }).get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message ||
              "Failed to fetch scholarship via API",
          );
        }

        const data = response.data.data;

        if (!params.includeRounds && data?.rounds) {
          data.rounds = [];
        }

        if (!params.includeEvents && data?.rounds) {
          data.rounds.forEach((round) => {
            round.events = [];
          });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: data,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("get_scholarship_by_id error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch scholarship",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "create_scholarship_round",
    {
      title: "Create Scholarship Round",
      description: `
        Add an application round to a scholarship.
        
        Use this tool to create a new application round including:
        - Round name and description
        - Application open date and deadline
        - Scholarship amount
        - Active status
      `.trim(),
      inputSchema: z.object({
        scholarshipId: z.string().describe("Parent scholarship ID"),
        roundName: z.string().optional().describe("Round identifier"),
        description: z.string().optional().describe("Round details"),
        openDate: z
          .string()
          .optional()
          .describe("Application open date (ISO string)"),
        deadlineDate: z
          .string()
          .optional()
          .describe("Application deadline (ISO string)"),
        scholarshipAmount: z.string().optional().describe("Award amount"),
        isActive: z.boolean().default(false).describe("Round active status"),
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

        const response = await api.api.scholarships.admin.rounds.post(
          {
            scholarshipId: params.scholarshipId,
            roundName: params.roundName,
            description: params.description,
            openDate: params.openDate,
            deadlineDate: params.deadlineDate,
            scholarshipAmount: params.scholarshipAmount,
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
            response.error?.value?.message || "Failed to create round via API",
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
        console.error("create_scholarship_round error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create round",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_scholarship_rounds",
    {
      title: "Bulk Create Scholarship Rounds",
      description: `
        Create multiple rounds for a scholarship efficiently.
        
        Use this tool to create multiple application rounds in a single operation.
        The tool handles iteration internally, reducing token usage for AI agents.
        
        Returns detailed results including success/failure for each round.
      `.trim(),
      inputSchema: z.object({
        scholarshipId: z.string().describe("Parent scholarship ID"),
        rounds: z
          .array(
            z.object({
              roundName: z.string().optional(),
              description: z.string().optional(),
              openDate: z.string().optional(),
              deadlineDate: z.string().optional(),
              scholarshipAmount: z.string().optional(),
              isActive: z.boolean().default(false),
            }),
          )
          .describe("Array of round objects to create"),
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

        const roundsWithScholarshipId = params.rounds.map((round) => ({
          ...round,
          scholarshipId: params.scholarshipId,
        }));

        const result = await bulkOperation(
          roundsWithScholarshipId,
          async (round) => {
            return await api.api.scholarships.admin.rounds.post(
              {
                scholarshipId: round.scholarshipId,
                roundName: round.roundName,
                description: round.description,
                openDate: round.openDate,
                deadlineDate: round.deadlineDate,
                scholarshipAmount: round.scholarshipAmount,
                isActive: round.isActive,
              },
              {
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              },
            );
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
        console.error("bulk_create_scholarship_rounds error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create rounds",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "update_scholarship_round",
    {
      title: "Update Scholarship Round",
      description: `
        Update an existing scholarship round's details.
        
        Use this tool to modify round information including:
        - Round name and description
        - Dates and amounts
        - Active status
      `.trim(),
      inputSchema: z.object({
        id: z.string().describe("Round ID to update"),
        roundName: z.string().optional().describe("Round identifier"),
        description: z.string().optional().describe("Round details"),
        openDate: z
          .string()
          .optional()
          .describe("Application open date (ISO string)"),
        deadlineDate: z
          .string()
          .optional()
          .describe("Application deadline (ISO string)"),
        scholarshipAmount: z.string().optional().describe("Award amount"),
        isActive: z.boolean().optional().describe("Round active status"),
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

        const response = await api.api.scholarships.admin
          .rounds({
            id: params.id,
          })
          .patch(
            {
              roundName: params.roundName,
              description: params.description,
              openDate: params.openDate,
              deadlineDate: params.deadlineDate,
              scholarshipAmount: params.scholarshipAmount,
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
            response.error?.value?.message || "Failed to update round via API",
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
        console.error("update_scholarship_round error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update round",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "create_round_event",
    {
      title: "Create Round Event",
      description: `
        Add an event to a scholarship round.
        
        Use this tool to create events like:
        - Webinars
        - Interviews
        - Result announcements
        - Deadlines
      `.trim(),
      inputSchema: z.object({
        roundId: z.string().describe("Parent round ID"),
        name: z.string().describe("Event name"),
        date: z.string().describe("Event date (ISO string)"),
        type: z
          .enum(["webinar", "interview", "result_announcement", "deadline"])
          .optional()
          .describe("Event type"),
        description: z.string().optional().describe("Event details"),
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

        const response = await api.api.scholarships.admin
          .rounds({ id: params.roundId })
          .events.post(
            {
              name: params.name,
              date: params.date,
              type: params.type,
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
            response.error?.value?.message || "Failed to create event via API",
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
        console.error("create_round_event error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create event",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_create_round_events",
    {
      title: "Bulk Create Round Events",
      description: `
        Create multiple events for a round efficiently.
        
        Use this tool to create multiple events in a single operation.
        The tool handles iteration internally, reducing token usage for AI agents.
        
        Returns detailed results including success/failure for each event.
      `.trim(),
      inputSchema: z.object({
        roundId: z.string().describe("Parent round ID"),
        events: z
          .array(
            z.object({
              name: z.string(),
              date: z.string(),
              type: z
                .enum([
                  "webinar",
                  "interview",
                  "result_announcement",
                  "deadline",
                ])
                .optional(),
              description: z.string().optional(),
            }),
          )
          .describe("Array of event objects to create"),
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

        const eventsWithRoundId = params.events.map((event) => ({
          ...event,
        }));

        const result = await bulkOperation(
          eventsWithRoundId,
          async (event) => {
            return await api.api.scholarships.admin
              .rounds({ id: params.roundId })
              .events.post(
                {
                  name: event.name,
                  date: event.date,
                  type: event.type,
                  description: event.description,
                },
                {
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                  },
                },
              );
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
        console.error("bulk_create_round_events error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk create events",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "update_round_event",
    {
      title: "Update Round Event",
      description: `
        Update an existing round event's details.
        
        Use this tool to modify event information including:
        - Event name and description
        - Date and type
      `.trim(),
      inputSchema: z.object({
        id: z.string().describe("Event ID to update"),
        name: z.string().optional().describe("Event name"),
        date: z.string().optional().describe("Event date (ISO string)"),
        type: z
          .enum(["webinar", "interview", "result_announcement", "deadline"])
          .optional()
          .describe("Event type"),
        description: z.string().optional().describe("Event details"),
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

        const response = await api.api.scholarships.admin.rounds
          .events({
            id: params.id,
          })
          .patch(
            {
              name: params.name,
              date: params.date,
              type: params.type,
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
            response.error?.value?.message || "Failed to update event via API",
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
        console.error("update_round_event error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update event",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_round_event",
    {
      title: "Delete Round Event",
      description: `
        Remove a round event.
        
        Use this tool to permanently delete an event from a scholarship round.
        Warning: This action cannot be undone.
      `.trim(),
      inputSchema: z.object({
        id: z.string().describe("Event ID to delete"),
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

        const response = await api.api.scholarships.admin.rounds
          .events({ id: params.id })
          .delete({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error(
            response.error?.value?.message || "Failed to delete event via API",
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Event deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_round_event error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete event",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
