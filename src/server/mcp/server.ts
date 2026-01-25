import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { auth } from "@/server/better-auth";
import { registerAcademicTools } from "./tools/academic";
import { registerCollegeTools } from "./tools/colleges";
import { registerCountryTools } from "./tools/countries";
import { registerDataQualityTools } from "./tools/data-quality";
import { registerDegreeTools } from "./tools/degrees";
import { registerDepartmentTools } from "./tools/departments";
import { registerFieldTools } from "./tools/fields-of-study";
import { registerRatingTools } from "./tools/ratings";
import { registerResourceTools } from "./tools/resources";
import { registerRoundEventTools } from "./tools/rounds-events";
import { registerScholarshipTools } from "./tools/scholarships";
import { registerTaxonomyTools } from "./tools/taxonomy";
import { registerUniversityTools } from "./tools/universities";

/**
 * MCP Server Configuration
 */

const mcpHandler = createMcpHandler(
  async (server) => {
    // Core scholarship tools
    registerScholarshipTools(server);
    registerRoundEventTools(server);

    // Taxonomy tools
    registerCountryTools(server);
    registerDegreeTools(server);
    registerFieldTools(server);
    registerDepartmentTools(server);
    registerTaxonomyTools(server);

    // University and college tools
    registerUniversityTools(server);
    registerCollegeTools(server);

    // Academic tools (programs and courses)
    registerAcademicTools(server);

    // Resource library tools
    registerResourceTools(server);

    // Rating system tools
    registerRatingTools(server);

    // Data quality tools
    registerDataQualityTools(server);
  },
  {
    serverInfo: {
      name: "IOESU MCP",
      version: "1.0.0",
    },
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  },
);

/**
 * Token verification for MCP auth
 */
const verifyToken = async (_req: Request, bearerToken?: string) => {
  if (!bearerToken) return undefined;

  try {
    const keyValidation = await auth.api.verifyApiKey({
      body: {
        key: bearerToken,
      },
    });

    if (keyValidation?.valid && keyValidation.key) {
      return {
        token: bearerToken,
        clientId: keyValidation.key.userId,
        scopes: [], // We can add refined scopes later
        extra: {
          apiKey: keyValidation.key,
        },
      };
    }
  } catch (error) {
    console.error("MCP Auth Error:", error);
  }

  return undefined;
};

export const handler = withMcpAuth(mcpHandler, verifyToken, {
  required: false,
});

export { handler as GET, handler as POST };
