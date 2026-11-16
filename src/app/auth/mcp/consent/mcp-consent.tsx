"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

interface McpConsentProps {
  code?: string;
  name?: string;
  account?: string;
  callbackHost?: string;
  scopes?: string[];
  error?: string;
}

export function McpConsent({
  code,
  name,
  account,
  callbackHost,
  scopes = [],
  error: initialError,
}: McpConsentProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  async function respond(accept: boolean) {
    setPending(true);
    setError(undefined);
    try {
      const { data, error } = await authClient.$fetch<{ redirectURI: string }>(
        "/oauth2/consent",
        { method: "POST", body: { accept, consent_code: code } },
      );
      if (error || !data?.redirectURI)
        throw new Error(
          "Unable to complete this connection. Try again or restart in your AI app.",
        );
      window.location.assign(data.redirectURI);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to connect.");
      setPending(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <ShieldCheck className="mb-3 size-7 text-primary" />
          <CardTitle>Connect {name || "your AI app"}</CardTitle>
          <CardDescription>
            {account
              ? `Signed in as ${account}`
              : "Review your connection request"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {code && (
            <>
              <div className="space-y-3 text-sm">
                <p>
                  This app will be able to read academic information through IOE
                  Student Utils. OAuth connections cannot edit or delete
                  content.
                </p>
                {(scopes.includes("profile") ||
                  scopes.includes("email") ||
                  scopes.includes("openid")) && (
                  <p>
                    Requested identity scopes:{" "}
                    {scopes
                      .filter((scope) => scope !== "offline_access")
                      .join(", ")}
                    .
                  </p>
                )}
                {scopes.includes("offline_access") && (
                  <p>
                    It can keep access using refresh tokens until you revoke the
                    application.
                  </p>
                )}
                <p className="break-all text-muted-foreground">
                  After approval, you will return to {callbackHost}. Only
                  approve apps you trust.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => respond(false)}
                >
                  Cancel connection
                </Button>
                <Button disabled={pending} onClick={() => respond(true)}>
                  {pending ? "Continuing…" : "Allow connection"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
