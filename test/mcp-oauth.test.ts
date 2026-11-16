import { describe, expect, it } from "bun:test";
import { GET as getAuthorizationServer } from "@/app/.well-known/oauth-authorization-server/route";
import { GET as getProtectedResource } from "@/app/.well-known/oauth-protected-resource/route";
import { appEnv } from "@/env";
import { handler } from "@/server/mcp/server";

describe("MCP OAuth 2.0 Production Integration Tests", () => {
  describe("RFC 9728: Protected Resource Metadata", () => {
    it("returns correct protected resource metadata with CORS headers", async () => {
      const req = new Request(
        "http://localhost/.well-known/oauth-protected-resource",
      );
      const res = await getProtectedResource(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
      expect(res.headers.get("content-type")).toContain("application/json");

      const body = await res.json();
      expect(body.resource).toContain("/api/mcp/mcp");
      expect(body.authorization_servers).toContain(appEnv.NEXT_PUBLIC_BASE_URL);
    });
  });

  describe("RFC 8414: OAuth 2.0 Authorization Server Metadata", () => {
    it("returns OAuth 2.0 discovery metadata with valid endpoints", async () => {
      const res = await getAuthorizationServer();

      expect(res.status).toBe(200);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");

      const body = await res.json();
      expect(body.issuer).toBe(appEnv.NEXT_PUBLIC_BASE_URL);
      expect(body.authorization_endpoint).toBe(
        `${appEnv.NEXT_PUBLIC_BASE_URL}/api/auth/mcp/authorize`,
      );
      expect(body.token_endpoint).toBe(
        `${appEnv.NEXT_PUBLIC_BASE_URL}/api/auth/mcp/token`,
      );
      expect(body.userinfo_endpoint).toBeUndefined();
      expect(body.jwks_uri).toBeUndefined();
      expect(body.response_types_supported).toContain("code");
      expect(body.code_challenge_methods_supported).toContain("S256");
      expect(body.grant_types_supported).toContain("authorization_code");
    });
  });

  describe("MCP Server Handler Authentication Gateway", () => {
    it("rejects unauthenticated requests with 401 and resource_metadata in WWW-Authenticate header", async () => {
      const res = await handler(
        new Request("http://localhost/api/mcp/mcp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list",
          }),
        }),
      );

      expect(res.status).toBe(401);
      const authHeader = res.headers.get("www-authenticate");
      expect(authHeader).toBeDefined();
      expect(authHeader).toContain("Bearer");
      expect(authHeader).toContain(
        `resource_metadata="${new URL(appEnv.NEXT_PUBLIC_BASE_URL).origin}/.well-known/oauth-protected-resource"`,
      );
      expect(res.headers.get("access-control-expose-headers")).toContain(
        "WWW-Authenticate",
      );
    });
  });

  it("accepts unauthenticated browser preflight", async () => {
    const response = await handler(
      new Request("http://localhost/api/mcp/mcp", { method: "OPTIONS" }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("allows external OAuth preflight and runs registration guards through the REST mount", async () => {
    const { elysiaApi } = await import("@/server/elysia");
    const preflight = await elysiaApi.fetch(
      new Request("http://localhost/api/auth/mcp/token", {
        method: "OPTIONS",
        headers: {
          Origin: "https://agent.example",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type,authorization",
        },
      }),
    );
    expect([200, 204]).toContain(preflight.status);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(
      "https://agent.example",
    );
    const registration = await elysiaApi.fetch(
      new Request("http://localhost/api/auth/mcp/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://agent.example",
        },
        body: JSON.stringify({
          client_name: "Unsafe callback",
          redirect_uris: ["http://agent.example/callback"],
        }),
      }),
    );
    expect(registration.status).toBe(400);
    expect((await registration.json()).error).toBe("invalid_redirect_uri");
  });

  describe("MCP Apps API Endpoints", () => {
    it("returns MCP server connection information from /api/mcp-apps/info", async () => {
      const { elysiaApi } = await import("@/server/elysia");
      const res = await elysiaApi.handle(
        new Request("http://localhost/api/mcp-apps/info"),
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.serverUrl).toContain("/api/mcp/mcp");
      expect(json.data.protectedResourceUrl).toContain(
        "/.well-known/oauth-protected-resource",
      );
      expect(json.data.authServerUrl).toContain(
        "/.well-known/oauth-authorization-server",
      );
    });

    it("rejects unauthenticated requests to /api/mcp-apps with 401", async () => {
      const { elysiaApi } = await import("@/server/elysia");
      const res = await elysiaApi.handle(
        new Request("http://localhost/api/mcp-apps"),
      );
      expect(res.status).toBe(401);
    });
  });
});
