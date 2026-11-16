import crypto from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { appEnv } from "@/env";
import { validateRedirectUri } from "@/lib/mcp/redirect-uri";
import { db } from "@/server/db";
import { oauthApplication } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const mcpAppRoutes = new Elysia({ prefix: "/mcp-apps" })
  .use(authorizationPlugin)
  .onError(({ code, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false as const,
        error: "Check the application name and callback URL.",
      };
    }
  })
  .onAfterHandle(({ set }) => {
    set.headers["cache-control"] = "no-store";
  })
  // Get MCP Server endpoints & connection metadata
  .get("/info", () => {
    const baseUrl = appEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
    return {
      success: true as const,
      data: {
        serverUrl: `${baseUrl}/api/mcp/mcp`,
        protectedResourceUrl: `${baseUrl}/.well-known/oauth-protected-resource`,
        authServerUrl: `${baseUrl}/.well-known/oauth-authorization-server`,
      },
    };
  })
  // List user's registered MCP applications
  .get(
    "/",
    async ({ user, set }) => {
      try {
        const queryCondition =
          user.role === "admin"
            ? undefined
            : eq(oauthApplication.userId, user.id);

        const apps = await db
          .select({
            id: oauthApplication.id,
            name: oauthApplication.name,
            clientId: oauthApplication.clientId,
            redirectUrls: oauthApplication.redirectUrls,
            type: oauthApplication.type,
            disabled: oauthApplication.disabled,
            userId: oauthApplication.userId,
            createdAt: oauthApplication.createdAt,
            updatedAt: oauthApplication.updatedAt,
          })
          .from(oauthApplication)
          .where(queryCondition)
          .orderBy(desc(oauthApplication.createdAt));

        return {
          success: true as const,
          data: apps,
        };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching MCP apps:", error);
        return {
          success: false as const,
          error: "Failed to fetch MCP applications",
        };
      }
    },
    {
      sessionAuth: true,
      detail: {
        tags: ["MCP Apps"],
        summary: "List user's registered MCP applications",
      },
    },
  )
  // Create a new MCP OAuth application
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const redirectUri = body.redirectUrls.trim();
        const validationError = validateRedirectUri(redirectUri);
        if (body.name.trim().length < 2 || validationError) {
          set.status = 400;
          return {
            success: false as const,
            error:
              validationError ||
              "Enter an application name with at least two characters.",
          };
        }
        const id = crypto.randomUUID();
        const clientId = `mcp_${crypto.randomBytes(16).toString("hex")}`;
        const clientSecret = crypto.randomBytes(32).toString("hex");

        const [createdApp] = await db
          .insert(oauthApplication)
          .values({
            id,
            name: body.name.trim(),
            clientId,
            clientSecret,
            redirectUrls: redirectUri,
            type: "web",
            disabled: false,
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        set.status = 201;
        return {
          success: true as const,
          data: {
            id: createdApp.id,
            name: createdApp.name,
            clientId: createdApp.clientId,
            clientSecret,
            redirectUrls: createdApp.redirectUrls,
            createdAt: createdApp.createdAt,
          },
          message:
            "MCP OAuth application created successfully. Copy the Client Secret now; it will not be shown again.",
        };
      } catch (error) {
        set.status = 500;
        console.error("Error creating MCP application:", error);
        return {
          success: false as const,
          error: "Failed to create MCP application",
        };
      }
    },
    {
      sessionAuth: true,
      body: t.Object({
        name: t.String({ minLength: 2, maxLength: 100 }),
        redirectUrls: t.String({ minLength: 5, maxLength: 2048 }),
      }),
      detail: {
        tags: ["MCP Apps"],
        summary: "Register a new MCP OAuth client",
      },
    },
  )
  // Regenerate client secret
  .post(
    "/:id/regenerate-secret",
    async ({ params: { id }, user, set }) => {
      try {
        const app = await db.query.oauthApplication.findFirst({
          where: { id },
        });

        if (!app) {
          set.status = 404;
          return { success: false as const, error: "Application not found" };
        }

        if (app.userId !== user.id && user.role !== "admin") {
          set.status = 403;
          return { success: false as const, error: "Unauthorized" };
        }

        if (app.type === "public") {
          set.status = 400;
          return {
            success: false as const,
            error: "Public clients use PKCE and do not have a client secret.",
          };
        }
        const newSecret = crypto.randomBytes(32).toString("hex");

        await db
          .update(oauthApplication)
          .set({
            clientSecret: newSecret,
            updatedAt: new Date(),
          })
          .where(eq(oauthApplication.id, id));

        return {
          success: true as const,
          data: {
            clientId: app.clientId,
            clientSecret: newSecret,
          },
          message:
            "New Client Secret generated. Update your MCP client with this secret.",
        };
      } catch (error) {
        set.status = 500;
        console.error("Error regenerating secret:", error);
        return {
          success: false as const,
          error: "Failed to regenerate secret",
        };
      }
    },
    {
      sessionAuth: true,
      detail: {
        tags: ["MCP Apps"],
        summary: "Regenerate client secret for an MCP application",
      },
    },
  )
  // Delete / Revoke an MCP application
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      try {
        const app = await db.query.oauthApplication.findFirst({
          where: { id },
        });

        if (!app) {
          set.status = 404;
          return { success: false as const, error: "Application not found" };
        }

        if (app.userId !== user.id && user.role !== "admin") {
          set.status = 403;
          return { success: false as const, error: "Unauthorized" };
        }

        await db.delete(oauthApplication).where(eq(oauthApplication.id, id));

        return {
          success: true as const,
          message: "Application deleted and all associated tokens revoked",
        };
      } catch (error) {
        set.status = 500;
        console.error("Error deleting MCP application:", error);
        return {
          success: false as const,
          error: "Failed to delete application",
        };
      }
    },
    {
      sessionAuth: true,
      detail: {
        tags: ["MCP Apps"],
        summary: "Delete an MCP OAuth application",
      },
    },
  );
