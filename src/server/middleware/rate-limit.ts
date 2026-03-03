import { Elysia } from "elysia";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  mutationMaxRequests?: number;
}

export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, mutationMaxRequests } = options;

  const plugin = new Elysia({ name: "rate-limit" });

  plugin.onRequest(({ request, set }) => {
    if (request.method === "OPTIONS") {
      return;
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const isAdminPath = pathname.includes("/admin");
    const isMutationMethod = !["GET", "HEAD"].includes(request.method);
    const hasAuthToken =
      !!request.headers.get("authorization") ||
      !!request.headers.get("x-api-key");

    const isStrictTier = isAdminPath || isMutationMethod || hasAuthToken;
    const activeMax =
      isStrictTier && mutationMaxRequests ? mutationMaxRequests : maxRequests;

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor || realIp || "unknown-ip";
    const actorKey =
      request.headers.get("authorization") ||
      request.headers.get("x-api-key") ||
      ip;
    const key = `${isStrictTier ? "strict" : "public"}:${actorKey}`;

    const now = Date.now();
    const store = rateLimitStore.get(key);

    if (!store || now > store.resetTime) {
      const newStore = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, newStore);

      set.headers["X-RateLimit-Limit"] = activeMax.toString();
      set.headers["X-RateLimit-Remaining"] = Math.max(
        activeMax - 1,
        0,
      ).toString();
      set.headers["X-RateLimit-Reset"] = new Date(now + windowMs).toISOString();

      return;
    }

    store.count++;

    if (store.count > activeMax) {
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": activeMax.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(store.resetTime).toISOString(),
            "Retry-After": Math.ceil((store.resetTime - now) / 1000).toString(),
          },
        },
      );
    }

    set.headers["X-RateLimit-Limit"] = activeMax.toString();
    set.headers["X-RateLimit-Remaining"] = (activeMax - store.count).toString();
    set.headers["X-RateLimit-Reset"] = new Date(store.resetTime).toISOString();
  });

  return plugin;
};

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
