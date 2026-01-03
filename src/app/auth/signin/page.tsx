"use client";

import { GithubIcon, Loader2, SlackIcon } from "lucide-react";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                value={email}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="password"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-center text-red-600 text-sm">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                await signIn.email(
                  {
                    email,
                    password,
                  },
                  {
                    onRequest: (_ctx) => {
                      setLoading(true);
                    },
                    onSuccess: (_ctx) => {
                      setLoading(false);
                    },
                    onError: (ctx) => {
                      setLoading(false);
                      setError(ctx.error.message);
                    },
                  }
                );
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <p>Sign In</p>
              )}
            </Button>

            <div
              className={cn(
                "flex w-full items-center gap-2",
                "flex-col justify-between"
              )}
            >
              <Button
                variant="outline"
                className={cn("w-full gap-2")}
                disabled={loading}
                onClick={async () => {
                  await signIn.social(
                    {
                      provider: "github",
                      callbackURL: "/dashboard",
                    },
                    {
                      onRequest: (_ctx) => {
                        setLoading(true);
                      },
                      onSuccess: (_ctx) => {
                        setLoading(false);
                      },
                      onError: (ctx) => {
                        setLoading(false);
                        setError(ctx.error.message);
                      },
                    }
                  );
                }}
              >
                <GithubIcon className="mr-2 h-4 w-4" />
                Sign in with Github
              </Button>
              {/* Slack */}
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  await signIn.social(
                    {
                      provider: "slack",
                      callbackURL: "/dashboard",
                    },
                    {
                      onRequest: (_ctx) => {
                        setLoading(true);
                      },
                      onSuccess: (_ctx) => {
                        setLoading(false);
                      },
                      onError: (ctx) => {
                        setLoading(false);
                        setError(ctx.error.message);
                      },
                    }
                  );
                }}
              >
                <SlackIcon className="mr-2 h-4 w-4" />
                Sign in with Slack
              </Button>
            </div>
            <div className="h-px w-full bg-border" />
            <div className="text-center text-muted-foreground text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="underline hover:text-foreground"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-center border-t py-4">
            <p className="text-center text-neutral-500 text-xs">
              built with{" "}
              <Link
                href="https://better-auth.com"
                className="underline"
                target="_blank"
              >
                <span className="cursor-pointer dark:text-white/70">
                  better-auth.
                </span>
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
