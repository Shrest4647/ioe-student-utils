import { db } from "@/server/db";
import { canUseTool, hasPermission } from "./auth";

type RequestContext = {
  authInfo?: {
    token?: string;
    extra?: {
      apiKey?: {
        userId?: string;
        permissions?: Record<string, string[]>;
      };
    };
  };
};

type AllowedRole = "admin" | "instructor" | "mcp_admin";

function getApiKeyPermissions(ctx: RequestContext): Record<string, string[]> {
  return ctx.authInfo?.extra?.apiKey?.permissions ?? {};
}

async function getUserRole(ctx: RequestContext): Promise<string | null> {
  const userId = ctx.authInfo?.extra?.apiKey?.userId;
  if (!userId) return null;

  const user = await db.query.user.findFirst({
    where: {
      id: userId,
    },
    columns: {
      role: true,
    },
  });

  return user?.role ?? null;
}

export async function ensureToolAccess(
  ctx: RequestContext,
  toolName: string,
  options?: {
    roles?: AllowedRole[];
  },
): Promise<string> {
  const token = ctx.authInfo?.token;
  if (!token) {
    throw new Error(
      "MCP Authorization key is not configured. Please contact the owners.",
    );
  }

  const permissions = getApiKeyPermissions(ctx);
  if (!canUseTool(toolName, permissions)) {
    throw new Error(`Insufficient API key permissions for '${toolName}'`);
  }

  if (options?.roles && options.roles.length > 0) {
    const role = await getUserRole(ctx);
    if (!role || !options.roles.includes(role as AllowedRole)) {
      throw new Error(
        `Tool '${toolName}' requires one of roles: ${options.roles.join(", ")}`,
      );
    }
  }

  return token;
}

export function ensureResourcePermission(
  ctx: RequestContext,
  resource: string,
  action: string,
) {
  const permissions = getApiKeyPermissions(ctx);
  if (!hasPermission(permissions, resource, action)) {
    throw new Error(
      `Insufficient API key permissions for resource '${resource}:${action}'`,
    );
  }
}
