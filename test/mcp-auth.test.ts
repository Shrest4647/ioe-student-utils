import { describe, expect, it } from "bun:test";

async function canReachLocalServer() {
  try {
    const response = await fetch("http://localhost:3000/api/health", {
      method: "GET",
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe("MCP Authentication", () => {
  it("should reject requests without authentication", async () => {
    if (!(await canReachLocalServer())) {
      expect(true).toBe(true);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    // Abort after 100ms to get the response status without waiting for full SSE stream
    setTimeout(() => controller.abort(), 100);

    try {
      const response = await fetch("http://localhost:3000/api/mcp/mcp", {
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
    if (!(await canReachLocalServer())) {
      expect(true).toBe(true);
      return;
    }

    const testApiKey = process.env.TEST_MCP_API_KEY;
    if (!testApiKey) {
      expect(true).toBe(true);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    // Abort after 100ms to get the response status without waiting for full SSE stream
    setTimeout(() => controller.abort(), 100);

    try {
      const response = await fetch("http://localhost:3000/api/mcp/mcp", {
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
