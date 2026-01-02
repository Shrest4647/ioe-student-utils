import { cors } from "@elysiajs/cors";
import { appEnv } from "@/env";

export const corsPlugin = cors({
  origin: appEnv.NEXT_PUBLIC_BASE_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});
