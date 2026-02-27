import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Explorer | IOE Student Utils",
  description:
    "Explore course structures, topics, and prerequisites with interactive mindmap visualization. Find the best study paths for exam preparation.",
  keywords: [
    "courses",
    "IOE",
    "Tribhuvan University",
    "course explorer",
    "study paths",
    "prerequisites",
    "topics",
  ],
  openGraph: {
    title: "Course Explorer | IOE Student Utils",
    description:
      "Explore course structures, topics, and prerequisites with interactive mindmap visualization.",
    type: "website",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
