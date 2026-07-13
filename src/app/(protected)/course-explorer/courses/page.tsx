import { permanentRedirect } from "next/navigation";

export default function LegacyProtectedCoursesPage() {
  permanentRedirect("/course-explorer");
}
