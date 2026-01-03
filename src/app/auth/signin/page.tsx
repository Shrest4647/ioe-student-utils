"use client";

import { useForm } from "@tanstack/react-form";
import { GithubIcon, Loader2, SlackIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { signInSchema } from "@/lib/auth-schemas";
import { cn } from "@/lib/utils";

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      await signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onRequest: () => {
            setLoading(true);
          },
          onSuccess: () => {
            setLoading(false);
            router.push("/");
          },
          onError: (ctx) => {
            setLoading(false);
            toast.error(ctx.error.message);
          },
        },
      );
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="grid gap-4">
              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      <Label htmlFor={field.name}>Email</Label>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.isTouched &&
                      field.state.meta.errors.length ? (
                        <FieldError>
                          {field.state.meta.errors.map((error) => (
                            <p key={`idx-${error?.message.slice(0, 10)}`}>
                              {error?.message}
                            </p>
                          ))}
                        </FieldError>
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      <div className="flex w-full items-center">
                        <Label htmlFor={field.name}>Password</Label>
                        <Link
                          href="/auth/forgot-password"
                          className="ml-auto inline-block underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="password"
                        placeholder="password"
                        autoComplete="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.isTouched &&
                      field.state.meta.errors.length ? (
                        <FieldError>
                          {field.state.meta.errors.map((error) => (
                            <p key={`idx-${error?.message.slice(0, 10)}`}>
                              {error?.message}
                            </p>
                          ))}
                        </FieldError>
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <p>Sign In</p>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>

          <div className="mt-6">
            <div className="h-px w-full bg-border" />
            <div className="mt-4 text-center text-muted-foreground text-sm">
              Or continue with
            </div>
          </div>

          <div
            className={cn(
              "flex w-full items-center gap-2",
              "mt-4 flex-col justify-between",
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
                    callbackURL: "/",
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
                      toast.error(ctx.error.message);
                    },
                  },
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
              disabled={loading}
              onClick={async () => {
                await signIn.social(
                  {
                    provider: "slack",
                    callbackURL: "/",
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
                      toast.error(ctx.error.message);
                    },
                  },
                );
              }}
            >
              <SlackIcon className="mr-2 h-4 w-4" />
              Sign in with Slack
            </Button>
          </div>
          <div className="mt-4 h-px w-full bg-border" />
          <div className="mt-4 text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="underline hover:text-foreground"
            >
              Sign Up
            </Link>
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
