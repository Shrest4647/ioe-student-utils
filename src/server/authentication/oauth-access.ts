import {
  getOAuthPermissions,
  oauthRequestPermission,
} from "@/lib/mcp/oauth-permissions";
import { db } from "@/server/db";
import type { user } from "@/server/db/schema";

type OAuthUser = typeof user.$inferSelect;
export interface OAuthLookup {
  findToken(token: string): Promise<
    | {
        userId: string | null;
        clientId: string;
        scopes: string | null;
        accessTokenExpiresAt: Date;
      }
    | undefined
  >;
  findClient(
    clientId: string,
  ): Promise<{ disabled: boolean | null } | undefined>;
  findUser(userId: string): Promise<OAuthUser | undefined>;
}
const databaseLookup: OAuthLookup = {
  findToken: (token) =>
    db.query.oauthAccessToken.findFirst({ where: { accessToken: token } }),
  findClient: (clientId) =>
    db.query.oauthApplication.findFirst({ where: { clientId } }),
  findUser: (userId) => db.query.user.findFirst({ where: { id: userId } }),
};

export async function resolveOAuthAccess(
  token: string,
  lookup: OAuthLookup = databaseLookup,
) {
  const record = await lookup.findToken(token);
  if (!record || record.accessTokenExpiresAt <= new Date() || !record.userId)
    return null;
  const client = await lookup.findClient(record.clientId);
  if (!client || client.disabled) return null;
  const account = await lookup.findUser(record.userId);
  if (!account) return null;
  const scopes = record.scopes?.split(/\s+/).filter(Boolean) || [];
  return {
    user: account,
    clientId: record.clientId,
    scopes,
    permissions: getOAuthPermissions(account.role, scopes),
  };
}

export type OAuthRequestIdentity = NonNullable<
  Awaited<ReturnType<typeof resolveOAuthAccess>>
> & { authType: "oauth" };

export async function resolveOAuthRequest(
  request: Request,
  lookup: OAuthLookup = databaseLookup,
): Promise<OAuthRequestIdentity | Response | null> {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token || token.startsWith("ik_")) return null;
  try {
    const access = await resolveOAuthAccess(token, lookup);
    if (!access)
      return Response.json(
        {
          success: false,
          error:
            "Invalid, expired, or revoked OAuth access token. Reconnect your AI app.",
        },
        { status: 401 },
      );
    const requirement = oauthRequestPermission(request);
    if (
      !requirement ||
      !access.permissions[requirement.resource]?.includes(requirement.action)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "This OAuth connection cannot perform this operation. For create/update access, reconnect and approve editing with an administrator account.",
          code: "insufficient_scope",
        },
        {
          status: 403,
          headers: {
            "WWW-Authenticate":
              'Bearer error="insufficient_scope", scope="mcp:write"',
          },
        },
      );
    }
    return { ...access, authType: "oauth" };
  } catch {
    // Do not expose token values or database errors in authentication responses.
    return Response.json(
      {
        success: false,
        error: "Unable to verify this OAuth connection. Please reconnect.",
      },
      { status: 401 },
    );
  }
}
