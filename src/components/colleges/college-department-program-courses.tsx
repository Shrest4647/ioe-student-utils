"use client";

import { useParams, useSearchParams } from "next/navigation";
import { use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import {
  useCollegeDepartmentsBySlug,
  useCourses,
  useDepartment,
  useProgram,
} from "@/hooks/use-content";

function BreadcrumbsContent({
  params,
}: {
  params: Promise<{
    slug: string;
    departmentSlug: string;
    programCode: string;
  }>;
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
        {
          label: "Programs",
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}/programs`,
        },
        {
          label: resolvedParams.programCode,
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}/programs/${resolvedParams.programCode}`,
        },
        { label: "Courses", href: "" },
      ]}
    />
  );
}

function CoursesContent() {
  const resolvedParams = useParams<{
    slug: string;
    departmentSlug: string;
    programCode: string;
  }>();
  const { data: college } = useCollegeDepartmentsBySlug(resolvedParams.slug);
  const { data: department } = useDepartment(resolvedParams.departmentSlug);
  const { data: program } = useProgram(resolvedParams.programCode);
  const resolvedSearchParams = useSearchParams();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useCourses({
      search: resolvedSearchParams.get("search") || undefined,
      programId: program?.id,
      page: resolvedSearchParams.get("page") || "1",
    });

  if (!college || !department || !program) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Content not found</p>
        </div>
      </div>
    );
  }

  const courses = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.metadata.totalCount || 0;

  if (isLoading && courses.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(0)
          .map((v, index) => (
            <div
              key={`${v + index}`}
              className="h-80 animate-pulse rounded-lg bg-muted"
            />
          ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No courses found</p>
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
        Showing {courses.length} of {totalCount} courses
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div>
                  <a
                    href={`/courses/${course.code}`}
                    className="text-foreground/90 decoration-primary underline-offset-4 hover:text-primary hover:underline"
                  >
                    <h3 className="line-clamp-1 font-semibold text-lg">
                      {course.name}
                    </h3>
                  </a>
                </div>
                <p className="line-clamp-2 text-muted-foreground text-sm">
                  {course.description || "No description available"}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-mono text-foreground/90">
                    {course.code}
                  </span>
                  {course.credits && <span>{course.credits} credits</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">
                  {course.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
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
            {isFetchingNextPage ? "Loading more..." : "Load more courses"}
          </button>
        </div>
      )}
    </div>
  );
}

export { BreadcrumbsContent, CoursesContent };
