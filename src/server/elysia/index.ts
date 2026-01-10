import { Elysia } from "elysia";
import { authorizationPlugin } from "./plugins/authorization";
import { betterAuthPlugin } from "./plugins/better-auth";
import { corsPlugin } from "./plugins/cors";
import { openApiPlugin } from "./plugins/openapi";
import { courseRoutes, programRoutes } from "./routes/programs";
import { resourceRoutes } from "./routes/resources";
import { scholarshipRoutes } from "./routes/scholarships";
import {
  collegeRoutes,
  departmentRoutes,
  ratingRoutes,
  universityRoutes,
} from "./routes/universities";
import { userRoutes } from "./routes/user";

export const elysiaApi = new Elysia({ prefix: "/api" })
  .use(corsPlugin)
  .use(betterAuthPlugin)
  .use(authorizationPlugin)
  .use(openApiPlugin)
  .use(userRoutes)
  .use(resourceRoutes)
  .use(scholarshipRoutes)
  .use(universityRoutes)
  .use(collegeRoutes)
  .use(departmentRoutes)
  .use(ratingRoutes)
  .use(programRoutes)
  .use(courseRoutes)
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
