import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { auth } from "@/server/better-auth";
import { registerScholarshipTools } from "./tools/scholarships";

/**
 * MCP Server Configuration
 */

const mcpHandler = createMcpHandler(
  async (server) => {
    registerScholarshipTools(server);
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
