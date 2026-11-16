import { type Context, Elysia, status as httpStatus } from "elysia";
import { resolveOAuthRequest } from "@/server/authentication/oauth-access";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";

async function oauthFailure(response: Response, set: Context["set"]) {
  response.headers.forEach((value, name) => {
    set.headers[name] = value;
  });
  return httpStatus(
    response.status as 401 | 403,
    (await response.json()) as { success: false; error: string; code?: string },
  );
}

type AuthorizationIdentity = {
  user: typeof auth.$Infer.Session.user;
  authType: string;
  session?: typeof auth.$Infer.Session.session;
  apiKey?: {
    id: string;
    userId: string;
    permissions?: Record<string, string[]> | null;
  };
};

function identity(
  user: AuthorizationIdentity["user"],
  authType: string,
  session?: AuthorizationIdentity["session"],
  apiKey?: AuthorizationIdentity["apiKey"],
): AuthorizationIdentity {
  return { user, authType, session, apiKey };
}

type Role = "user" | "admin" | "instructor" | "mcp_admin";

/**
 * Authorization plugin for Elysia
 *
 * Provides reusable authentication and authorization patterns:
 * - `auth: true` - Requires authentication (session or API key)
 * - `apiKey: true` - Requires API key authentication only
 * - `sessionAuth: true` - Requires session authentication only (no API keys)
 * - `role: "admin"` - Requires specific role
 * - `ownerOnly: true` - User can only access their own resources (uses `id` or `userId` param)
 * - `adminOrOwner: true` - Admin users can access any resource, or user can access their own resource
 * - `apiKeyOwnerOnly: true` - User can only access their own API keys (admin can access any)
 *
 * @example
 * # Require authentication (session or API key)
 * .get("/profile", handler, { auth: true })
 *
 * # Require API key authentication only
 * .get("/api/data", handler, { apiKey: true })
 *
 * # Require session authentication only
 * .get("/dashboard", handler, { sessionAuth: true })
 *
 * # Require admin role
 * .get("/admin/users", handler, { auth: true, role: "admin" })
 *
 * # Owner-only access (user can only access their own data)
 * .put("/user/:id/profile", handler, { auth: true, ownerOnly: true })
 *
 * # Admin or owner access (admin can access any, user can access their own)
 * .put("/user/:id/profile", handler, { auth: true, adminOrOwner: true })
 *
 * # API key owner-only access (user can only access their own API keys)
 * .get("/apikeys/:id", handler, { apiKeyOwnerOnly: true })
 */
export function createAuthorizationPlugin(
  oauthResolver: (
    request: Request,
  ) => ReturnType<typeof resolveOAuthRequest> = resolveOAuthRequest,
) {
  return new Elysia({ name: "authorization" }).macro({
    auth: {
      async resolve({ status, request, set }) {
        const { headers } = request;
        const oauth = await oauthResolver(request);
        if (oauth instanceof Response) return oauthFailure(oauth, set);
        if (oauth) return identity(oauth.user, "oauth");

        // First try session authentication
        const session = await auth.api.getSession({ headers });
        if (session) {
          return identity(session.user, "session", session.session);
        }

        // Then try API key authentication
        const apiKey =
          headers.get("x-api-key") ||
          headers.get("authorization")?.replace("Bearer ", "");
        if (apiKey) {
          try {
            const keyValidation = await auth.api.verifyApiKey({
              body: {
                key: apiKey,
              },
            });

            if (keyValidation?.valid && keyValidation.key) {
              // Get the user from the API key
              const user = await db.query.user.findFirst({
                where: {
                  id: keyValidation.key.userId,
                },
              });

              if (user) {
                return identity(user, "apiKey", undefined, keyValidation.key);
              }
            }
          } catch (_error) {
            // Invalid API key
            return status(401);
          }
        }

        return status(401);
      },
    },
    apiKey: {
      async resolve({ status, request: { headers } }) {
        const apiKey =
          headers.get("x-api-key") ||
          headers.get("authorization")?.replace("Bearer ", "");
        if (!apiKey) {
          return status(401);
        }

        try {
          const keyValidation = await auth.api.verifyApiKey({
            body: {
              key: apiKey,
            },
          });

          if (keyValidation?.valid && keyValidation.key) {
            // Get the user from the API key's userId
            const user = await db.query.user.findFirst({
              where: {
                id: keyValidation.key.userId,
              },
            });

            if (user) {
              return identity(user, "apiKey", undefined, keyValidation.key);
            }
          }
        } catch (_error) {
          // Invalid API key
          return status(401);
        }

        return status(401);
      },
    },
    sessionAuth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
          authType: "session",
        };
      },
    },
    role: (requiredRole: Role) => ({
      async resolve({ request, set }: Pick<Context, "request" | "set">) {
        const { headers } = request;
        const oauth = await oauthResolver(request);
        if (oauth instanceof Response) return oauthFailure(oauth, set);
        if (oauth) {
          if (oauth.user.role !== requiredRole)
            return httpStatus(403, {
              success: false,
              error: "Your account role does not allow this operation.",
            });
          return identity(oauth.user, "oauth");
        }

        // First try session authentication
        const session = await auth.api.getSession({ headers });
        if (session) {
          if (session.user.role !== requiredRole) {
            return httpStatus(403);
          }
          return identity(session.user, "session", session.session);
        }

        // Then try API key authentication
        const apiKey =
          headers.get("x-api-key") ||
          headers.get("authorization")?.replace("Bearer ", "");
        if (apiKey) {
          try {
            const keyValidation = await auth.api.verifyApiKey({
              body: {
                key: apiKey,
              },
            });

            if (keyValidation?.valid && keyValidation.key) {
              // Get user from API key
              const user = await db.query.user.findFirst({
                where: {
                  id: keyValidation.key.userId,
                },
              });

              if (user && user.role === requiredRole) {
                return identity(user, "apiKey", undefined, keyValidation.key);
              }
            }
          } catch (_error) {
            // Invalid API key
            return httpStatus(401);
          }
        }

        return httpStatus(401);
      },
    }),
    roles: (requiredRoles: Role[]) => ({
      async resolve({ request, set }: Pick<Context, "request" | "set">) {
        const { headers } = request;
        const oauth = await oauthResolver(request);
        if (oauth instanceof Response) return oauthFailure(oauth, set);
        if (oauth) {
          if (!requiredRoles.includes(oauth.user.role as Role))
            return httpStatus(403, {
              success: false,
              error: "Your account role does not allow this operation.",
            });
          return identity(oauth.user, "oauth");
        }

        // First try session authentication
        const session = await auth.api.getSession({ headers });
        if (session) {
          if (!requiredRoles.includes(session.user.role as Role)) {
            return httpStatus(403);
          }
          return identity(session.user, "session", session.session);
        }

        // Then try API key authentication
        const apiKey =
          headers.get("x-api-key") ||
          headers.get("authorization")?.replace("Bearer ", "");
        if (apiKey) {
          try {
            const keyValidation = await auth.api.verifyApiKey({
              body: {
                key: apiKey,
              },
            });

            if (keyValidation?.valid && keyValidation.key) {
              const user = await db.query.user.findFirst({
                where: {
                  id: keyValidation.key.userId,
                },
              });

              if (user && requiredRoles.includes(user.role as Role)) {
                return identity(user, "apiKey", undefined, keyValidation.key);
              }
            }
          } catch (_error) {
            return httpStatus(401);
          }
        }

        return httpStatus(401);
      },
    }),
    ownerOnly: {
      async resolve({
        status,
        request: { headers },
        params,
      }: {
        status: (code: number) => void;
        request: { headers: Headers };
        params: Record<string, string>;
      }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);

        // Check if the resource belongs to the user
        const resourceId = params.id || params.userId;
        if (!resourceId) {
          return status(400);
        }
        if (resourceId !== session.user.id) {
          return status(403);
        }

        return {
          user: session.user,
          session: session.session,
        };
      },
    },
    adminOrOwner: {
      async resolve({
        status,
        request: { headers },
        params,
      }: {
        status: (code: number) => void;
        request: { headers: Headers };
        params: Record<string, string>;
      }) {
        const resourceId = params.id || params.userId;
        if (!resourceId) {
          return status(400);
        }

        // First try session authentication
        const session = await auth.api.getSession({ headers });
        if (session) {
          if (session.user.role === "admin" || resourceId === session.user.id) {
            return {
              user: session.user,
              session: session.session,
              authType: "session",
            };
          }
          return status(403);
        }

        // Then try API key authentication
        const apiKey =
          headers.get("x-api-key") ||
          headers.get("authorization")?.replace("Bearer ", "");
        if (apiKey) {
          try {
            const keyValidation = await auth.api.verifyApiKey({
              body: {
                key: apiKey,
              },
            });

            if (keyValidation?.valid && keyValidation.key) {
              const user = await db.query.user.findFirst({
                where: {
                  id: keyValidation.key.userId,
                },
              });

              if (user) {
                if (user.role === "admin" || resourceId === user.id) {
                  return identity(user, "apiKey", undefined, keyValidation.key);
                }
                return status(403);
              }
            }
          } catch (_error) {
            return status(401);
          }
        }

        return status(401);
      },
    },
    apiKeyOwnerOnly: {
      async resolve({
        status,
        request: { headers },
        params,
      }: {
        status: (code: number) => void;
        request: { headers: Headers };
        params: Record<string, string>;
      }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);

        // Admin users can access any API key
        if (session.user.role === "admin") {
          return {
            user: session.user,
            session: session.session,
          };
        }

        const apiKeyId = params.id;
        if (!apiKeyId) {
          return status(400);
        }

        // Check if API key exists and belongs to user
        const apiKey = await db.query.apikey.findFirst({
          where: {
            id: apiKeyId,
          },
        });

        if (!apiKey) {
          return status(404);
        }

        if (apiKey.userId !== session.user.id) {
          return status(403);
        }

        return {
          user: session.user,
          session: session.session,
          apiKey,
        };
      },
    },
  });
}

export const authorizationPlugin = createAuthorizationPlugin();
