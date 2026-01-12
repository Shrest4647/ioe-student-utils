import { Loader2 } from "lucide-react";
import { Suspense, use } from "react";
import { CollegeDepartmentsContent } from "@/components/colleges/college-departments-content";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export const dynamic = "force-dynamic";

export default function CollegeDepartmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
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
              Departments
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore departments within this college. Browse and rate academic
              departments.
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
          <CollegeDepartmentsContent params={params} />
        </Suspense>
      </div>
    </div>
  );
}

function BreadcrumbsContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  return (
    <Breadcrumbs
      items={[
        { label: "Colleges", href: "/colleges" },
        {
          label: resolvedParams.slug,
          href: `/colleges/${resolvedParams.slug}`,
        },
        { label: "Departments", href: "" },
      ]}
    />
  );
}
