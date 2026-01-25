import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";

export function registerDegreeTools(server: McpServer): void {
  server.registerTool(
    "fetch_degrees",
    {
      title: "Fetch Degrees",
      description: "Retrieve all degree levels from the database.",
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

        const response = await api.api.scholarships.degrees.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to fetch degrees via API");
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
        console.error("fetch_degrees error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch degrees",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const degreeCreateSchema = z.object({
    name: z
      .string()
      .describe("Degree level name (e.g., 'Bachelors', 'Masters', 'PhD')"),
    rank: z.string().optional().describe("Rank/order for sorting (optional)"),
  });

  server.registerTool(
    "create_degree",
    {
      title: "Create Degree",
      description: "Create a new degree level.",
      inputSchema: degreeCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.scholarships.admin.degrees.post(
          {
            name: params.name,
            rank: params.rank,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error("Failed to create degree via API");
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
        console.error("create_degree error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create degree",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const degreeUpdateSchema = z.object({
    id: z.string().describe("Degree level ID to update"),
    name: z.string().optional().describe("Degree level name"),
    rank: z.string().optional().describe("Rank/order for sorting"),
  });

  server.registerTool(
    "update_degree",
    {
      title: "Update Degree Level",
      description: "Update an existing degree level.",
      inputSchema: degreeUpdateSchema,
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
          .degrees({
            id: params.id,
          })
          .patch(
            {
              name: params.name,
              rank: params.rank,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error("Failed to update degree via API");
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
        console.error("update_degree error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update degree",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_degree",
    {
      title: "Delete Degree",
      description: "Delete a degree level from the database.",
      inputSchema: z.object({
        id: z.string().describe("Degree ID to delete"),
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
          .degrees({
            id: params.id,
          })
          .delete({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to delete degree via API");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Degree deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_degree error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete degree",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
