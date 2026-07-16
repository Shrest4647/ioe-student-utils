import type { Metadata } from "next";
import { CourseFinder } from "@/components/course-explorer/course-finder";
import { listCourseCatalog } from "@/server/elysia/services/course-explorer-query-service";

export const metadata: Metadata = {
  title: "Course Explorer | IOE Student Utils",
  description:
    "Search IOE courses and topics, review syllabus structure, prerequisites, priorities, and study resources.",
  keywords: ["IOE courses", "course explorer", "learning paths", "curriculum"],
  openGraph: {
    title: "Course Explorer | IOE Student Utils",
    description:
      "Discover and explore IOE courses with our interactive course explorer.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function CourseExplorerLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  try {
    const result = await listCourseCatalog({
      search: q,
      readiness: "all",
      limit: 100,
    });
    return <CourseFinder result={result} initialSearch={q} />;
  } catch {
    return (
      <main className="mx-auto flex min-h-[60dvh] max-w-xl flex-col justify-center px-4 text-center">
        <h1 className="font-semibold text-2xl">
          Course outlines are unavailable
        </h1>
        <p className="mt-3 text-muted-foreground">
          We could not reach the course database. Refresh the page after the
          local database or service is available.
        </p>
      </main>
    );
  }
}
