import { beforeAll, describe, expect, it } from "bun:test";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

describe("MCP Authentication", () => {
  let testApiKey: string;

  beforeAll(async () => {
    // Create test user and API key with unique email
    const uniqueId = crypto.randomUUID();
    const testUser = await db
      .insert(user)
      .values({
        id: uniqueId,
        email: `mcp-test-${uniqueId}@example.com`,
        name: "MCP Test User",
        role: "user",
      })
      .returning();

    const key = await auth.api.createApiKey({
      body: {
        name: "Test MCP Key",
        userId: testUser[0].id,
        permissions: { scholarships: ["read"] },
      },
    });

    testApiKey = key.key;
  });

  it("should reject requests without authentication", async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Abort after 100ms to get the response status without waiting for full SSE stream
    setTimeout(() => controller.abort(), 100);

    try {
      const response = await fetch("http://localhost:3000/api/mcp/sse", {
        method: "GET",
        signal,
      });

      // With required: false, returns 200
      // With required: true, should return 401
      expect(response.status).toBe(401);
    } catch (error) {
      // If aborted, we should have gotten the headers already
      if ((error as Error).name === "AbortError") {
        // Request was in progress - this means it wasn't rejected with 401 immediately
        // This is a failure since we expect 401
        throw new Error(
          "Request was not rejected with 401 - connection was established",
        );
      }
      throw error;
    }
  });

  it("should accept requests with valid API key", async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    // Abort after 100ms to get the response status without waiting for full SSE stream
    setTimeout(() => controller.abort(), 100);

    try {
      const response = await fetch("http://localhost:3000/api/mcp/sse", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${testApiKey}`,
        },
        signal,
      });

      expect(response.status).not.toBe(401);
      expect(response.status).toBe(200);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        throw error;
      }
      // AbortError is OK - it means connection was established (200)
    }
  });
});
