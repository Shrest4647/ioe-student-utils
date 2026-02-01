import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { rateLimit, resetRateLimitStore } from "@/server/middleware/rate-limit";

describe("Rate Limiting", () => {
  let app: Elysia;

  beforeAll(() => {
    // Create a test app with rate limiting
    app = new Elysia()
      .use(rateLimit({ windowMs: 60000, maxRequests: 10 })) // 10 requests per minute
      .get("/test", () => ({ success: true, message: "Hello" }));
  });

  beforeEach(() => {
    // Reset the rate limit store before each test
    resetRateLimitStore();
  });

  it("should allow requests within rate limit", async () => {
    // Make 5 requests (well within limit of 10)
    for (let i = 0; i < 5; i++) {
      const response = await app.handle(new Request("http://localhost/test"));
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  it("should block requests exceeding rate limit", async () => {
    // Make requests sequentially to test rate limit
    let blockedCount = 0;
    const totalRequests = 15; // Exceeds limit of 10

    for (let i = 0; i < totalRequests; i++) {
      const response = await app.handle(new Request("http://localhost/test"));
      if (response.status === 429) {
        blockedCount++;
      }
    }

    // At least some requests should be rate limited
    expect(blockedCount).toBeGreaterThan(0);
  });

  it("should return 429 with error message when rate limited", async () => {
    let rateLimitedResponse: Response | null = null;

    // Send requests until we get rate limited
    for (let i = 0; i < 15; i++) {
      const response = await app.handle(new Request("http://localhost/test"));
      if (response.status === 429) {
        rateLimitedResponse = response;
        break;
      }
    }

    expect(rateLimitedResponse).not.toBeNull();
    expect(rateLimitedResponse?.status).toBe(429);

    const body = await rateLimitedResponse?.json();
    expect(body?.success).toBe(false);
    expect(body?.error).toBe("Too many requests");
  });

  it("should reset rate limit after window expires", async () => {
    // Create a test app with a short window (100ms)
    const testApp = new Elysia()
      .use(rateLimit({ windowMs: 100, maxRequests: 3 })) // 3 requests per 100ms
      .get("/test", () => ({ success: true }));

    // Exhaust the rate limit
    let blocked = false;
    for (let i = 0; i < 5; i++) {
      const response = await testApp.handle(
        new Request("http://localhost/test"),
      );
      if (response.status === 429) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Should be able to make requests again
    const response = await testApp.handle(new Request("http://localhost/test"));
    expect(response.status).toBe(200);
  });

  it("should include rate limit headers in 429 response", async () => {
    let rateLimitedResponse: Response | null = null;

    // Send requests until we get rate limited
    for (let i = 0; i < 15; i++) {
      const response = await app.handle(new Request("http://localhost/test"));
      if (response.status === 429) {
        rateLimitedResponse = response;
        break;
      }
    }

    expect(rateLimitedResponse).not.toBeNull();

    // Check rate limit headers on the 429 response
    expect(rateLimitedResponse?.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(rateLimitedResponse?.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(rateLimitedResponse?.headers.get("Retry-After")).toBeTruthy();
  });
});
