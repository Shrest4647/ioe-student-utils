"use client";

import { useSearchParams } from "next/navigation";
import { useCourses } from "@/hooks/use-content";
import { CourseCard } from "./course-card";

export function CourseList() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || undefined;
  const programId = searchParams.get("programId") || undefined;

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useCourses({ search, programId });

  const courses = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.metadata.totalCount || 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
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
          <CourseCard key={course.id} course={course} />
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
