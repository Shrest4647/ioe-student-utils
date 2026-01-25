import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";

export function registerCountryTools(server: McpServer): void {
  server.registerTool(
    "fetch_countries",
    {
      title: "Fetch Countries",
      description: "Retrieve all countries from the database.",
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

        const response = await api.api.scholarships.countries.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to fetch countries via API");
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
        console.error("fetch_countries error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch countries",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const countryCreateSchema = z.object({
    code: z
      .string()
      .length(2)
      .describe("2-letter ISO country code (e.g., 'US', 'UK', 'DE')"),
    name: z.string().describe("Country name"),
    region: z.string().optional().describe("Geographic region (optional)"),
  });

  server.registerTool(
    "create_country",
    {
      title: "Create Country",
      description: "Add a new country to the database.",
      inputSchema: countryCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.scholarships.admin.countries.post(
          {
            code: params.code,
            name: params.name,
            region: params.region,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error("Failed to create country via API");
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
        console.error("create_country error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create country",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const countryUpdateSchema = z.object({
    code: z.string().length(2).describe("2-letter ISO country code to update"),
    name: z.string().optional().describe("Country name"),
    region: z.string().optional().describe("Geographic region"),
  });

  server.registerTool(
    "update_country",
    {
      title: "Update Country",
      description: "Update an existing country's details.",
      inputSchema: countryUpdateSchema,
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
          .countries({
            code: params.code,
          })
          .patch(
            {
              name: params.name,
              region: params.region,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error("Failed to update country via API");
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
        console.error("update_country error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update country",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_country",
    {
      title: "Delete Country",
      description: "Delete a country from the database.",
      inputSchema: z.object({
        code: z
          .string()
          .length(2)
          .describe("2-letter ISO country code to delete"),
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
          .countries({
            code: params.code,
          })
          .delete({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to delete country via API");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Country deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_country error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete country",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
