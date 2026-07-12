import { describe, expect, it } from "bun:test";
import { canUseTool, TOOL_PERMISSIONS } from "@/server/mcp/auth";

describe("Quiz MCP permissions", () => {
  it("registers quiz tools in permission map", () => {
    expect(TOOL_PERMISSIONS.fetch_quizzes).toBeDefined();
    expect(TOOL_PERMISSIONS.create_quiz).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_upsert_quiz_content).toBeDefined();
  });

  it("allows read access for fetch_quizzes with read scope", () => {
    const allowed = canUseTool("fetch_quizzes", { quizzes: ["read"] });
    expect(allowed).toBe(true);
  });
});
