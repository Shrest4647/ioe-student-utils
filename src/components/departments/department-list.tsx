"use client";

import { useSearchParams } from "next/navigation";
import { useDepartments } from "@/hooks/use-content";
import { DepartmentCard } from "./department-card";

export function DepartmentList() {
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || undefined;

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useDepartments({ search });

  const departments = data?.pages.flatMap((page) => page.data) || [];
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

  if (departments.length === 0) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No departments found</p>
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
        Showing {departments.length} of {totalCount} departments
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <DepartmentCard key={department.id} department={department} />
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
            {isFetchingNextPage ? "Loading more..." : "Load more departments"}
          </button>
        </div>
      )}
    </div>
  );
}
