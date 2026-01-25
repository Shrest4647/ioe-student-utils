/**
 * MCP Server Next.js Route Handler
 *
 * This file exports the MCP handler as a Next.js route.
 * The route supports both SSE and HTTP transports.
 *
 * Route structure: /api/mcp/[transport]
 * - transport parameter allows different connection methods
 * - Handler manages both GET and POST requests
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 */

export { handler as GET, handler as POST } from "@/server/mcp/server";
