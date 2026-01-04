"use client";

import type React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute redirectTo="/unauthorized">{children}</ProtectedRoute>;
}
