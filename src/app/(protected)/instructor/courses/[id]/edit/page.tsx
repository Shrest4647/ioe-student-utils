import { CourseEditor } from "@/components/instructor/CourseEditor";

export default function InstructorCourseEditPage({
  params,
}: {
  params: { id: string };
}) {
  return <CourseEditor courseId={params.id} />;
}
