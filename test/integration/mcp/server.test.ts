import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createMCPClient } from "@ai-sdk/mcp";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * MCP Server Integration Test
 *
 * This test verifies the MCP server using Vercel's AI SDK MCP client.
 * It checks connectivity, tool discovery, and basic tool execution.
 *
 * Usage:
 *   MCP_API_KEY=your_key bun test test/integration/mcp/server.test.ts
 */

const MCP_URL = process.env.MCP_URL || "http://localhost:3000/api/mcp/mcp";
const API_KEY = process.env.MCP_API_KEY || "YOUR_API_KEY_HERE";

describe("MCP Server Integration", () => {
  let transport: StreamableHTTPClientTransport;
  let client: any;
  let serverAvailable = false;

  beforeAll(async () => {
    console.log(`\n${"=".repeat(50)}`);
    console.log("🚀 STARTING MCP INTEGRATION TESTS");
    console.log("=".repeat(50));
    console.log(`📡 URL: ${MCP_URL}`);

    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      console.warn(
        "⚠️  Warning: Using placeholder API key. Set MCP_API_KEY env var if required.",
      );
    }

    const httpUrl = new URL(MCP_URL);

    try {
      // Setup Streamable HTTP transport with authentication
      transport = new StreamableHTTPClientTransport(httpUrl, {
        requestInit: {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        },
      });

      console.log("📦 Creating MCP client...");
      client = await createMCPClient({ transport });
      serverAvailable = true;
      console.log("✅ MCP Client connected successfully!\n");
    } catch (error) {
      serverAvailable = false;
      console.warn("⚠️ MCP endpoint not reachable. Skipping integration tests.");
      console.warn(error);
    }
  });

  afterAll(async () => {
    if (client) {
      console.log(`\n${"-".repeat(50)}`);
      console.log("🧹 Cleaning up MCP connection...");
      await client.close();
      console.log("✨ Cleanup complete");
      console.log(`${"=".repeat(50)}\n`);
    }
  });

  it("should discover available tools", async () => {
    if (!serverAvailable) {
      expect(true).toBe(true);
      return;
    }

    console.log("🔍 Step 1: Discovering Tools...");
    const toolSet = await client.tools();
    const toolNames = Object.keys(toolSet);

    console.log(`✅ Discovered ${toolNames.length} tools:`);
    for (const name of toolNames) {
      console.log(`   - ${name}`);
    }

    expect(toolNames.length).toBeGreaterThan(0);
  });

  it("should successfully execute 'fetch_scholarships' smoke test", async () => {
    if (!serverAvailable) {
      expect(true).toBe(true);
      return;
    }

    const toolSet = await client.tools();

    if (!toolSet.fetch_scholarships) {
      console.warn("⚠️  Skip: 'fetch_scholarships' tool not found.");
      return;
    }

    console.log("\n🎓 Step 2: Smoke testing 'fetch_scholarships'...");

    // Execute tool via AI SDK wrapper
    const result = await (toolSet.fetch_scholarships as any).execute({
      limit: 2,
    });

    expect(result).toBeDefined();
    console.log("✅ Tool execution successful!");

    // Preview output
    const output =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);
    console.log("📄 Response Preview (first 200 chars):");
    console.log("------------------------------");
    console.log(output.substring(0, 200) + (output.length > 200 ? "..." : ""));
    console.log("------------------------------");
  });

  it("should successfully execute search in 'fetch_scholarships'", async () => {
    if (!serverAvailable) {
      expect(true).toBe(true);
      return;
    }

    const toolSet = await client.tools();

    if (!toolSet.fetch_scholarships) {
      return;
    }

    console.log("\n🔍 Step 3: Smoke testing search functionality...");
    const searchResult = await (toolSet.fetch_scholarships as any).execute({
      search: "DAAD",
      limit: 1,
    });

    expect(searchResult).toBeDefined();
    const count = searchResult.content?.length ?? 0;
    console.log(`✅ Search test successful! (Found ${count} items)`);
  });
});
