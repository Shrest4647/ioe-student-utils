"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getSignInContinuation } from "@/lib/mcp/sign-in-continuation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isOAuthPage = pathname.startsWith("/auth/mcp/");

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isOAuthPage) {
      router.replace(getSignInContinuation(window.location.search));
    }
  }, [isAuthenticated, isLoading, router, isOAuthPage]);

  if (isAuthenticated && !isOAuthPage) {
    return null;
  }

  return <>{children}</>;
}
