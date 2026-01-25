import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { bulkOperation } from "../utils";

export function registerRoundEventTools(server: McpServer): void {
  server.registerTool(
    "delete_scholarship_round",
    {
      title: "Delete Scholarship Round",
      description: `
        Remove an application round from database.

        Use this tool to delete a round by its ID.
        Warning: This action cannot be undone.
      `.trim(),
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
      description: `
        Delete multiple application rounds efficiently.

        Use this tool to delete multiple rounds in a single operation.
        The tool handles iteration internally, reducing token usage for AI agents.

        Returns detailed results including success/failure for each round.
      `.trim(),
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
            return await api.api.scholarships.admin.rounds({ id }).delete({
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            });
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
      description: `
        Get all events for a specific scholarship round.

        Use this tool to retrieve events associated with a round.
        Returns array of events with details.
      `.trim(),
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

        const response = await api.api
          .scholarships({
            slug: params.roundId,
          })
          .get({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error) {
          throw new Error("Failed to fetch scholarship via API");
        }

        const scholarship = response.data?.data;
        const events =
          scholarship?.rounds?.flatMap((r: any) => r.events || []) || [];

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
        console.error("fetch_events_by_round error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch events",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "fetch_upcoming_events",
    {
      title: "Fetch Upcoming Events",
      description: `
        Get all upcoming events across all scholarships.

        Use this tool to get events sorted by date.
        Returns array of upcoming events.
      `.trim(),
      inputSchema: z.object({
        daysAhead: z
          .number()
          .int()
          .min(1)
          .max(365)
          .default(30)
          .describe("Number of days ahead to look for events (default: 30)"),
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

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + params.daysAhead);

        const response = await api.api.scholarships.calendar.get({
          query: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to fetch calendar events via API");
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
      description: `
        Delete multiple events efficiently.

        Use this tool to delete multiple events in a single operation.
        The tool handles iteration internally, reducing token usage for AI agents.

        Returns detailed results including success/failure for each event.
      `.trim(),
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
            return await api.api.scholarships.admin.rounds
              .events({ id })
              .delete({
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                },
              });
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
