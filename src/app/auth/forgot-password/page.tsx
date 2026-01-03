"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";
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
import { forgotPasswordSchema } from "@/lib/auth-schemas";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError("");

      await authClient.requestPasswordReset(
        { email: value.email },
        {
          onSuccess: () => {
            setIsSubmitted(true);
          },
          onError: (ctx: any) => {
            setError(
              ctx.error.message ||
                "Failed to send reset email. Please try again.",
            );
          },
        },
      );
      setIsLoading(false);
    },
  });

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="font-bold text-2xl">
              Check your email
            </CardTitle>
            <CardDescription>
              We've sent a password reset link to {form.getFieldValue("email")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground text-sm">
            <p>
              Didn't receive the email? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="text-emerald-600 hover:underline"
              >
                try again
              </button>
            </p>
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center font-bold text-2xl">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your
            password
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
            <form.Field name="email">
              {(field) => (
                <Field orientation="vertical">
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="email"
                      placeholder="Enter your email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={isLoading}
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
                  {isSubmitting ? "Sending..." : "Send reset link"}
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
