import crypto from "node:crypto";
import { appEnv } from "@/env";
import { db } from "@/server/db";
import { oauthApplication } from "@/server/db/schema";

/**
 * Script to register an OAuth Client for Model Context Protocol (e.g. Gemini, Cursor)
 *
 * Usage:
 *   bun scripts/register-mcp-client.ts "<redirect_uri>" "[client_name]"
 */
async function main() {
  const redirectUri = process.argv[2];
  const clientName = process.argv[3] || "Google Gemini MCP Client";

  if (!redirectUri) {
    console.error("❌ Error: Missing redirect URI.\n");
    console.log("Usage:");
    console.log(
      '  bun scripts/register-mcp-client.ts "<copied_redirect_uri>" "[client_name]"\n',
    );
    console.log("Example:");
    console.log(
      '  bun scripts/register-mcp-client.ts "https://oauth-redirect.googleusercontent.com/r/my-project" "Gemini"\n',
    );
    process.exit(1);
  }

  const id = crypto.randomUUID();
  const clientId = `mcp_${crypto.randomBytes(16).toString("hex")}`;
  const clientSecret = crypto.randomBytes(32).toString("hex");

  await db.insert(oauthApplication).values({
    id,
    name: clientName,
    clientId,
    clientSecret,
    redirectUrls: redirectUri,
    type: "web",
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("\n=======================================================");
  console.log("✅ MCP OAuth Client Successfully Registered!");
  console.log("=======================================================\n");
  console.log(`Client Name:     ${clientName}`);
  console.log(`Redirect URI:    ${redirectUri}`);
  console.log(`MCP Server URL:  ${appEnv.NEXT_PUBLIC_BASE_URL}/api/mcp/mcp`);
  console.log(`Client ID:       ${clientId}`);
  console.log(`Client Secret:   ${clientSecret}`);
  console.log("\n=======================================================");
  console.log("👉 Paste the Client ID and Client Secret into Gemini!");
  console.log("=======================================================\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to register MCP client:", err);
  process.exit(1);
});
