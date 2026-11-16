import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { appEnv } from "@/env";
import { resolveOAuthAccess } from "@/server/authentication/oauth-access";
import { auth } from "@/server/better-auth";
import { authorizeOAuthToolCall } from "./authorize-tool-call";
import { mcpServerInfo } from "./metadata";
import { registerCourseExplorerResources } from "./resources/course-explorer";
import { registerAcademicTools } from "./tools/academic";
import { registerAgentFeedbackTools } from "./tools/agent-feedback";
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
    registerAgentFeedbackTools(server);

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
    serverInfo: mcpServerInfo,
    instructions:
      "If a task exposes a missing tool, failure, or confusing behavior, use submit_feedback once after finishing or giving up. Do not include secrets, personal data, or transcripts. If feedback fails, continue without retrying.",
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
    disableSse: true,
  },
);

/**
 * Token verification for MCP auth (supports both API keys and OAuth 2.0 access tokens)
 */
const verifyToken = async (_req: Request, bearerToken?: string) => {
  if (!bearerToken) return undefined;

  try {
    // 1. Try API Key verification
    if (bearerToken.startsWith("ik_")) {
      const keyValidation = await auth.api.verifyApiKey({
        body: {
          key: bearerToken,
        },
      });

      if (keyValidation?.valid && keyValidation.key) {
        return {
          token: bearerToken,
          clientId: keyValidation.key.userId,
          scopes: [],
          extra: {
            apiKey: keyValidation.key,
          },
        };
      }
    }

    // The same verifier and permission policy are used by downstream REST calls.
    const access = await resolveOAuthAccess(bearerToken);
    if (access) {
      return {
        token: bearerToken,
        clientId: access.clientId,
        scopes: access.scopes,
        extra: {
          oauth: true,
          apiKey: { userId: access.user.id, permissions: access.permissions },
        },
      };
    }
  } catch (error) {
    console.error("MCP Auth Error:", error);
  }

  return undefined;
};

const authenticatedHandler = withMcpAuth(
  async (request) => {
    const authInfo = (request as Request & { auth?: AuthInfo }).auth;
    const denied = await authorizeOAuthToolCall(request, authInfo);
    return denied || mcpHandler(request);
  },
  verifyToken,
  {
    required: true,
    resourceUrl: new URL(appEnv.NEXT_PUBLIC_BASE_URL).origin,
  },
);

const mcpCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID",
  "Access-Control-Expose-Headers":
    "WWW-Authenticate, MCP-Protocol-Version, Mcp-Session-Id",
};

export async function handler(request: Request) {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: mcpCorsHeaders });
  const response = await authenticatedHandler(request);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(mcpCorsHeaders))
    headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export { handler as GET, handler as POST };
