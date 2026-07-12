import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { auth } from "@/server/better-auth";
import { registerCourseExplorerResources } from "./resources/course-explorer";
import { registerAcademicTools } from "./tools/academic";
import { registerCollegeTools } from "./tools/colleges";
import { registerCountryTools } from "./tools/countries";
import { registerCourseExplorerTools } from "./tools/course-explorer";
import { registerDataQualityTools } from "./tools/data-quality";
import { registerDegreeTools } from "./tools/degrees";
import { registerDepartmentTools } from "./tools/departments";
import { registerFieldTools } from "./tools/fields-of-study";
import { registerFlashcardTools } from "./tools/flashcards";
import { registerQuizTools } from "./tools/quizzes";
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

    // Course Explorer tools (bulk operations for courses, units, topics)
    registerCourseExplorerTools(server);
    registerCourseExplorerResources(server);

    // Resource library tools
    registerResourceTools(server);

    // Rating system tools
    registerRatingTools(server);

    // Data quality tools
    registerDataQualityTools(server);

    // Quiz tools
    registerQuizTools(server);

    // Flashcard tools
    registerFlashcardTools(server);
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
    disableSse: true,
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
