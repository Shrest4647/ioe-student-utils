import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { appEnv } from "@/env";
import { api } from "@/server/elysia/eden";
import { formatDate, truncateText } from "../utils";

/**
 * Scholarship Tools Module
 *
 * MCP tools for managing scholarship data.
 *
 * Standards:
 * - All tools use Zod for input validation
 * - Return consistent response format
 * - Include detailed error messages
 * - Use database queries with proper joins
 * - Respect user permissions
 *
 * @module mcp/tools/scholarships
 */

export type ScholarshipQuery = NonNullable<
  Parameters<typeof api.api.scholarships.get>[0]
>["query"];
export type ScholarshipResponse = NonNullable<
  Awaited<ReturnType<typeof api.api.scholarships.get>>["data"]
>;
export type Scholarship = ScholarshipResponse["data"][number];

/**
 * Register all scholarship tools with MCP server
 *
 * @param server - MCP server instance
 */
export function registerScholarshipTools(server: McpServer): void {
  /**
   * Tool: fetch_scholarships
   *
   * Retrieve scholarships with optional filtering.
   * Returns paginated results with scholarship details.
   *
   * Permissions Required:
   * - scholarships: read (default for most users)
   *
   * Examples:
   * - Get all active scholarships: fetch_scholarships({})
   * - Get scholarships for specific country: fetch_scholarships({ countryCodes: ["US", "UK"] })
   * - Search by name: fetch_scholarships({ search: "DAAD" })
   * - Get fully funded PhDs: fetch_scholarships({ fundingType: "fully_funded" })
   */
  server.registerTool(
    "fetch_scholarships",
    {
      title: "Fetch Scholarships",
      description: `
        Retrieve scholarships from IOESU database with optional filtering.
        
        Use this tool to:
        - Search for scholarships by name or description
        - Filter by country, field of study, or degree level
        - Filter by funding type or status
        - Get paginated results with limit and offset
        
        Returns scholarships with details including:
        - Basic information (name, provider, funding type)
        - Description and website URL
        - Creation and update timestamps
      `.trim(),
      inputSchema: z.object({
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
        countryCodes: z
          .array(z.string().length(2))
          .optional()
          .describe("Filter by country codes (e.g., ['US', 'UK', 'DE'])"),
        fieldIds: z
          .array(z.string())
          .optional()
          .describe("Filter by field of study IDs"),
        degreeIds: z
          .array(z.string())
          .optional()
          .describe("Filter by degree level IDs"),
        fundingType: z
          .enum(["fully_funded", "partial", "tuition_only"])
          .optional()
          .describe("Filter by funding type"),
        status: z
          .enum(["active", "inactive", "archived"])
          .optional()
          .describe("Filter by scholarship status"),
      }),
    },
    async (params, _requestContext) => {
      try {
        // Prepare API request
        const query: ScholarshipQuery = {
          limit: params.limit.toString(),
          page: (Math.floor(params.offset / params.limit) + 1).toString(),
        };

        if (params.search) query.search = params.search;
        if (params.countryCodes?.[0]) query.country = params.countryCodes[0];
        if (params.fieldIds?.[0]) query.field = params.fieldIds[0];
        if (params.degreeIds?.[0]) query.degree = params.degreeIds[0];
        if (params.status) query.status = params.status;
        if (params.fundingType) query.fundingType = params.fundingType;

        const apiKey = appEnv.MCP_API_KEY;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        // Execute API request
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
        const metadata = (response.data as any).metadata;

        // Format results
        const formattedResults = results.map((scholarship: Scholarship) => ({
          ...scholarship,
          createdAt: formatDate(scholarship.createdAt) || "",
          updatedAt: formatDate(scholarship.updatedAt) || "",
          description: truncateText(scholarship.description || "", 500),
        }));

        // Return formatted response
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
                    countryCodes: params.countryCodes,
                    fieldIds: params.fieldIds,
                    degreeIds: params.degreeIds,
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
        // Log error for debugging
        console.error("fetch_scholarships error:", error);

        // Return user-friendly error message
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
}
