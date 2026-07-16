import { notFound, permanentRedirect } from "next/navigation";
import { CourseEditor } from "@/components/instructor/CourseEditor";
import { resolveCourseReference } from "@/server/elysia/services/course-explorer-query-service";

export const dynamic = "force-dynamic";

export default async function InstructorCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resolution = await resolveCourseReference(id);
  if (!resolution) notFound();

  if (resolution.matchedBy !== "slug") {
    permanentRedirect(
      `/course-explorer/instructor/courses/${resolution.slug}/edit`,
    );
  }

  return <CourseEditor courseId={resolution.id} />;
}
