import { notFound, permanentRedirect } from "next/navigation";
import { CourseWorkspace } from "@/components/course-explorer/course-workspace";
import {
  type CourseRouteSearchParams,
  withCourseSearchParams,
} from "@/lib/course-slug";
import { getCourseLearningView } from "@/server/elysia/services/course-explorer-query-service";

export const dynamic = "force-dynamic";

export default async function CourseExplorerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CourseRouteSearchParams>;
}) {
  const { slug } = await params;
  const result = await getCourseLearningView(slug);
  if (!result) notFound();

  if (result.resolution.matchedBy !== "slug") {
    permanentRedirect(
      withCourseSearchParams(
        `/course-explorer/${result.resolution.slug}`,
        await searchParams,
      ),
    );
  }

  return <CourseWorkspace learningView={result.view} />;
}
