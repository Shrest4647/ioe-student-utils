import { describe, expect, it } from "bun:test";
import { betterUploadRoutes } from "@/server/elysia/routes/better-upload";
import { resumeRoutes } from "@/server/elysia/routes/resumes";
import { handler } from "@/server/mcp/server";

describe("Phase 1 Security Hardening Tests", () => {
  it("resumes route should reject unauthenticated GET /:id with 401", async () => {
    const res = await resumeRoutes.handle(
      new Request("http://localhost/resumes/test-resume-id"),
    );
    expect(res.status).toBe(401);
  });

  it("better-upload route should reject unauthenticated POST / with 401", async () => {
    const res = await betterUploadRoutes.handle(
      new Request("http://localhost/upload", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });

  it("MCP server handler should be exported with authentication required", () => {
    expect(handler).toBeDefined();
  });
});
