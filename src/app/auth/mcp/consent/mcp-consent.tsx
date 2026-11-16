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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface McpConsentProps {
  code?: string;
  canEdit?: boolean;
  name?: string;
  account?: string;
  callbackHost?: string;
  scopes?: string[];
  error?: string;
}

export function McpConsent({
  code,
  canEdit = false,
  name,
  account,
  callbackHost,
  scopes = [],
  error: initialError,
}: McpConsentProps) {
  const [allowWrites, setAllowWrites] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);
  async function respond(accept: boolean) {
    setPending(true);
    setError(undefined);
    try {
      const { data, error } = await authClient.$fetch<{ redirectURI: string }>(
        `/oauth2/consent?write_access=${canEdit && allowWrites ? "1" : "0"}`,
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
                  Student Utils. Choose whether this connection can also create
                  and update academic entries.
                </p>
                {canEdit ? (
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <Checkbox
                      id="allow-mcp-writes"
                      checked={allowWrites}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        setAllowWrites(checked === true)
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allow-mcp-writes">
                        Allow creating and editing academic entries
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        Use your administrator permissions to add universities,
                        departments, programs, courses, and other academic
                        content. Delete tools and account/security settings are
                        excluded.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    This account can approve read-only access. Sign in with an
                    administrator account to enable editing.
                  </p>
                )}
                <p>
                  Your agent may also submit feedback about tool problems.
                  Reports can include a short task summary, errors, and your
                  account/client identifiers, and are visible to application
                  administrators. Do not include secrets or personal data.
                </p>
                {(scopes.includes("profile") ||
                  scopes.includes("email") ||
                  scopes.includes("openid")) && (
                  <p>
                    Requested identity scopes:{" "}
                    {scopes
                      .filter((scope) =>
                        ["openid", "profile", "email"].includes(scope),
                      )
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
                  {pending
                    ? "Continuing…"
                    : allowWrites && canEdit
                      ? "Allow read and write access"
                      : "Allow read-only access"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
