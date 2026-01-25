import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";

export function registerFieldTools(server: McpServer): void {
  server.registerTool(
    "fetch_fields_of_study",
    {
      title: "Fetch Fields of Study",
      description: "Retrieve all fields of study from the database.",
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

        const response = await api.api.scholarships.fields.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to fetch fields via API");
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
        console.error("fetch_fields_of_study error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to fetch fields",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const fieldCreateSchema = z.object({
    name: z
      .string()
      .describe(
        "Field of study name (e.g., 'Computer Science', 'Engineering')",
      ),
  });

  server.registerTool(
    "create_field_of_study",
    {
      title: "Create Field of Study",
      description: "Add a new field of study to the database.",
      inputSchema: fieldCreateSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const response = await api.api.scholarships.admin.fields.post(
          {
            name: params.name,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );

        if (response.error || !response.data?.success) {
          throw new Error("Failed to create field via API");
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
        console.error("create_field_of_study error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to create field",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const fieldUpdateSchema = z.object({
    id: z.string().describe("Field of study ID to update"),
    name: z.string().optional().describe("Field of study name"),
  });

  server.registerTool(
    "update_field_of_study",
    {
      title: "Update Field of Study",
      description: "Update an existing field of study's details.",
      inputSchema: fieldUpdateSchema,
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
          .fields({
            id: params.id,
          })
          .patch(
            {
              name: params.name,
            },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );

        if (response.error || !response.data?.success) {
          throw new Error("Failed to update field via API");
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
        console.error("update_field_of_study error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to update field",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "delete_field_of_study",
    {
      title: "Delete Field of Study",
      description: "Delete a field of study from the database.",
      inputSchema: z.object({
        id: z.string().describe("Field ID to delete"),
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
          .fields({
            id: params.id,
          })
          .delete({
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to delete field via API");
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                message: "Field deleted successfully",
              }),
            },
          ],
        };
      } catch (error) {
        console.error("delete_field_of_study error:", error);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to delete field",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
