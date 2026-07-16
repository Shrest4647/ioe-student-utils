import { permanentRedirect } from "next/navigation";
import {
  type CourseRouteSearchParams,
  withCourseSearchParams,
} from "@/lib/course-slug";

export default async function LegacyProtectedCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CourseRouteSearchParams>;
}) {
  const { slug } = await params;
  permanentRedirect(
    withCourseSearchParams(`/course-explorer/${slug}`, await searchParams),
  );
}
