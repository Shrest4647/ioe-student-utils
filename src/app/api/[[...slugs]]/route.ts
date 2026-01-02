import { Elysia } from "elysia";

import { auth } from "@/server/better-auth";

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

// Main API Elysia instance
const api = new Elysia({ prefix: "/api" })
  .use(betterAuthPlugin)
  .get("/", () => "👋 Hello from Elysia+Next.js + Better Auth")
  .get("/protected", ({ user }) => `Hello ${user.name}!`, {
    auth: true,
  });

// Export handlers for Next.js
export const GET = api.fetch;
export const POST = api.fetch;
export const PUT = api.fetch;
export const PATCH = api.fetch;
export const DELETE = api.fetch;

// Export type for Eden
export type App = typeof api;
