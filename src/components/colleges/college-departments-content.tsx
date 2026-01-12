"use client";

import { use } from "react";
import { CollegeDepartmentFilters } from "@/components/colleges/college-department-filters";
import { CollegeDepartmentList } from "@/components/colleges/college-department-list";
import { useCollegeDepartmentsBySlug } from "@/hooks/use-content";

export function CollegeDepartmentsContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { data: college } = useCollegeDepartmentsBySlug(resolvedParams.slug);

  return (
    <>
      <CollegeDepartmentFilters collegeId={college?.id} />
      <div className="min-h-125">
        <CollegeDepartmentList collegeId={college?.id} />
      </div>
    </>
  );
}
