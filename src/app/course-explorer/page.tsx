import type { Metadata } from "next";
import { CourseExplorerLanding } from "@/components/course-explorer/course-explorer-landing";

export const metadata: Metadata = {
  title: "Course Explorer | IOE Student Utils",
  description:
    "Discover and explore IOE courses with our interactive course explorer. Browse by department, search by topic, and visualize learning paths.",
  keywords: ["IOE courses", "course explorer", "learning paths", "curriculum"],
  openGraph: {
    title: "Course Explorer | IOE Student Utils",
    description:
      "Discover and explore IOE courses with our interactive course explorer.",
    type: "website",
  },
};

export default function CourseExplorerLandingPage() {
  return <CourseExplorerLanding />;
}
