import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { rateLimit, resetRateLimitStore } from "@/server/middleware/rate-limit";

describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("enforces public read limits and returns standard headers", async () => {
    const app = new Elysia()
      .use(
        rateLimit({
          windowMs: 60_000,
          maxRequests: 2,
          mutationMaxRequests: 1,
        }),
      )
      .get("/public", () => ({ success: true }));

    const req = () =>
      new Request("http://localhost/public", {
        headers: { "x-forwarded-for": "203.0.113.1" },
      });

    const first = await app.handle(req());
    const second = await app.handle(req());
    const third = await app.handle(req());

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);

    const body = await third.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Too many requests");
    expect(third.headers.get("Retry-After")).toBeTruthy();
    expect(third.headers.get("X-RateLimit-Limit")).toBe("2");
  });

  it("applies stricter tier to mutation/admin requests", async () => {
    const app = new Elysia()
      .use(
        rateLimit({
          windowMs: 60_000,
          maxRequests: 5,
          mutationMaxRequests: 1,
        }),
      )
      .post("/admin/programs", () => ({ success: true }));

    const req = () =>
      new Request("http://localhost/admin/programs", {
        method: "POST",
        headers: {
          "x-forwarded-for": "203.0.113.2",
          authorization: "Bearer token-1",
        },
      });

    const first = await app.handle(req());
    const second = await app.handle(req());

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers.get("X-RateLimit-Limit")).toBe("1");
  });
});
