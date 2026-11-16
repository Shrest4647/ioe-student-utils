import type React from "react";

export default function McpAppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 pt-8 pb-16 sm:px-6">
      {children}
    </div>
  );
}
