import { Elysia } from "elysia";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, maxRequests } = options;

  const plugin = new Elysia({ name: "rate-limit" });

  plugin.onBeforeHandle(({ request, set }) => {
    // Use x-forwarded-for for IP, fallback to "unknown" for local requests
    // In production, use the actual client IP from connection info
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor || realIp || "unknown";

    const now = Date.now();
    const store = rateLimitStore.get(ip);

    // Debug logging
    console.log(
      `[RateLimit] IP: ${ip}, Store: ${store ? JSON.stringify(store) : "null"}`,
    );

    if (!store || now > store.resetTime) {
      // Create new window
      const newStore = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(ip, newStore);

      console.log(
        `[RateLimit] New window created: ${JSON.stringify(newStore)}`,
      );

      // Set rate limit headers
      set.headers["X-RateLimit-Limit"] = maxRequests.toString();
      set.headers["X-RateLimit-Remaining"] = (maxRequests - 1).toString();
      set.headers["X-RateLimit-Reset"] = new Date(now + windowMs).toISOString();

      return;
    }

    // Increment counter
    store.count++;

    console.log(
      `[RateLimit] Incremented count to: ${store.count}, max: ${maxRequests}`,
    );

    if (store.count > maxRequests) {
      console.log(`[RateLimit] BLOCKED - Exceeded limit!`);

      // Rate limit exceeded - return 429 response
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(store.resetTime).toISOString(),
            "Retry-After": Math.ceil((store.resetTime - now) / 1000).toString(),
          },
        },
      );
    }

    // Set rate limit headers
    set.headers["X-RateLimit-Limit"] = maxRequests.toString();
    set.headers["X-RateLimit-Remaining"] = (
      maxRequests - store.count
    ).toString();
    set.headers["X-RateLimit-Reset"] = new Date(store.resetTime).toISOString();
  });

  return plugin;
};

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, store] of rateLimitStore.entries()) {
    if (now > store.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Cleanup every minute

// Helper function to reset the store (useful for testing)
export const resetRateLimitStore = () => {
  rateLimitStore.clear();
};
