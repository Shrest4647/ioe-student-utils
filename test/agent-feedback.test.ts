import { describe, expect, it, mock } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  feedbackInputSchema,
  redactFeedbackText,
  sanitizeFeedback,
} from "@/lib/mcp/feedback";
import { canUseTool } from "@/server/mcp/auth";
import { registerAgentFeedbackTools } from "@/server/mcp/tools/agent-feedback";

const report = {
  task: "Find a study guide",
  kind: "broken" as const,
  impact: "blocked" as const,
  description: "The resource lookup failed even though the course exists.",
  operation: "fetch_resources",
};

async function connect(authInfo?: AuthInfo, fail = false) {
  const submit = mock(async () => {
    if (fail) throw new Error("simulated storage error with private data");
    return { accepted: true, id: "report-id", message: "Received" };
  });
  const list = mock(async () => ({
    reports: [],
    total: 0,
    limit: 25,
    offset: 0,
  }));
  const server = new McpServer({ name: "Feedback test", version: "1.0.0" });
  registerAgentFeedbackTools(server, { submit, list });
  const client = new Client({ name: "Test agent", version: "2.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const send = clientTransport.send.bind(clientTransport);
  clientTransport.send = (message, options) =>
    send(message, { ...options, authInfo });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, submit, list };
}

describe("Agent feedback privacy and validation", () => {
  it("redacts credentials in every free-text field", () => {
    const sensitive =
      "Authorization: Bearer raw-secret client_secret=abcdef ik_mykey123 sk_test_otherkey123 user@example.com https://user:pass@example.com token eyJabc.abc.def";
    const cleaned = sanitizeFeedback({
      ...report,
      task: sensitive.slice(0, 200),
      description: sensitive,
      operation: "ik_private",
      error: sensitive,
      suggestion: sensitive,
    });
    const json = JSON.stringify(cleaned);
    for (const secret of [
      "raw-secret",
      "abcdef",
      "ik_mykey123",
      "otherkey123",
      "user@example.com",
      "user:pass",
      "eyJabc.abc.def",
      "ik_private",
    ])
      expect(json).not.toContain(secret);
  });
  it("preserves useful errors and rejects oversized or empty reports", () => {
    expect(
      redactFeedbackText("fetch_resources returned 404 for a known course"),
    ).toContain("returned 404");
    expect(
      feedbackInputSchema.safeParse({
        ...report,
        description: "x".repeat(4001),
      }).success,
    ).toBe(false);
    expect(
      feedbackInputSchema.safeParse({ ...report, task: "  " }).success,
    ).toBe(false);
  });
  it("allows feedback from existing read-only permissions without allowing review", () => {
    expect(canUseTool("submit_feedback", { scholarships: ["read"] })).toBe(
      true,
    );
    expect(canUseTool("list_agent_feedback", { scholarships: ["read"] })).toBe(
      false,
    );
    expect(canUseTool("list_agent_feedback", { mcp_feedback: ["read"] })).toBe(
      true,
    );
  });
});

describe("Agent feedback over MCP", () => {
  it("rejects unauthenticated submissions without reaching storage", async () => {
    const { client, submit } = await connect();
    try {
      const result = await client.callTool({
        name: "submit_feedback",
        arguments: report,
      });
      expect(result.isError).toBe(true);
      expect(submit).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });
  it("uses verified OAuth identity and negotiated client metadata", async () => {
    const { client, submit } = await connect({
      token: "verified-oauth",
      clientId: "oauth-client",
      scopes: [],
      extra: { oauth: true, apiKey: { userId: "owner" } },
    });
    try {
      const result = await client.callTool({
        name: "submit_feedback",
        arguments: {
          ...report,
          userId: "spoofed-user",
          clientId: "spoofed-client",
        },
      });
      expect(result.isError).not.toBe(true);
      expect(submit).toHaveBeenCalledWith(report, {
        userId: "owner",
        clientId: "oauth-client",
        apiKeyId: undefined,
        agentName: "Test agent",
        agentVersion: "2.0",
      });
    } finally {
      await client.close();
    }
  });
  it("does not let ordinary users read other agents' reports", async () => {
    const { client, list } = await connect({
      token: "read-only-key",
      clientId: "user",
      scopes: [],
      extra: {
        apiKey: {
          id: "key-id",
          userId: "owner",
          permissions: { resources: ["read"] },
        },
      },
    });
    try {
      const result = await client.callTool({
        name: "list_agent_feedback",
        arguments: {},
      });
      expect(result.isError).toBe(true);
      expect(list).not.toHaveBeenCalled();
    } finally {
      await client.close();
    }
  });
  it("tells agents not to retry storage failures and does not leak internal errors", async () => {
    const { client } = await connect(
      {
        token: "key",
        clientId: "owner",
        scopes: [],
        extra: { apiKey: { userId: "owner", permissions: {} } },
      },
      true,
    );
    try {
      const result = await client.callTool({
        name: "submit_feedback",
        arguments: report,
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).toContain("Do not retry");
      expect(JSON.stringify(result)).not.toContain("private data");
    } finally {
      await client.close();
    }
  });
});
