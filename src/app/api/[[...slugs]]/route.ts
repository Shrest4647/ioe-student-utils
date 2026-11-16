import { elysiaApi } from "@/server/elysia";

// Export handlers for Next.js
export const GET = elysiaApi.fetch;
export const POST = elysiaApi.fetch;
export const PUT = elysiaApi.fetch;
export const PATCH = elysiaApi.fetch;
export const DELETE = elysiaApi.fetch;
export const OPTIONS = elysiaApi.fetch;

// Export type for Eden
export type App = typeof elysiaApi;
