import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import {
  BreadcrumbsContent,
  CollegeDepartmentProgramsContent,
} from "@/components/colleges/college-department-programs";

export const dynamic = "force-dynamic";

export default function CollegeDepartmentProgramsPage({
  params,
}: {
  params: Promise<{ slug: string; departmentSlug: string }>;
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
              Programs
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore programs offered by this department within this college.
              Browse and rate academic programs.
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
          <CollegeDepartmentProgramsContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}
