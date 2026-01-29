import type React from "react";

/**
 * Provides a centered container with vertical spacing for pages in the API keys dashboard.
 *
 * @param children - The content to render inside the layout
 * @returns A div element with the classes "container mx-auto space-y-6 pt-8" that wraps `children`
 */
export default function ApiKeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto space-y-6 pt-8">{children}</div>;
}
