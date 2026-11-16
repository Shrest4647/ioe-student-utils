import { appEnv } from "@/env";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export async function GET() {
  const issuer = appEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  const authBase = `${issuer}/api/auth`;

  const metadata = {
    issuer,
    authorization_endpoint: `${authBase}/mcp/authorize`,
    token_endpoint: `${authBase}/mcp/token`,
    registration_endpoint: `${authBase}/mcp/register`,
    scopes_supported: ["openid", "profile", "email", "offline_access"],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    code_challenge_methods_supported: ["S256"],
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "max-age=3600",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
