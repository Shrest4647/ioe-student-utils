import { Elysia } from "elysia";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";

type Role = "user" | "admin";

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
 */
export const authorizationPlugin = new Elysia({ name: "authorization" }).macro({
  auth: {
    async resolve({ status, request: { headers } }) {
      // First try session authentication
      const session = await auth.api.getSession({ headers });
      if (session) {
        return {
          user: session.user,
          session: session.session,
          authType: "session",
        };
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
              return {
                user,
                apiKey: keyValidation.key,
                authType: "apiKey",
              };
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
            return {
              user,
              apiKey: keyValidation.key,
              authType: "apiKey",
            };
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
    async resolve({
      status,
      request: { headers },
    }: {
      status: (code: number) => void;
      request: { headers: Headers };
    }) {
      // First try session authentication
      const session = await auth.api.getSession({ headers });
      if (session) {
        if (session.user.role !== requiredRole) {
          return status(403);
        }
        return {
          user: session.user,
          session: session.session,
        };
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
              return {
                user,
                apiKey: keyValidation.key,
                authType: "apiKey",
              };
            }
          }
        } catch (_error) {
          // Invalid API key
          return status(401);
        }
      }

      return status(401);
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
      const session = await auth.api.getSession({ headers });
      if (!session) return status(401);

      // Admin users can access any resource
      if (session.user.role === "admin") {
        return {
          user: session.user,
          session: session.session,
        };
      }

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
});
