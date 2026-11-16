import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { appEnv } from "@/env";
import { auth } from "@/server/better-auth";
import { corsPlugin } from "@/server/elysia/plugins/cors";
import { academicEventsRoutes } from "@/server/elysia/routes/academic-events";
import { departmentRoutes } from "@/server/elysia/routes/departments";
import { resourceRoutes } from "@/server/elysia/routes/resources";
import { studyPlansRoutes } from "@/server/elysia/routes/study-plans";

describe("Phase 3 Security and Inconsistency Fixes", () => {
  describe("SEC-08: CORS Configuration", () => {
    it("includes PATCH and custom headers in CORS preflight response", async () => {
      const app = new Elysia()
        .use(corsPlugin)
        .get("/test", () => ({ ok: true }));

      const res = await app.handle(
        new Request("http://localhost/test", {
          method: "OPTIONS",
          headers: {
            Origin: appEnv.NEXT_PUBLIC_BASE_URL,
            "Access-Control-Request-Method": "PATCH",
            "Access-Control-Request-Headers": "x-api-key, X-Requested-With",
          },
        }),
      );

      expect(res.status).toBe(204);
      const allowMethods = res.headers.get("access-control-allow-methods");
      const allowHeaders = res.headers.get("access-control-allow-headers");
      expect(allowMethods).toContain("PATCH");
      expect(allowHeaders?.toLowerCase()).toContain("x-api-key");
    });
  });

  describe("SEC-09: Academic Events Date Range Queries", () => {
    it("rejects unauthenticated requests to GET /academic-events", async () => {
      const res = await academicEventsRoutes.handle(
        new Request(
          "http://localhost/academic-events?startDate=2026-01-01&endDate=2026-12-31",
        ),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("SEC-10: Resources isFeatured & Pagination", () => {
    it("rejects unauthenticated requests to PUT /resources/:id", async () => {
      const res = await resourceRoutes.handle(
        new Request("http://localhost/resources/res-123", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFeatured: true }),
        }),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("SEC-12: Better Auth GitHub OAuth Callback", () => {
    it("uses NEXT_PUBLIC_BASE_URL for GitHub OAuth redirectURI instead of hardcoded URL", () => {
      const githubOptions = (
        auth.options.socialProviders as Record<string, any>
      )?.github;
      expect(githubOptions?.redirectURI).toBe(
        `${appEnv.NEXT_PUBLIC_BASE_URL}/api/auth/callback/github`,
      );
    });
  });

  describe("INC-01 & INC-02: Route Deduplication", () => {
    it("studyPlansRoutes does not have legacy /create route", () => {
      const routes = studyPlansRoutes.routes.map((r) => r.path);
      expect(routes).not.toContain("/study-plans/create");
      expect(routes).toContain("/study-plans/");
    });

    it("departmentRoutes does not contain duplicated top-level ratings or admin category routes", () => {
      const routes = departmentRoutes.routes.map((r) => r.path);
      expect(routes).not.toContain("/departments/ratings");
      expect(routes).not.toContain("/departments/admin/categories");
      expect(routes).toContain("/departments/:id/ratings");
    });
  });

  describe("INC-04: Authorization Plugin adminOrOwner Support", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const { authorizationPlugin } = await import(
        "@/server/elysia/plugins/authorization"
      );
      const app = new Elysia()
        .use(authorizationPlugin)
        .get("/user/:id/profile", ({ user }) => ({ user }), {
          adminOrOwner: true,
        });

      const res = await app.handle(
        new Request("http://localhost/user/target-id/profile"),
      );
      expect(res.status).toBe(401);
    });
  });
});
