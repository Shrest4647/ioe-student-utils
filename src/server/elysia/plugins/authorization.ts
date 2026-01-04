import { Elysia } from "elysia";
import { auth } from "@/server/better-auth";

type Role = "user" | "admin";

/**
 * Authorization plugin for Elysia
 *
 * Provides reusable authentication and authorization patterns:
 * - `auth: true` - Requires authentication
 * - `role: "admin"` - Requires specific role
 * - `ownerOnly: true` - User can only access their own resources (uses `id` or `userId` param)
 * - `adminOrOwner: true` - Admin users can access any resource, or user can access their own resource
 *
 * @example
 * # Require authentication
 * .get("/profile", handler, { auth: true })
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
      const session = await auth.api.getSession({ headers });
      if (!session) return status(401);
      return {
        user: session.user,
        session: session.session,
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
      const session = await auth.api.getSession({ headers });
      if (!session) return status(401);

      if (session.user.role !== requiredRole) {
        return status(403);
      }

      return {
        user: session.user,
        session: session.session,
      };
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
