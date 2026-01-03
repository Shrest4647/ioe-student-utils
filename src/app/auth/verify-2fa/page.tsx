"use client";

import { useForm } from "@tanstack/react-form";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { verify2faSchema } from "@/lib/auth-schemas";

type VerificationMethod = "totp" | "otp" | "backup";

export function TwoFactorVerification() {
  const [method, setMethod] = useState<VerificationMethod>("totp");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      code: "",
      trustDevice: false,
    },
    validators: {
      onChange: verify2faSchema,
    },
    onSubmit: async ({ value }) => {
      setLoading(true);
      try {
        if (method === "totp") {
          await authClient.twoFactor.verifyTotp({
            code: value.code,
            trustDevice: value.trustDevice,
            fetchOptions: {
              onRequest: () => {
                setLoading(true);
              },
              onSuccess: () => {
                setLoading(false);
                router.push("/");
              },
            },
          });
        } else if (method === "otp") {
          if (otpSent) {
            await authClient.twoFactor.verifyOtp({
              code: value.code,
              trustDevice: value.trustDevice,
            });
          } else {
            await authClient.twoFactor.sendOtp();
            setOtpSent(true);
          }
        } else {
          await authClient.twoFactor.verifyBackupCode({
            code: value.code,
          });
        }
      } catch (error) {
        console.log("error", error);
        alert("Failed to verify code. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Two-Factor Authentication
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Verify your identity to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-4"
        >
          <div className="flex gap-2">
            <Button
              type="button"
              variant={method === "totp" ? "default" : "outline"}
              onClick={() => {
                setMethod("totp");
                form.setFieldValue("code", "");
              }}
            >
              Authenticator App
            </Button>
            <Button
              type="button"
              variant={method === "otp" ? "default" : "outline"}
              onClick={() => {
                setMethod("otp");
                form.setFieldValue("code", "");
                setOtpSent(false);
              }}
            >
              Email Code
            </Button>
            <Button
              type="button"
              variant={method === "backup" ? "default" : "outline"}
              onClick={() => {
                setMethod("backup");
                form.setFieldValue("code", "");
              }}
            >
              Backup Code
            </Button>
          </div>

          <form.Field name="code">
            {(field) => (
              <Field orientation="vertical">
                <FieldLabel htmlFor="code">
                  {method === "totp"
                    ? "Enter code from authenticator app"
                    : method === "otp"
                      ? otpSent
                        ? "Enter verification code"
                        : "Click below to receive a verification code"
                      : "Enter backup code"}
                </FieldLabel>
                <FieldContent>
                  {method === "backup" ? (
                    <Input
                      id="code"
                      type="text"
                      placeholder="xxxx-xxxx-xxxx"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      pattern="[0-9a-zA-Z-]+"
                      inputMode="text"
                      maxLength={14}
                      required
                      disabled={loading}
                    />
                  ) : (
                    <InputOTP
                      maxLength={6}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(value) => field.handleChange(value)}
                      disabled={loading}
                      pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                      required
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  )}
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

          {method !== "backup" && (
            <form.Field name="trustDevice">
              {(field) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="trust">
                    <Checkbox
                      id="trust"
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked as boolean)
                      }
                      disabled={loading}
                    />
                    Trust this device for 60 days
                  </FieldLabel>
                </Field>
              )}
            </form.Field>
          )}

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
                ) : method === "otp" && !otpSent ? (
                  "Send Verification Code"
                ) : (
                  "Verify"
                )}
              </Button>
            )}
          </form.Subscribe>
          <Button
            type="button"
            className="w-full"
            variant="outline"
            disabled={loading}
            onClick={() => router.push("/auth/signin")}
          >
            Cancel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyTwoFactorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <TwoFactorVerification />
      </div>
    </div>
  );
}
