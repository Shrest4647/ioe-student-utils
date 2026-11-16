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
      expect(authHeader).toContain("resource_metadata");
    });
  });
});
