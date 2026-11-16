import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { McpConsent } from "./mcp-consent";

interface ConsentPageProps {
  searchParams: Promise<{ consent_code?: string }>;
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const { consent_code: code } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(
      `/auth/signin?callbackURL=${encodeURIComponent(`/auth/mcp/consent?consent_code=${encodeURIComponent(code || "")}`)}`,
    );
  }
  const verification =
    code &&
    (await db.query.verification.findFirst({ where: { identifier: code } }));
  if (!verification || verification.expiresAt < new Date()) {
    return (
      <McpConsent error="This connection request has expired. Start again in your AI app." />
    );
  }
  const value = JSON.parse(verification.value) as {
    userId: string;
    clientId: string;
    scope: string[];
    requireConsent: boolean;
    redirectURI: string;
  };
  if (value.userId !== session.user.id || !value.requireConsent) {
    return (
      <McpConsent error="This request belongs to a different account or has already been used. Start again in your AI app." />
    );
  }
  const app = await db.query.oauthApplication.findFirst({
    where: { clientId: value.clientId },
  });
  if (!app || app.disabled)
    return <McpConsent error="This application is no longer available." />;
  return (
    <McpConsent
      code={code}
      name={app.name}
      account={session.user.email}
      callbackHost={new URL(value.redirectURI).host}
      scopes={value.scope}
    />
  );
}
