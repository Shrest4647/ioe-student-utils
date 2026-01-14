import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import {
  BreadcrumbsContent,
  CoursesContent,
} from "@/components/colleges/college-department-program-courses";

export const dynamic = "force-dynamic";

export default function CoursesPageInProgram({
  params,
}: {
  params: Promise<{
    slug: string;
    departmentSlug: string;
    programCode: string;
  }>;
}) {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8">
        <Suspense
          fallback={<div className="h-8 w-32 animate-pulse rounded bg-muted" />}
        >
          <BreadcrumbsContent params={params} />
        </Suspense>
        <div className="flex flex-col items-start gap-4">
          <div>
            <h1 className="mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
              Courses
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore courses offered by this program within this college
              department. Browse and rate academic courses.
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <CoursesContent />
        </Suspense>
      </div>
    </div>
  );
}
