"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { authClient } from "@/lib/auth-client";
import { resetPasswordSchema } from "@/lib/auth-schemas";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError("Invalid reset token");
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        await authClient.resetPassword(
          { newPassword: value.password, token },
          {
            onSuccess: () => {
              setIsSuccess(true);
            },
            onError: (ctx: any) => {
              setError(
                ctx.error.message ||
                  "Failed to reset password. Please try again.",
              );
            },
          },
        );
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="font-bold text-2xl">
              Password reset successful
            </CardTitle>
            <CardDescription>
              Your password has been successfully reset
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => router.push("/auth/signin")}
              className="w-full"
            >
              Sign in with new password
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-bold text-2xl">
            Reset your password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="password">
              {(field) => (
                <Field orientation="vertical">
                  <FieldLabel>New Password</FieldLabel>
                  <FieldContent>
                    <Input
                      type="password"
                      placeholder="Enter your new password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length ? (
                      <FieldError>
                        {field.state.meta.errors.join(", ")}
                      </FieldError>
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <Field orientation="vertical">
                  <FieldLabel>Confirm Password</FieldLabel>
                  <FieldContent>
                    <Input
                      type="password"
                      placeholder="Confirm your new password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length ? (
                      <FieldError>
                        {field.state.meta.errors.join(", ")}
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
                  {isSubmitting ? "Resetting..." : "Reset password"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
        <CardFooter>
          <Link href="/auth/signin" className="w-full">
            <Button variant="outline" className="w-full bg-transparent">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
