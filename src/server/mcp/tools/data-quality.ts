import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";

type Match = {
  id: string;
  name: string;
  similarityScore: number;
  reason: string;
};

type DuplicateCheckResult = {
  isDuplicate: boolean;
  confidence: number;
  matches: Match[];
};

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  return ((maxLen - distance) / maxLen) * 100;
}

function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, " ");
}

export function registerDataQualityTools(server: McpServer): void {
  server.registerTool(
    "check_duplicate_scholarship",
    {
      title: "Check Duplicate Scholarship",
      description: "Verify if a scholarship already exists in the database.",
      inputSchema: z.object({
        name: z.string().describe("Scholarship name"),
        providerName: z
          .string()
          .optional()
          .describe("Provider/organization name"),
        websiteUrl: z.string().optional().describe("Official website URL"),
        year: z.string().optional().describe("Scholarship year (e.g., '2026')"),
      }),
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;

        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact owners.",
          );
        }

        const normalizedName = normalizeString(params.name);
        const matches: Match[] = [];

        const response = await api.api.scholarships.get({
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          query: {
            limit: "100",
          },
        });

        if (response.error || !response.data?.success) {
          throw new Error("Failed to fetch scholarships via API");
        }

        const allScholarships = (response.data as any).data || [];

        for (const scholarship of allScholarships) {
          const existingName = normalizeString(scholarship.name || "");

          const exactMatch = existingName === normalizedName;
          const score = similarityScore(normalizedName, existingName);
          const similarMatch = score >= 80;

          const reasons: string[] = [];
          if (exactMatch) {
            reasons.push("Exact name match");
          }
          if (similarMatch) {
            reasons.push(`Similar name (${Math.round(score)}% match)`);
          }
          if (
            params.providerName &&
            scholarship.providerName &&
            normalizeString(params.providerName) ===
              normalizeString(scholarship.providerName)
          ) {
            reasons.push("Same provider");
          }
          if (
            params.websiteUrl &&
            scholarship.websiteUrl &&
            normalizeString(params.websiteUrl) ===
              normalizeString(scholarship.websiteUrl)
          ) {
            reasons.push("Same website URL");
          }
          if (
            params.year &&
            scholarship.slug &&
            scholarship.slug.includes(params.year)
          ) {
            reasons.push("Slug contains same year");
          }

          if (reasons.length > 0) {
            matches.push({
              id: scholarship.id,
              name: scholarship.name,
              similarityScore: Math.round(score),
              reason: reasons.join(", "),
            });
          }
        }

        const isDuplicate = matches.some(
          (m) => m.similarityScore >= 80 || m.reason.includes("Exact"),
        );
        const maxConfidence =
          matches.length > 0
            ? Math.max(...matches.map((m) => m.similarityScore))
            : 0;

        const result: DuplicateCheckResult = {
          isDuplicate,
          confidence: isDuplicate ? maxConfidence : 0,
          matches: matches.sort(
            (a, b) => b.similarityScore - a.similarityScore,
          ),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, data: result }, null, 2),
            },
          ],
        };
      } catch (error) {
        console.error("check_duplicate_scholarship error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to check for duplicates",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );

  const scholarshipValidationSchema = z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    providerName: z.string().optional(),
    websiteUrl: z.string().optional(),
    fundingType: z.enum(["fully_funded", "partial", "tuition_only"]).optional(),
    status: z.enum(["active", "inactive", "archived"]).optional(),
    countryCodes: z.array(z.string().length(2)).optional(),
    degreeIds: z.array(z.string()).optional(),
    fieldIds: z.array(z.string()).optional(),
    openDate: z.string().optional(),
    deadlineDate: z.string().optional(),
  });

  server.registerTool(
    "validate_scholarship_data",
    {
      title: "Validate Scholarship Data",
      description:
        "Validate scholarship data for completeness and accuracy before creation.",
      inputSchema: scholarshipValidationSchema,
    },
    async (params, requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;
        if (!apiKey) {
          throw new Error(
            "MCP Authorization key is not configured. Please contact the owners.",
          );
        }

        const errors: Array<{
          field: string;
          message: string;
          severity: "error" | "warning";
        }> = [];
        const warnings: string[] = [];

        if (!params.name || params.name.trim().length === 0) {
          errors.push({
            field: "name",
            message: "Scholarship name is required",
            severity: "error",
          });
        }

        if (!params.slug || params.slug.trim().length === 0) {
          errors.push({
            field: "slug",
            message: "Slug is required",
            severity: "error",
          });
        } else if (!/^[a-z0-9-]+$/.test(params.slug)) {
          errors.push({
            field: "slug",
            message:
              "Slug must contain only lowercase letters, numbers, and hyphens",
            severity: "error",
          });
        }

        if (params.websiteUrl) {
          try {
            new URL(params.websiteUrl);
          } catch {
            errors.push({
              field: "websiteUrl",
              message: "Invalid website URL format",
              severity: "error",
            });
          }
        }

        const validFundingTypes = ["fully_funded", "partial", "tuition_only"];
        if (
          params.fundingType &&
          !validFundingTypes.includes(params.fundingType)
        ) {
          errors.push({
            field: "fundingType",
            message: `Invalid funding type. Must be one of: ${validFundingTypes.join(", ")}`,
            severity: "error",
          });
        }

        const validStatuses = ["active", "inactive", "archived"];
        if (params.status && !validStatuses.includes(params.status)) {
          errors.push({
            field: "status",
            message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
            severity: "error",
          });
        }

        if (params.openDate) {
          const openDate = new Date(params.openDate);
          if (Number.isNaN(openDate.getTime())) {
            errors.push({
              field: "openDate",
              message: "Invalid openDate format (must be ISO 8601)",
              severity: "error",
            });
          }
        }

        if (params.deadlineDate) {
          const deadlineDate = new Date(params.deadlineDate);
          if (Number.isNaN(deadlineDate.getTime())) {
            errors.push({
              field: "deadlineDate",
              message: "Invalid deadlineDate format (must be ISO 8601)",
              severity: "error",
            });
          } else if (params.openDate) {
            const openDate = new Date(params.openDate);
            if (!Number.isNaN(openDate.getTime()) && deadlineDate < openDate) {
              warnings.push("deadlineDate is before openDate");
            }
          }
        }

        if (params.countryCodes) {
          try {
            const countriesResponse = await api.api.scholarships.countries.get({
              headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (!countriesResponse.data?.success) {
              errors.push({
                field: "countryCodes",
                message: "Failed to validate countryCodes: lookup failed",
                severity: "error",
              });
            } else {
              const validCodes = new Set(
                (countriesResponse.data.data || []).map((c) =>
                  c.code.toLowerCase(),
                ),
              );

              params.countryCodes.forEach((code) => {
                if (!validCodes.has(code.toLowerCase())) {
                  errors.push({
                    field: "countryCodes",
                    message: `Country code '${code}' does not exist in database`,
                    severity: "error",
                  });
                }
              });
            }
          } catch {
            errors.push({
              field: "countryCodes",
              message: "Failed to validate countryCodes: lookup failed",
              severity: "error",
            });
          }
        }

        if (params.degreeIds) {
          try {
            const degreesResponse = await api.api.scholarships.degrees.get({
              headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (!degreesResponse.data?.success) {
              errors.push({
                field: "degreeIds",
                message: "Failed to validate degreeIds: lookup failed",
                severity: "error",
              });
            } else {
              const validIds = new Set(
                (degreesResponse.data.data || []).map((d) => d.id),
              );

              params.degreeIds.forEach((id) => {
                if (!validIds.has(id)) {
                  errors.push({
                    field: "degreeIds",
                    message: `Degree ID '${id}' does not exist in database`,
                    severity: "error",
                  });
                }
              });
            }
          } catch {
            errors.push({
              field: "degreeIds",
              message: "Failed to validate degreeIds: lookup failed",
              severity: "error",
            });
          }
        }

        if (params.fieldIds) {
          try {
            const fieldsResponse = await api.api.scholarships.fields.get({
              headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (!fieldsResponse.data?.success) {
              errors.push({
                field: "fieldIds",
                message: "Failed to validate fieldIds: lookup failed",
                severity: "error",
              });
            } else {
              const validIds = new Set(
                (fieldsResponse.data.data || []).map((f) => f.id),
              );

              params.fieldIds.forEach((id) => {
                if (!validIds.has(id)) {
                  errors.push({
                    field: "fieldIds",
                    message: `Field ID '${id}' does not exist in database`,
                    severity: "error",
                  });
                }
              });
            }
          } catch {
            errors.push({
              field: "fieldIds",
              message: "Failed to validate fieldIds: lookup failed",
              severity: "error",
            });
          }
        }

        const isValid =
          errors.filter((e) => e.severity === "error").length === 0;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  data: {
                    isValid,
                    errors,
                    warnings,
                    suggestions:
                      warnings.length > 0
                        ? ["Review warnings and correct date order if needed"]
                        : [],
                  },
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        console.error("validate_scholarship_data error:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to validate scholarship data",
              }),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
