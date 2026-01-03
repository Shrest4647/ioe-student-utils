"use client";

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
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type VerificationMethod = "totp" | "otp" | "backup";

export function TwoFactorVerification() {
  const [method, setMethod] = useState<VerificationMethod>("totp");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const handleTotpVerify = async () => {
    try {
      setLoading(true);
      await authClient.twoFactor.verifyTotp({
        code,
        trustDevice,
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
    } catch (error) {
      console.log("error", error);
      alert("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSend = async () => {
    try {
      setLoading(true);
      await authClient.twoFactor.sendOtp();
      setOtpSent(true);
    } catch {
      alert("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    try {
      setLoading(true);
      await authClient.twoFactor.verifyOtp({
        code,
        trustDevice,
      });
      // Redirect will happen automatically on success
    } catch {
      alert("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeVerify = async () => {
    try {
      setLoading(true);
      await authClient.twoFactor.verifyBackupCode({
        code,
      });
      // Redirect will happen automatically on success
    } catch {
      alert("Failed to verify backup code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            if (method === "totp") {
              handleTotpVerify();
            } else if (method === "otp") {
              if (otpSent) {
                handleOtpVerify();
              } else {
                handleOtpSend();
              }
            } else {
              handleBackupCodeVerify();
            }
          }}
          className="grid gap-4"
        >
          <div className="flex gap-2">
            <Button
              type="button"
              variant={method === "totp" ? "default" : "outline"}
              onClick={() => {
                setMethod("totp");
                setCode("");
              }}
            >
              Authenticator App
            </Button>
            <Button
              type="button"
              variant={method === "otp" ? "default" : "outline"}
              onClick={() => {
                setMethod("otp");
                setCode("");
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
                setCode("");
              }}
            >
              Backup Code
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="code">
              {method === "totp"
                ? "Enter code from authenticator app"
                : method === "otp"
                  ? otpSent
                    ? "Enter verification code"
                    : "Click below to receive a verification code"
                  : "Enter backup code"}
            </Label>
            {method === "backup" ? (
              <Input
                id="code"
                type="text"
                placeholder="xxxx-xxxx-xxxx"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                pattern="[0-9a-zA-Z-]+"
                inputMode="text"
                maxLength={14}
                required
                disabled={loading}
              />
            ) : (
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
                disabled={loading}
                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
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
          </div>

          {method !== "backup" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trust"
                checked={trustDevice}
                onCheckedChange={(checked) =>
                  setTrustDevice(checked as boolean)
                }
                disabled={loading}
              />
              <label
                htmlFor="trust"
                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Trust this device for 60 days
              </label>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : method === "otp" && !otpSent ? (
              "Send Verification Code"
            ) : (
              "Verify"
            )}
          </Button>
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
