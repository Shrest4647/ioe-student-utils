import { describe, expect, it, spyOn } from "bun:test";
import { Elysia } from "elysia";
import { auth } from "@/server/better-auth";
import { agentFeedbackRoutes } from "@/server/elysia/routes/agent-feedback";

const api = new Elysia({ prefix: "/api" }).use(agentFeedbackRoutes);

describe("Agent feedback REST access", () => {
  it("rejects anonymous inbox access without reaching storage", async () => {
    const response = await api.fetch(
      new Request("http://localhost/api/agent-feedback"),
    );
    expect(response.status).toBe(401);
  });
  it("rejects ordinary signed-in users from reading and changing reports", async () => {
    const session = spyOn(auth.api, "getSession").mockResolvedValue({
      user: { id: "ordinary-user", role: "user" },
      session: { id: "session" },
    } as never);
    try {
      const read = await api.fetch(
        new Request("http://localhost/api/agent-feedback"),
      );
      expect(read.status).toBe(403);
      const update = await api.fetch(
        new Request(
          "http://localhost/api/agent-feedback/00000000-0000-4000-8000-000000000001",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "resolved" }),
          },
        ),
      );
      expect(update.status).toBe(403);
    } finally {
      session.mockRestore();
    }
  });
  it("rejects invalid filters before querying storage", async () => {
    const session = spyOn(auth.api, "getSession").mockResolvedValue({
      user: { id: "admin-user", role: "admin" },
      session: { id: "session" },
    } as never);
    try {
      for (const query of ["limit=1.5", "offset=-1", "status=unknown"]) {
        const response = await api.fetch(
          new Request(`http://localhost/api/agent-feedback?${query}`),
        );
        expect(response.status).toBe(400);
        expect((await response.json()).success).toBe(false);
      }
    } finally {
      session.mockRestore();
    }
  });

  it("does not expose an anonymous report submission route", async () => {
    const response = await api.fetch(
      new Request("http://localhost/api/agent-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: "anonymous" }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
