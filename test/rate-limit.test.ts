import { beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { rateLimit, resetRateLimitStore } from "@/server/middleware/rate-limit";

describe("Rate Limit Middleware", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it("enforces read limits and returns standard headers", async () => {
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

  it("enforces mutation limits", async () => {
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
  it("uses the read quota for authenticated admin GET and HEAD requests", async () => {
    const app = new Elysia()
      .use(
        rateLimit({
          windowMs: 60_000,
          maxRequests: 2,
          mutationMaxRequests: 1,
          postMaxRequests: 1,
        }),
      )
      .get("/admin/items", () => "ok")
      .head("/admin/items", () => new Response(null));
    const request = (method: string) =>
      new Request("http://localhost/admin/items", {
        method,
        headers: { Authorization: "Bearer read-token" },
      });
    const first = await app.handle(request("GET"));
    const second = await app.handle(request("HEAD"));
    const third = await app.handle(request("GET"));
    expect(first.headers.get("X-RateLimit-Limit")).toBe("2");
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
  });

  it("keeps POST, read, and other mutation quotas independent for the same credential", async () => {
    const app = new Elysia()
      .use(
        rateLimit({
          windowMs: 60_000,
          maxRequests: 1,
          mutationMaxRequests: 1,
          postMaxRequests: 2,
        }),
      )
      .get("/items", () => "read")
      .post("/items", () => "created")
      .patch("/items", () => "updated");
    const request = (method: string) =>
      new Request("http://localhost/items", {
        method,
        headers: { Authorization: "Bearer shared-token" },
      });
    expect((await app.handle(request("GET"))).status).toBe(200);
    expect((await app.handle(request("GET"))).status).toBe(429);
    const firstPost = await app.handle(request("POST"));
    expect(firstPost.status).toBe(200);
    expect(firstPost.headers.get("X-RateLimit-Limit")).toBe("2");
    expect((await app.handle(request("POST"))).status).toBe(200);
    expect((await app.handle(request("POST"))).status).toBe(429);
    expect((await app.handle(request("PATCH"))).status).toBe(200);
    expect((await app.handle(request("PATCH"))).status).toBe(429);
  });
});
