import { openapi } from "@elysiajs/openapi";
import { BetterAuthOpenAPI } from "@/server/better-auth/config";

export const openApiPlugin = openapi({
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
