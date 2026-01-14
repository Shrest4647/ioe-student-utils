import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import {
  BreadcrumbsContent,
  ProgramDetailContent,
} from "@/components/colleges/college-department-program-detail";

export const dynamic = "force-dynamic";

export default function ProgramDetailPageInCollegeDepartment({
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
        <ProgramDetailContent />
      </Suspense>
    </div>
  );
}
