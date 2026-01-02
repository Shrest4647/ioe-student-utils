import { Elysia } from "elysia";
import { betterAuthPlugin } from "./plugins/better-auth";
import { corsPlugin } from "./plugins/cors";
import { openApiPlugin } from "./plugins/openapi";

export const elysiaApi = new Elysia({ prefix: "/api" })
  .use(corsPlugin)
  .use(betterAuthPlugin)
  .use(openApiPlugin)
  .get("/", () => "👋 Hello from IOESU", {
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

export type App = typeof elysiaApi;
