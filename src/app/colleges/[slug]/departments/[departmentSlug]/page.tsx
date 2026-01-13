import { Loader2 } from "lucide-react";
import { Suspense, use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

import { CollegeDepartmentDetail } from "@/components/colleges/college-department-detail";

export const dynamic = "force-dynamic";

export default function DepartmentDetailPageInCollege({
  params,
}: {
  params: Promise<{ slug: string; departmentSlug: string }>;
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
        <CollegeDepartmentDetail />
      </Suspense>
    </div>
  );
}

function BreadcrumbsContent({
  params,
}: {
  params: Promise<{ slug: string; departmentSlug: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <Breadcrumbs
      items={[
        { label: "Colleges", href: "/colleges" },
        {
          label: resolvedParams.slug,
          href: `/colleges/${resolvedParams.slug}`,
        },
        {
          label: "Departments",
          href: `/colleges/${resolvedParams.slug}/departments`,
        },
        { label: resolvedParams.departmentSlug, href: "" },
      ]}
    />
  );
}
