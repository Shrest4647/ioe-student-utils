import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import {
  BreadcrumbsContent,
  CourseDetailContent,
} from "@/components/colleges/college-department-program-course-detail";

export const dynamic = "force-dynamic";

export default function CourseDetailPageInProgram({
  params,
}: {
  params: Promise<{
    slug: string;
    departmentSlug: string;
    programCode: string;
    courseCode: string;
  }>;
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Suspense
        fallback={<div className="h-8 w-32 animate-pulse rounded bg-muted" />}
      >
        <BreadcrumbsContent params={params} />
      </Suspense>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CourseDetailContent params={params} />
      </Suspense>
    </div>
  );
}
