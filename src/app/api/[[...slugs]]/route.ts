import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { auth } from "@/server/better-auth";
import { cors } from "@elysiajs/cors";
import { appEnv } from "@/env";
import { BetterAuthOpenAPI } from "@/server/better-auth/config";

const corsPlugin = cors({
  origin: appEnv.NEXT_PUBLIC_BASE_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Better Auth plugin for Elysia
const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({
          headers,
        });
        if (!session) return status(401);
        return {
          user: session.user,
          session: session.session,
        };
      },
    },
  });

const openApiPlugin = openapi({
  documentation: {
    components: await BetterAuthOpenAPI.components,
    paths: await BetterAuthOpenAPI.getPaths(),
    tags: [
      { name: "App", description: "General endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
    ],
    info: {
      title: "IOESU Documentation",
      version: "1.0.0",
    },
  },
  path: "/docs",
});

// Main API Elysia instance
const api = new Elysia({ prefix: "/api" })
  .use(corsPlugin)
  .use(betterAuthPlugin)
  .use(openApiPlugin)
  .get("/", () => "👋 Hello from Elysia+Next.js + Better Auth", {
    detail: {
      tags: ["App"],
    },
  })
  .get("/health", () => ({ status: "ok" }), {
    detail: {
      tags: ["App"],
    },
  })
  .get("/protected", ({ user }) => `Hello ${user.name}!`, {
    auth: true,
    detail: {
      tags: ["Auth"],
    },
  });

// Export handlers for Next.js
export const GET = api.fetch;
export const POST = api.fetch;
export const PUT = api.fetch;
export const PATCH = api.fetch;
export const DELETE = api.fetch;

// Export type for Eden
export type App = typeof api;
