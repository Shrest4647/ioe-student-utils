import { notFound, permanentRedirect } from "next/navigation";
import { resolveCourseReference } from "@/server/elysia/services/course-explorer-query-service";

export const dynamic = "force-dynamic";

export default async function CourseDetailLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const resolution = await resolveCourseReference(slug);
  if (!resolution) notFound();

  if (resolution.matchedBy !== "slug") {
    permanentRedirect(`/courses/${resolution.slug}`);
  }

  return children;
}
