import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import {
  getOAuthPermissions,
  mcpWriteScope,
} from "@/lib/mcp/oauth-permissions";
import {
  type OAuthLookup,
  resolveOAuthAccess,
  resolveOAuthRequest,
} from "@/server/authentication/oauth-access";
import { createAuthorizationPlugin } from "@/server/elysia/plugins/authorization";
import { canUseTool } from "@/server/mcp/auth";
import { authorizeOAuthToolCall } from "@/server/mcp/authorize-tool-call";
import { extractErrorMessage } from "@/server/mcp/utils";

function fixture(
  options: {
    role?: string;
    write?: boolean;
    expired?: boolean;
    disabled?: boolean;
  } = {},
) {
  const user = {
    id: "owner",
    name: "Owner",
    email: "owner@example.com",
    role: options.role || "admin",
    emailVerified: true,
    isAnonymous: false,
    twoFactorEnabled: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const lookup: OAuthLookup = {
    findToken: async (token) =>
      token === "oauth-token"
        ? {
            userId: user.id,
            clientId: "agent-client",
            scopes: options.write ? `openid ${mcpWriteScope}` : "openid",
            accessTokenExpiresAt: new Date(
              Date.now() + (options.expired ? -10000 : 10000),
            ),
          }
        : undefined,
    findClient: async () => ({ disabled: options.disabled || false }),
    findUser: async () => user,
  };
  let writes = 0;
  const plugin = createAuthorizationPlugin((request) =>
    resolveOAuthRequest(request, lookup),
  );
  const api = new Elysia({ prefix: "/api" })
    .use(plugin)
    .post(
      "/universities/admin",
      ({ user }) => ({ success: true, createdBy: user.id, written: ++writes }),
      { role: "admin" },
    )
    .post("/departments/admin", () => ({ success: true, written: ++writes }), {
      roles: ["admin"],
    })
    .post("/programs/admin", () => ({ success: true, written: ++writes }), {
      auth: true,
    })
    .delete("/universities/admin/:id", () => ({ written: ++writes }), {
      role: "admin",
    })
    .get("/apikeys", () => ({ shouldNotReach: true }), { auth: true });
  const request = (path: string, method = "POST") =>
    api.fetch(
      new Request(`http://localhost/api${path}`, {
        method,
        headers: { Authorization: "Bearer oauth-token" },
      }),
    );
  return { api, lookup, user, request, writes: () => writes };
}

describe("Consented OAuth write access", () => {
  it("allows an administrator's write grant through auth and role REST gates", async () => {
    const app = fixture({ write: true });
    for (const path of [
      "/universities/admin",
      "/departments/admin",
      "/programs/admin",
    ]) {
      const response = await app.request(path);
      expect(response.status).toBe(200);
      expect((await response.json()).success).toBe(true);
    }
    expect(app.writes()).toBe(3);
  });
  it("preserves read-only access for existing tokens, with a useful scope error", async () => {
    const app = fixture();
    const response = await app.request("/universities/admin");
    expect(response.status).toBe(403);
    expect(response.headers.get("www-authenticate")).toContain(mcpWriteScope);
    expect((await response.json()).error).toContain("reconnect");
    expect(app.writes()).toBe(0);
  });
  it("does not turn a normal user's token into administrator authority", async () => {
    const app = fixture({ role: "user", write: true });
    expect((await app.request("/universities/admin")).status).toBe(403);
    expect(app.writes()).toBe(0);
  });
  it("uses the current role, so demotion removes write access immediately", async () => {
    const app = fixture({ write: true });
    app.user.role = "user";
    expect((await app.request("/universities/admin")).status).toBe(403);
    expect(app.writes()).toBe(0);
  });
  it("rejects expired and disabled-client tokens before write handlers", async () => {
    for (const options of [{ expired: true }, { disabled: true }]) {
      const app = fixture({ write: true, ...options });
      expect((await app.request("/universities/admin")).status).toBe(401);
      expect(app.writes()).toBe(0);
    }
  });
  it("excludes delete tools and security APIs from academic editing access", async () => {
    const app = fixture({ write: true });
    expect((await app.request("/universities/admin/id", "DELETE")).status).toBe(
      403,
    );
    expect((await app.request("/apikeys", "GET")).status).toBe(403);
    const permissions = getOAuthPermissions("admin", [mcpWriteScope]);
    expect(canUseTool("create_university", permissions)).toBe(true);
    expect(canUseTool("bulk_create_departments", permissions)).toBe(true);
    expect(canUseTool("bulk_create_programs", permissions)).toBe(true);
    expect(canUseTool("delete_university", permissions)).toBe(false);
    expect(app.writes()).toBe(0);
  });
  it("uses the same permissions at the MCP gateway and at downstream REST calls", async () => {
    const app = fixture({ write: true });
    const access = await resolveOAuthAccess("oauth-token", app.lookup);
    expect(access?.clientId).toBe("agent-client");
    expect(access?.permissions.universities).toEqual(["read", "write"]);
    expect((await app.request("/universities/admin")).status).toBe(200);
  });
  it("blocks legacy delete tools even when they implement deletion with PATCH", async () => {
    const request = new Request("http://localhost/api/mcp/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: {
          name: "bulk_delete_universities",
          arguments: { ids: ["id"] },
        },
      }),
    });
    const response = await authorizeOAuthToolCall(request, {
      token: "verified",
      clientId: "client",
      scopes: [mcpWriteScope],
      extra: {
        oauth: true,
        apiKey: { permissions: getOAuthPermissions("admin", [mcpWriteScope]) },
      },
    });
    expect(response?.status).toBe(403);
  });
  it("allows create tools with the same permission map at the gateway", async () => {
    const request = new Request("http://localhost/api/mcp/mcp", {
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: { name: "create_university" },
      }),
    });
    const response = await authorizeOAuthToolCall(request, {
      token: "verified",
      clientId: "client",
      scopes: [mcpWriteScope],
      extra: {
        oauth: true,
        apiKey: { permissions: getOAuthPermissions("admin", [mcpWriteScope]) },
      },
    });
    expect(response).toBeNull();
  });

  it("passes structured REST errors back to the agent", () => {
    expect(
      extractErrorMessage(
        { success: false, error: "Reconnect and approve editing" },
        "API failed",
      ),
    ).toBe("Reconnect and approve editing");
  });
});
