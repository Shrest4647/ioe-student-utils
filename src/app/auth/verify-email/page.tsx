"use client";

import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const { user, isAuthenticated, isEmailVerified, isLoading } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && isEmailVerified) {
      router.push("/dashboard/settings");
    }
  }, [isLoading, isAuthenticated, isEmailVerified, router]);

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/dashboard/settings",
      });
      toast.success("Verification email resent!");
    } catch (_error) {
      toast.error("Failed to resend verification email");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="z-50 w-full max-w-md rounded-md rounded-t-none">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-xl md:text-2xl">
            Verify your email
          </CardTitle>
          <CardDescription>
            We've sent a verification email to{" "}
            <span className="font-medium text-foreground">
              {user?.email || "your email"}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            Please check your inbox and click the link to verify your account.
            If you don't see it, check your spam folder.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleResendEmail}
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              I've verified my email
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Link
            href="/auth/signin"
            className="flex items-center text-emerald-600 text-sm hover:underline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Link>
          <div className="flex w-full justify-center border-t pt-4">
            <p className="text-center text-neutral-500 text-xs">
              Secured by <span className="text-orange-400">better-auth.</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
