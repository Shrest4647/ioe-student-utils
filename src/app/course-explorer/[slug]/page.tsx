import { CourseExplorer } from "@/components/course-explorer/CourseExplorer";

export default function CourseExplorerPage({
  params,
}: {
  params: { slug: string };
}) {
  return <CourseExplorer courseSlug={params.slug} />;
}
