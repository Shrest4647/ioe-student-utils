import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { appEnv } from "@/env";
import { canUseTool, TOOL_PERMISSIONS } from "./auth";

/** Enforce OAuth tool permissions even for legacy tools that only forward a token. */
export async function authorizeOAuthToolCall(
  request: Request,
  authInfo?: AuthInfo,
): Promise<Response | null> {
  if (request.method !== "POST" || !authInfo?.extra?.oauth) return null;
  let call: {
    id?: string | number | null;
    method?: string;
    params?: { name?: string };
  };
  try {
    call = await request.clone().json();
  } catch {
    return null;
  }
  if (
    !call ||
    call.method !== "tools/call" ||
    typeof call.params?.name !== "string"
  )
    return null;
  const name = call.params.name;
  const permissions =
    (
      authInfo.extra.apiKey as
        | { permissions?: Record<string, string[]> }
        | undefined
    )?.permissions || {};
  if (canUseTool(name, permissions)) return null;
  const requirement = TOOL_PERMISSIONS[name as keyof typeof TOOL_PERMISSIONS];
  const requiresWrite = requirement?.action === "write";
  const message = requiresWrite
    ? "This connection is read-only. Reconnect with an administrator account and approve creating and editing academic entries."
    : "This OAuth grant does not include this tool. Delete operations and administrative feedback review require separately scoped API keys.";
  return Response.json(
    { jsonrpc: "2.0", id: call.id ?? null, error: { code: -32000, message } },
    {
      status: 403,
      headers: {
        "WWW-Authenticate": `Bearer error="insufficient_scope", resource_metadata="${new URL(appEnv.NEXT_PUBLIC_BASE_URL).origin}/.well-known/oauth-protected-resource"${requiresWrite ? ', scope="mcp:write"' : ""}`,
      },
    },
  );
}
