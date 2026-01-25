import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation } from "../utils";

export function registerRoundEventTools(server: McpServer): void {
  server.registerTool(
    "delete_scholarship_round",
    {
      title: "Delete Scholarship Round",
      description: "Remove an application round from database.",
      inputSchema: z.object({
        id: z.string().describe("Round ID to delete"),
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
          .rounds({ id: params.id })
          .delete({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to delete round via API");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Round deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_scholarship_round error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete round",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_scholarship_rounds",
    {
      title: "Bulk Delete Scholarship Rounds",
      description: "Delete multiple application rounds efficiently.",
      inputSchema: z.object({
        ids: z.array(z.string()).describe("Array of round IDs to delete"),
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
            const response = await api.api.scholarships.admin
              .rounds({ id })
              .delete({
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message ||
                  "Failed to delete round via API",
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
        console.error("bulk_delete_scholarship_rounds error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk delete rounds",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "fetch_events_by_round",
    {
      title: "Fetch Events by Round",
      description: "Get all events for a specific scholarship round.",
      inputSchema: z.object({
        roundId: z.string().describe("Round ID to fetch events for"),
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

        const response = (await api.api.scholarships.admin
          .rounds({ id: params.roundId })
          .patch(
            {},
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          )) as any;

        if (response.error || !response.data?.success) {
          throw new Error("Failed to fetch calendar events via API");
        }

        const events = (response.data as any).data?.events || [];

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: events,
              }),
            },
          ],
        };
      } catch (error) {
        console.error("fetch_upcoming_events error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch upcoming events",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "bulk_delete_round_events",
    {
      title: "Bulk Delete Round Events",
      description: "Delete multiple events efficiently.",
      inputSchema: z.object({
        ids: z.array(z.string()).describe("Array of event IDs to delete"),
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
            const response = await api.api.scholarships.admin.rounds
              .events({ id })
              .delete({
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });

            if (response.error || !response.data?.success) {
              throw new Error(
                response.error?.value?.message ||
                  "Failed to delete event via API",
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
        console.error("bulk_delete_round_events error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to bulk delete events",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
