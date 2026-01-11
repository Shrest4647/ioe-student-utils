"use client";

import { use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import {
  useCollegeDepartmentPrograms,
  useCollegeDepartmentsBySlug,
  useDepartment,
} from "@/hooks/use-content";

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
        {
          label: resolvedParams.departmentSlug,
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}`,
        },
        { label: "Programs", href: "" },
      ]}
    />
  );
}

function CollegeDepartmentProgramsContent({
  params,
}: {
  params: Promise<{ slug: string; departmentSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { data: college } = useCollegeDepartmentsBySlug(resolvedParams.slug);
  const { data: department } = useDepartment(resolvedParams.departmentSlug);

  if (!college || !department) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Content not found</p>
        </div>
      </div>
    );
  }

  return (
    <ProgramListContent collegeId={college.id} departmentId={department.id} />
  );
}

function ProgramListContent({
  collegeId,
  departmentId,
}: {
  collegeId: string;
  departmentId: string;
}) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useCollegeDepartmentPrograms(collegeId, departmentId);

  const programs = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.metadata.totalCount || 0;

  if (isLoading && programs.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((v, i) => (
            <div
              key={`${v + i}`}
              className="h-80 animate-pulse rounded-lg bg-muted"
            />
          ))}
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No programs found</p>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-muted-foreground text-sm">
        Showing {programs.length} of {totalCount} programs
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <ProgramListItem key={program.id} program={program} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-muted-foreground text-sm transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more programs"}
          </button>
        </div>
      )}
    </div>
  );
}

function ProgramListItem({ program }: { program: any }) {
  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div>
            <a
              href={`/programs/${program.code}`}
              className="text-foreground/90 decoration-primary underline-offset-4 hover:text-primary hover:underline"
            >
              <h3 className="line-clamp-1 font-semibold text-lg">
                {program.name}
              </h3>
            </a>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-sm">
            {program.description || "No description available"}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-mono text-foreground/90">{program.code}</span>
            {program.credits && <span>{program.credits} credits</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">
            {program.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
    </div>
  );
}

export { BreadcrumbsContent, CollegeDepartmentProgramsContent };
