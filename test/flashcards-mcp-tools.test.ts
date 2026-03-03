import { describe, expect, it } from "bun:test";
import { canUseTool, TOOL_PERMISSIONS } from "@/server/mcp/auth";

describe("Flashcard MCP permissions", () => {
  it("registers flashcard tools in permission map", () => {
    expect(TOOL_PERMISSIONS.fetch_flashcard_decks).toBeDefined();
    expect(TOOL_PERMISSIONS.create_flashcard_deck).toBeDefined();
    expect(TOOL_PERMISSIONS.bulk_upsert_flashcard_content).toBeDefined();
  });

  it("allows read access for fetch_flashcard_decks with read scope", () => {
    const allowed = canUseTool("fetch_flashcard_decks", {
      flashcards: ["read"],
    });
    expect(allowed).toBe(true);
  });
});
