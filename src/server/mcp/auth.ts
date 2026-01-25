/**
 * MCP Authentication Module
 *
 * Handles authentication for MCP requests using Better Auth API Keys.
 * All MCP requests must include a valid API key in request headers.
 *
 * Supported headers:
 * - Authorization: Bearer <api-key>
 * - x-api-key: <api-key>
 *
 * Security:
 * - Keys are validated against Better Auth's API Key plugin
 * - Rate limiting is enforced by Better Auth
 * - Sessions can be created from API keys for user context
 *
 * @module mcp/auth
 */

import { auth } from "@/server/better-auth";

/**
 * Authentication result interface
 */
export interface AuthResult {
  valid: boolean;
  userId?: string;
  apiKeyId?: string;
  permissions?: Record<string, string[]>;
  error?: string;
}

/**
 * Extract API key from request headers
 *
 * Supports two header formats:
 * 1. Authorization: Bearer <key>
 * 2. x-api-key: <key>
 *
 * @param request - Incoming HTTP request
 * @returns API key string or null
 */
function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  // Try Authorization header with Bearer token
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try x-api-key header
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Authenticate MCP request using Better Auth API Key verification
 *
 * @param request - Incoming HTTP request
 * @returns Authentication result with user information
 */
export async function authenticateMCPRequest(
  request: Request,
): Promise<AuthResult> {
  try {
    // Extract API key from headers
    const apiKey = extractApiKey(request);

    if (!apiKey) {
      return {
        valid: false,
        error:
          "Missing API key. Include 'Authorization: Bearer <key>' or 'x-api-key: <key>' header.",
      };
    }

    // Verify API key with Better Auth (server-side)
    const data = await auth.api.verifyApiKey({
      body: { key: apiKey },
    });

    if (!data?.valid || !data?.key) {
      return {
        valid: false,
        error: "Invalid or expired API key",
      };
    }

    // Extract user information from verified key
    const keyData = data.key;

    // Parse permissions if they exist (stored as JSON string in DB)
    let permissions: Record<string, string[]> = {};
    if (keyData.permissions) {
      try {
        permissions = keyData.permissions;
      } catch (error) {
        console.error("Failed to parse permissions:", error);
      }
    }

    return {
      valid: true,
      userId: keyData.userId,
      apiKeyId: keyData.id,
      permissions,
    };
  } catch (error) {
    console.error("MCP authentication error:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}

/**
 * Check if user has required permission
 *
 * @param userPermissions - User's permissions from API key
 * @param resource - Resource type (e.g., "scholarships", "universities")
 * @param action - Action type (e.g., "read", "write", "delete")
 * @returns True if user has permission
 */
export function hasPermission(
  userPermissions: Record<string, string[]>,
  resource: string,
  action: string,
): boolean {
  const resourcePermissions = userPermissions[resource] || [];

  // Check for wildcard permission
  if (resourcePermissions.includes("*")) {
    return true;
  }

  // Check for specific action permission
  return resourcePermissions.includes(action);
}

/**
 * Permission requirements for each tool
 *
 * Maps tool names to required permissions.
 * If a tool is not listed, it's considered public (read-only).
 */
export const TOOL_PERMISSIONS = {
  // Scholarship tools
  fetch_scholarships: { resource: "scholarships", action: "read" },
  create_scholarship: { resource: "scholarships", action: "write" },
  update_scholarship: { resource: "scholarships", action: "write" },
  delete_scholarship: { resource: "scholarships", action: "delete" },

  // University tools
  fetch_universities: { resource: "universities", action: "read" },
  create_university: { resource: "universities", action: "write" },
  update_university: { resource: "universities", action: "write" },
  delete_university: { resource: "universities", action: "delete" },

  // Event tools
  fetch_events: { resource: "events", action: "read" },
  create_event: { resource: "events", action: "write" },
  update_event: { resource: "events", action: "write" },
  delete_event: { resource: "events", action: "delete" },

  // Resource tools
  fetch_resources: { resource: "resources", action: "read" },
  create_resource: { resource: "resources", action: "write" },
  update_resource: { resource: "resources", action: "write" },
  delete_resource: { resource: "resources", action: "delete" },
} as const;

/**
 * Check if user has permission to use a tool
 *
 * @param toolName - Name of tool being called
 * @param userPermissions - User's permissions from API key
 * @returns True if user has permission to use tool
 */
export function canUseTool(
  toolName: string,
  userPermissions: Record<string, string[]>,
): boolean {
  const requirement =
    TOOL_PERMISSIONS[toolName as keyof typeof TOOL_PERMISSIONS];

  // If no permission requirement defined, tool is public
  if (!requirement) {
    return true;
  }

  return hasPermission(
    userPermissions,
    requirement.resource,
    requirement.action,
  );
}
