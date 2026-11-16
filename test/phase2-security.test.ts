import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { canUseTool, TOOL_PERMISSIONS } from "@/server/mcp/auth";
import { rateLimit, resetRateLimitStore } from "@/server/middleware/rate-limit";

describe("Phase 2 Security Hardening Tests", () => {
  describe("SEC-05: MCP Default-Deny and Tool Permissions", () => {
    it("should deny access to any unmapped tool (Default-Deny)", () => {
      // Even with wildcard permission, unknown tools must be denied
      expect(canUseTool("non_existent_dangerous_tool", { "*": ["*"] })).toBe(
        false,
      );
      expect(canUseTool("arbitrary_eval_tool", { admin: ["*"] })).toBe(false);
    });

    it("should enforce correct permissions for newly mapped tools", () => {
      // College tools
      expect(canUseTool("fetch_colleges", { colleges: ["read"] })).toBe(true);
      expect(canUseTool("create_college", { colleges: ["read"] })).toBe(false);
      expect(canUseTool("create_college", { colleges: ["write"] })).toBe(true);
      expect(canUseTool("delete_college", { colleges: ["write"] })).toBe(false);
      expect(canUseTool("delete_college", { colleges: ["delete"] })).toBe(true);

      // Academic tools
      expect(canUseTool("fetch_programs", { programs: ["read"] })).toBe(true);
      expect(canUseTool("delete_program", { programs: ["read"] })).toBe(false);
      expect(canUseTool("delete_program", { programs: ["delete"] })).toBe(true);

      // Ratings tools
      expect(canUseTool("fetch_rating_categories", { ratings: ["read"] })).toBe(
        true,
      );
      expect(canUseTool("delete_rating_category", { ratings: ["read"] })).toBe(
        false,
      );
      expect(
        canUseTool("delete_rating_category", { ratings: ["delete"] }),
      ).toBe(true);
    });

    it("should have comprehensive TOOL_PERMISSIONS definitions", () => {
      expect(Object.keys(TOOL_PERMISSIONS).length).toBeGreaterThan(70);
    });
  });

  describe("SEC-07: Rate Limiter Client IP Sanitization", () => {
    it("parses client IP correctly from multi-value X-Forwarded-For", async () => {
      resetRateLimitStore();

      const app = new Elysia()
        .use(
          rateLimit({
            windowMs: 60_000,
            maxRequests: 2,
          }),
        )
        .get("/test", () => ({ ok: true }));

      // Send requests with multi-hop X-Forwarded-For header
      const makeReq = () =>
        new Request("http://localhost/test", {
          headers: {
            "x-forwarded-for": "198.51.100.5, 10.0.0.1, 192.168.1.1",
          },
        });

      const r1 = await app.handle(makeReq());
      const r2 = await app.handle(makeReq());
      const r3 = await app.handle(makeReq());

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(429); // Exceeded 2 requests limit
    });
  });
});
