import type { ReactNode } from "react";

export default function RecommendationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="container mx-auto py-8">{children}</div>;
}
