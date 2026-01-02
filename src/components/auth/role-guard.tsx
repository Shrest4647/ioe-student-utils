"use client";

import type React from "react";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
  redirectTo = "/unauthorized",
}: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = user.role || "customer";
      if (!allowedRoles.includes(userRole)) {
        router.push(redirectTo);
      }
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, router, redirectTo]);

  if (isLoading) {
    return fallback || null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const userRole = user?.role || "customer";
  if (!allowedRoles.includes(userRole)) {
    return fallback || null;
  }

  return <>{children}</>;
}
