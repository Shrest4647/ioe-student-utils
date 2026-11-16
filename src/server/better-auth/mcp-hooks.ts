import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { validateRedirectUri } from "@/lib/mcp/redirect-uri";

/** Compatibility and security guards for the installed Better Auth MCP provider. */
export const mcpBefore = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/mcp/authorize") {
    // This provider otherwise skips consent unless the client explicitly asks.
    return { context: { query: { ...ctx.query, prompt: "consent" } } };
  }
  if (ctx.path === "/mcp/register") {
    const redirects = ctx.body?.redirect_uris;
    if (
      !Array.isArray(redirects) ||
      !redirects.length ||
      redirects.some(
        (uri: unknown) => typeof uri !== "string" || validateRedirectUri(uri),
      )
    ) {
      throw new APIError("BAD_REQUEST", {
        error: "invalid_redirect_uri",
        error_description:
          "Provide HTTPS redirect URIs (HTTP is allowed only on loopback).",
      });
    }
    ctx.body.client_name ||= "MCP client";
  }
  if (ctx.path === "/oauth2/consent") {
    const session = await getSessionFromCtx(ctx);
    const code =
      ctx.body?.consent_code ||
      (await ctx.getSignedCookie("oidc_consent_prompt", ctx.context.secret));
    const verification =
      code && (await ctx.context.internalAdapter.findVerificationValue(code));
    if (
      !session ||
      !verification ||
      verification.expiresAt <= new Date() ||
      !JSON.parse(verification.value).requireConsent ||
      JSON.parse(verification.value).userId !== session.user.id
    ) {
      throw new APIError("UNAUTHORIZED", {
        error: "invalid_request",
        error_description:
          "Sign in with the account that started this connection.",
      });
    }
    if (ctx.body?.accept === false) {
      const value = JSON.parse(verification.value);
      const redirect = new URL(value.redirectURI);
      redirect.searchParams.set("error", "access_denied");
      redirect.searchParams.set("error_description", "User denied access");
      if (value.state) redirect.searchParams.set("state", value.state);
      await ctx.context.internalAdapter.deleteVerificationValue(
        verification.id,
      );
      return ctx.json({ redirectURI: redirect.toString() });
    }
  }
  if (ctx.path !== "/mcp/token") return;
  let clientId = ctx.body?.client_id;
  let secret = ctx.body?.client_secret;
  const authorization = ctx.headers?.get("authorization");
  let normalizedBody = ctx.body;
  if (authorization && /^Basic /i.test(authorization)) {
    const decoded = Buffer.from(authorization.slice(6), "base64").toString();
    const separator = decoded.indexOf(":");
    if (separator < 1)
      throw new APIError("UNAUTHORIZED", { error: "invalid_client" });
    try {
      const basicId = decodeURIComponent(
        decoded.slice(0, separator).replace(/\+/g, " "),
      );
      const basicSecret = decodeURIComponent(
        decoded.slice(separator + 1).replace(/\+/g, " "),
      );
      if ((clientId && clientId !== basicId) || secret)
        throw new Error("Conflicting client credentials");
      clientId = basicId;
      secret = basicSecret;
      normalizedBody = {
        ...ctx.body,
        client_id: clientId,
        client_secret: secret,
      };
    } catch {
      throw new APIError("UNAUTHORIZED", { error: "invalid_client" });
    }
  }
  if (ctx.body?.grant_type !== "refresh_token") {
    return { context: { body: normalizedBody } };
  }
  const client =
    clientId &&
    (await ctx.context.adapter.findOne<{
      type: string;
      disabled: boolean;
      clientSecret: string;
    }>({
      model: "oauthApplication",
      where: [{ field: "clientId", value: clientId }],
    }));
  if (
    !client ||
    client.disabled ||
    (client.type !== "public" && (!secret || secret !== client.clientSecret))
  ) {
    throw new APIError("UNAUTHORIZED", {
      error: "invalid_client",
      error_description: "Invalid client credentials.",
    });
  }
  return { context: { body: normalizedBody } };
});

export const mcpAfter = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/mcp/token") {
    ctx.setHeader("Cache-Control", "no-store");
    ctx.setHeader("Pragma", "no-cache");
  }
  if (
    ctx.path === "/mcp/token" &&
    ctx.body?.grant_type === "refresh_token" &&
    !(ctx.context.returned instanceof APIError)
  ) {
    const result = ctx.context.returned as
      | { access_token?: string }
      | undefined;
    if (result?.access_token) {
      await ctx.context.adapter.delete({
        model: "oauthAccessToken",
        where: [{ field: "refreshToken", value: ctx.body.refresh_token }],
      });
    }
  }
});
