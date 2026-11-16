import { beforeAll, describe, expect, it } from "bun:test";
import { betterAuth } from "better-auth";
import { mcp } from "better-auth/plugins";
import { validateRedirectUri } from "@/lib/mcp/redirect-uri";
import { getSignInContinuation } from "@/lib/mcp/sign-in-continuation";
import { mcpAfter, mcpBefore } from "@/server/better-auth/mcp-hooks";

// Real provider with its in-memory adapter: no production database or credentials.
const origin = "http://localhost:3456";
const auth = betterAuth({
  baseURL: origin,
  secret: "isolated-mcp-test-secret-at-least-32-characters",
  emailAndPassword: { enabled: true },
  hooks: { before: mcpBefore, after: mcpAfter },
  plugins: [
    mcp({
      loginPage: "/auth/signin",
      resource: `${origin}/api/mcp/mcp`,
      oidcConfig: {
        loginPage: "/auth/signin",
        requirePKCE: true,
        allowPlainCodeChallengeMethod: false,
        consentPage: "/auth/mcp/consent",
      },
    }),
  ],
});
let cookie: string;
let otherCookie: string;
const callback = "https://agent.example/callback?existing=1";
async function request(
  path: string,
  body?: Record<string, unknown>,
  sessionCookie?: string,
  headers: Record<string, string> = {},
) {
  return auth.handler(
    new Request(`${origin}/api/auth${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(sessionCookie ? { cookie: sessionCookie } : {}),
        ...headers,
      },
      ...(body
        ? {
            body:
              headers["Content-Type"] === "application/x-www-form-urlencoded"
                ? new URLSearchParams(body as Record<string, string>).toString()
                : JSON.stringify(body),
          }
        : {}),
    }),
  );
}
async function register(method = "client_secret_post") {
  const response = await request("/mcp/register", {
    client_name: "Test agent",
    redirect_uris: [callback],
    token_endpoint_auth_method: method,
  });
  expect(response.status).toBe(201);
  return response.json();
}
async function grant(clientId: string, codeVerifier: string) {
  const challenge = Buffer.from(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(codeVerifier),
    ),
  ).toString("base64url");
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    response_type: "code",
    scope: "openid offline_access",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: "test-state",
  });
  const response = await request(`/mcp/authorize?${query}`, undefined, cookie);
  expect(response.status).toBe(302);
  const consentUrl = new URL(response.headers.get("location") || "", origin);
  expect(consentUrl.pathname).toBe("/auth/mcp/consent");
  const code = consentUrl.searchParams.get("consent_code") || "";
  const foreignConsent = await request(
    "/oauth2/consent",
    { consent_code: code, accept: true },
    otherCookie,
  );
  expect(foreignConsent.status).toBe(401);
  const consent = await request(
    "/oauth2/consent",
    { consent_code: code, accept: true },
    cookie,
  );
  expect(consent.status).toBe(200);
  const redirect = new URL((await consent.json()).redirectURI);
  expect(redirect.searchParams.get("state")).toBe("test-state");
  expect(redirect.searchParams.get("existing")).toBe("1");
  return redirect.searchParams.get("code") || "";
}

beforeAll(async () => {
  for (const [index, email] of [
    "owner@example.com",
    "other@example.com",
  ].entries()) {
    const response = await request("/sign-up/email", {
      name: "Test User",
      email,
      password: "a-long-test-password",
    });
    expect(response.status).toBe(200);
    const sessionCookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    if (index === 0) cookie = sessionCookie;
    else otherCookie = sessionCookie;
  }
});

describe("MCP OAuth provider flow", () => {
  it.each([
    "client_secret_post",
    "client_secret_basic",
    "none",
  ])("exchanges an S256 authorization code using %s", async (method) => {
    const client = await register(method);
    const verifier = "a".repeat(64);
    const code = await grant(client.client_id, verifier);
    const body: Record<string, unknown> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: callback,
      code_verifier: verifier,
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "https://agent.example",
    };
    if (method === "client_secret_basic") {
      body.client_id = client.client_id;
      headers.authorization = `Basic ${Buffer.from(`${client.client_id}:${client.client_secret}`).toString("base64")}`;
    } else {
      body.client_id = client.client_id;
      if (method !== "none") body.client_secret = client.client_secret;
    }
    const response = await request("/mcp/token", body, undefined, headers);
    expect(response.status).toBe(200);
    const token = await response.json();
    expect(token.access_token).toBeTruthy();
    expect(token.refresh_token).toBeTruthy();
    const replay = await request("/mcp/token", body, undefined, headers);
    expect(replay.status).toBe(401);
    const refresh = {
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      client_id: client.client_id,
      ...(method !== "none" ? { client_secret: client.client_secret } : {}),
    };
    if (method !== "none") {
      const invalid = await request("/mcp/token", {
        ...refresh,
        client_secret: "wrong",
      });
      expect(invalid.status).toBe(401);
    }
    const renewed = await request("/mcp/token", refresh);
    expect(renewed.status).toBe(200);
    expect((await renewed.json()).access_token).not.toBe(token.access_token);
    const reused = await request("/mcp/token", refresh);
    expect(reused.status).toBe(401);
  });

  it("rejects plain PKCE challenges", async () => {
    const client = await register("none");
    const query = new URLSearchParams({
      client_id: client.client_id,
      redirect_uri: callback,
      response_type: "code",
      code_challenge: "a".repeat(64),
      code_challenge_method: "plain",
      state: "pkce-state",
    });
    const response = await request(
      `/mcp/authorize?${query}`,
      undefined,
      cookie,
    );
    const location = new URL(response.headers.get("location") || "", origin);
    expect(location.searchParams.get("error")).toBe("invalid_request");
  });

  it("preserves state and existing callback parameters when consent is denied", async () => {
    const client = await register();
    const query = new URLSearchParams({
      client_id: client.client_id,
      redirect_uri: callback,
      response_type: "code",
      code_challenge: "a".repeat(43),
      code_challenge_method: "S256",
      state: "deny-state",
    });
    const response = await request(
      `/mcp/authorize?${query}`,
      undefined,
      cookie,
    );
    const consentUrl = new URL(response.headers.get("location") || "", origin);
    const consent = await request(
      "/oauth2/consent",
      {
        consent_code: consentUrl.searchParams.get("consent_code"),
        accept: false,
      },
      cookie,
    );
    expect(consent.status).toBe(200);
    const location = new URL((await consent.json()).redirectURI);
    expect(location.searchParams.get("error")).toBe("access_denied");
    expect(location.searchParams.get("state")).toBe("deny-state");
    expect(location.searchParams.get("existing")).toBe("1");
  });

  it("resumes the consent flow after email sign-in", async () => {
    const client = await register();
    const query = new URLSearchParams({
      client_id: client.client_id,
      redirect_uri: callback,
      response_type: "code",
      code_challenge: "a".repeat(43),
      code_challenge_method: "S256",
      state: "signin-state",
    });
    const response = await request(`/mcp/authorize?${query}`);
    expect(response.status).toBe(302);
    expect(
      new URL(response.headers.get("location") || "", origin).pathname,
    ).toBe("/auth/signin");
    const loginCookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    const signedIn = await request(
      "/sign-in/email",
      { email: "owner@example.com", password: "a-long-test-password" },
      loginCookie,
    );
    expect(signedIn.status).toBe(302);
    expect(
      new URL(signedIn.headers.get("location") || "", origin).pathname,
    ).toBe("/auth/mcp/consent");
  });

  it("only resumes local sign-in destinations", () => {
    for (const callbackURL of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/\n/evil.example",
    ]) {
      expect(
        getSignInContinuation(new URLSearchParams({ callbackURL }).toString()),
      ).toBe("/");
    }
    expect(getSignInContinuation("callbackURL=%2Fdashboard%2Fmcp-apps")).toBe(
      "/dashboard/mcp-apps",
    );
  });

  it("rejects unsafe dynamic registration callbacks", async () => {
    for (const uri of [
      "http://agent.example/callback",
      "https://agent.example/cb#fragment",
      "javascript:alert(1)",
    ]) {
      const response = await request("/mcp/register", { redirect_uris: [uri] });
      expect(response.status).toBe(400);
    }
  });

  it("accepts loopback development callbacks and preserves exact HTTPS callbacks", () => {
    expect(validateRedirectUri("http://127.0.0.1:4321/callback")).toBeNull();
    expect(validateRedirectUri(callback)).toBeNull();
    expect(
      validateRedirectUri("https://user:pass@agent.example/callback"),
    ).toBeTruthy();
  });
});
