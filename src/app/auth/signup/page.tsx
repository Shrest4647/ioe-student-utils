"use client";

import { Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [_error, setError] = useState("");

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      return;
    }
    if (!firstName || !lastName) {
      setError("Please enter your first and last name");
      return;
    }
    setError("");
    await signUp.email(
      {
        email,
        password,
        name: `${firstName} ${lastName}`,
        callbackURL: "/dashboard",
        role: "user",
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: async () => {
          setLoading(false);
          router.push("/dashboard");
        },
        onError: (ctx) => {
          setLoading(false);
          toast.error(ctx.error.message);
          setError(ctx.error.message || "Failed to create account");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="z-50 w-full max-w-md rounded-md rounded-t-none">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  placeholder="Max"
                  required
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                  value={firstName}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  placeholder="Robinson"
                  required
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                  value={lastName}
                />
              </div>
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Confirm Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirm Password"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center space-x-4">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) =>
                    setAcceptTerms(checked as boolean)
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{" "}
                  <Link
                    href="#terms"
                    className="text-emerald-600 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#privacy"
                    className="text-emerald-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={handleEmailSignUp}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Create an account"
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-center border-t py-4">
            <p className="text-center text-neutral-500 text-xs">
              Secured by <span className="text-orange-400">better-auth.</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
