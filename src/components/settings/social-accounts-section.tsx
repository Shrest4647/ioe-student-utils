"use client";

import {
  Github,
  Gitlab,
  Linkedin,
  Link as LinkIcon,
  Loader2,
  Unlink,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

// Social providers configuration
const socialProviders = [
  { id: "github", name: "GitHub", icon: Github },
  { id: "gitlab", name: "GitLab", icon: Gitlab },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
] as const;

export function SocialAccountsSection() {
  const [linkedAccounts, _setLinkedAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleLink = async (provider: string) => {
    setLoading(provider);
    try {
      await authClient.signIn.social({
        provider: provider as "github",
        callbackURL: "/dashboard/settings",
      });
    } catch {
      toast.error(`Failed to link ${provider}`);
    } finally {
      setLoading(null);
    }
  };

  const handleUnlink = async (provider: string) => {
    setLoading(provider);
    try {
      // Using better-auth's unlink functionality
      toast.info(`Unlinking ${provider} is not yet implemented`);
    } catch {
      toast.error(`Failed to unlink ${provider}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Social Accounts
        </CardTitle>
        <CardDescription>
          Connect your social accounts for easier sign-in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {socialProviders.map((provider) => {
            const isLinked = linkedAccounts.includes(provider.id);
            const isLoading = loading === provider.id;
            const Icon = provider.icon;

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{provider.name}</span>
                </div>
                <Button
                  variant={isLinked ? "outline" : "default"}
                  size="sm"
                  disabled={isLoading}
                  onClick={() =>
                    isLinked
                      ? handleUnlink(provider.id)
                      : handleLink(provider.id)
                  }
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isLinked ? (
                    <>
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
