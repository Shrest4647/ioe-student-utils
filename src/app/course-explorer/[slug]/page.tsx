"use client";

import { useParams } from "next/navigation";
import { CourseExplorer } from "@/components/course-explorer/CourseExplorer";

export default function CourseExplorerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  if (!slug) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <CourseExplorer courseSlug={slug} />;
}
