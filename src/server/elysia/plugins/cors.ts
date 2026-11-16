import { cors } from "@elysiajs/cors";
import { appEnv } from "@/env";

export const corsPlugin = cors({
  origin: (request) =>
    ["/api/auth/mcp/token", "/api/auth/mcp/register"].includes(
      new URL(request.url).pathname,
    ) ||
    request.headers.get("origin") ===
      new URL(appEnv.NEXT_PUBLIC_BASE_URL).origin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "X-Requested-With",
  ],
});
