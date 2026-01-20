import type React from "react";

export default function ApiKeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto space-y-6 pt-8">{children}</div>;
}
