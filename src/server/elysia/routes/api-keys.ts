import { Elysia, t } from "elysia";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { authorizationPlugin } from "../plugins/authorization";

/**
 * API Key management routes
 */

export const apiKeyRoutes = new Elysia({ prefix: "/api-keys" })
  .use(authorizationPlugin)
  // List user's API keys
  .get(
    "/",
    async ({ user: currentUser }) => {
      const userApiKeys = await db.query.apikey.findMany({
        where: {
          userId: currentUser.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        columns: {
          id: true,
          name: true,
          prefix: true,
          start: true,
          enabled: true,
          rateLimitEnabled: true,
          rateLimitMax: true,
          remaining: true,
          expiresAt: true,
          lastRequest: true,
          permissions: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        data: userApiKeys,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["API Keys"],
        summary: "List user's API keys",
      },
    },
  )
  // Create new API key
  .post(
    "/",
    async ({ user: currentUser, body }) => {
      const { name, expiresIn, permissions, metadata } = body;

      const apiKey = await auth.api.createApiKey({
        body: {
          name,
          expiresIn,
          userId: currentUser.id,
          permissions: permissions as Record<string, string[]> | undefined,
          metadata,
        },
      });

      return {
        success: true,
        data: apiKey,
      };
    },
    {
      auth: true,
      body: t.Object({
        name: t.String(),
        expiresIn: t.Optional(t.Number()),
        permissions: t.Optional(t.Record(t.String(), t.Array(t.String()))),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ["API Keys"],
        summary: "Create new API key",
      },
    },
  )
  // Get specific API key
  .get(
    "/:id",
    async ({ user: currentUser, params }) => {
      const { id } = params;

      const apiKey = await db.query.apikey.findFirst({
        where: {
          id,
          userId: currentUser.id,
        },
        columns: {
          id: true,
          name: true,
          prefix: true,
          start: true,
          enabled: true,
          rateLimitEnabled: true,
          rateLimitMax: true,
          remaining: true,
          expiresAt: true,
          lastRequest: true,
          permissions: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!apiKey) {
        return {
          success: false,
          error: {
            code: "API_KEY_NOT_FOUND",
            message: "API key not found",
          },
        };
      }

      return {
        success: true,
        data: apiKey,
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["API Keys"],
        summary: "Get API key details",
      },
    },
  )
  // Update API key
  .put(
    "/:id",
    async ({ user: currentUser, body, params }) => {
      const { id } = params;
      const { name, enabled, permissions, metadata } = body;

      const existingKey = await db.query.apikey.findFirst({
        where: {
          id,
        },
      });

      if (!existingKey) {
        return {
          success: false,
          error: {
            code: "API_KEY_NOT_FOUND",
            message: "API key not found",
          },
        };
      }

      if (
        currentUser.role !== "admin" &&
        existingKey.userId !== currentUser.id
      ) {
        return {
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "You can only update your own API keys",
          },
        };
      }

      const updatedKey = await auth.api.updateApiKey({
        body: {
          keyId: id,
          name,
          enabled,
          permissions: permissions as Record<string, string[]> | undefined,
          metadata,
        },
      });

      return {
        success: true,
        data: updatedKey,
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        permissions: t.Optional(t.Record(t.String(), t.Array(t.String()))),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      detail: {
        tags: ["API Keys"],
        summary: "Update API key",
      },
    },
  )
  // Delete API key
  .delete(
    "/:id",
    async ({ user: currentUser, params }) => {
      const { id } = params;

      const existingKey = await db.query.apikey.findFirst({
        where: {
          id,
        },
      });

      if (!existingKey) {
        return {
          success: false,
          error: {
            code: "API_KEY_NOT_FOUND",
            message: "API key not found",
          },
        };
      }

      if (
        currentUser.role !== "admin" &&
        existingKey.userId !== currentUser.id
      ) {
        return {
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "You can only delete your own API keys",
          },
        };
      }

      await auth.api.deleteApiKey({
        body: {
          keyId: id,
        },
      });

      return {
        success: true,
        data: { id },
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["API Keys"],
        summary: "Delete API key",
      },
    },
  )
  // Regenerate API key
  .post(
    "/:id/regenerate",
    async ({ user: currentUser, params }) => {
      const { id } = params;

      const existingKey = await db.query.apikey.findFirst({
        where: {
          id,
        },
      });

      if (!existingKey) {
        return {
          success: false,
          error: {
            code: "API_KEY_NOT_FOUND",
            message: "API key not found",
          },
        };
      }

      if (
        currentUser.role !== "admin" &&
        existingKey.userId !== currentUser.id
      ) {
        return {
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "You can only regenerate your own API keys",
          },
        };
      }

      const newApiKey = await auth.api.createApiKey({
        body: {
          name:
            existingKey.name ?? `Regenerated Key (${new Date().toISOString()})`,
          expiresIn: existingKey.expiresAt
            ? Math.floor((existingKey.expiresAt.getTime() - Date.now()) / 1000)
            : undefined,
          userId: existingKey.userId,
          permissions: existingKey.permissions
            ? (JSON.parse(existingKey.permissions) as Record<string, string[]>)
            : undefined,
          metadata: existingKey.metadata
            ? (JSON.parse(existingKey.metadata) as Record<string, any>)
            : undefined,
        },
      });

      await auth.api.deleteApiKey({
        body: {
          keyId: id,
        },
      });

      return {
        success: true,
        data: newApiKey,
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["API Keys"],
        summary: "Regenerate API key",
      },
    },
  );
