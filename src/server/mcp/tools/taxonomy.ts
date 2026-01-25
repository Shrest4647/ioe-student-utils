import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";

export function registerTaxonomyTools(server: McpServer): void {
  server.registerTool(
    "lookup_taxonomy",
    {
      title: "Lookup Taxonomy Values",
      description: `
        Look up country codes, degree levels, or field of study IDs
        by their names. Use this tool to convert user-provided names
        (e.g., "Germany", "Masters", "Computer Science") to their
        corresponding IDs required for scholarship creation.

        Returns mapping of names to IDs that can be used in create_scholarship.
      `.trim(),
      inputSchema: z.object({
        type: z
          .enum(["country", "degree", "field"])
          .describe("Type of taxonomy to look up"),
        names: z
          .array(z.string())
          .describe("Array of names to look up (e.g., ['Germany', 'Masters'])"),
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

        const results: Record<string, unknown> = {};

        if (params.type === "country") {
          const response = await api.api.scholarships.countries.get({
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (response.data?.success) {
            const countries = response.data.data || [];
            const nameToCodeMap: Record<string, string> = {};
            countries.forEach((c) => {
              nameToCodeMap[c.name.toLowerCase()] = c.code;
              nameToCodeMap[c.code.toLowerCase()] = c.code;
            });

            const codes: string[] = [];
            const notFound: string[] = [];

            params.names.forEach((name) => {
              const matchedCode = nameToCodeMap[name.toLowerCase()];
              if (matchedCode) {
                codes.push(matchedCode);
              } else {
                notFound.push(name);
              }
            });

            results.countryCodes = codes;
            if (notFound.length > 0) {
              results.notFound = notFound;
            }
          }
        } else if (params.type === "degree") {
          const response = await api.api.scholarships.degrees.get({
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (response.data?.success) {
            const degrees = response.data.data || [];
            const nameToIdMap: Record<string, string> = {};
            degrees.forEach((d) => {
              nameToIdMap[d.name.toLowerCase()] = d.id;
            });

            const ids: string[] = [];
            const notFound: string[] = [];

            params.names.forEach((name) => {
              const matchedId = nameToIdMap[name.toLowerCase()];
              if (matchedId) {
                ids.push(matchedId);
              } else {
                notFound.push(name);
              }
            });

            results.degreeIds = ids;
            if (notFound.length > 0) {
              results.notFound = notFound;
            }
          }
        } else if (params.type === "field") {
          const response = await api.api.scholarships.fields.get({
            headers: { Authorization: `Bearer ${apiKey}` },
          });

          if (response.data?.success) {
            const fields = response.data.data || [];
            const nameToIdMap: Record<string, string> = {};
            fields.forEach((f) => {
              nameToIdMap[f.name.toLowerCase()] = f.id;
            });

            const ids: string[] = [];
            const notFound: string[] = [];

            params.names.forEach((name) => {
              const matchedId = nameToIdMap[name.toLowerCase()];
              if (matchedId) {
                ids.push(matchedId);
              } else {
                notFound.push(name);
              }
            });

            results.fieldIds = ids;
            if (notFound.length > 0) {
              results.notFound = notFound;
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, data: results }, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("lookup_taxonomy error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to lookup taxonomy",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
