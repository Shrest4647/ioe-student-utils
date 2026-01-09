"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useScholarshipFilters } from "@/hooks/use-scholarship-filters";
import { useScholarships } from "@/hooks/use-scholarships";
import { ScholarshipCard } from "./scholarship-card";

export function ScholarshipList() {
  const { filters } = useScholarshipFilters();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useScholarships(filters);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border bg-card text-card-foreground shadow"
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Error loading scholarships: {error.message}
      </div>
    );
  }

  const scholarships = data?.pages.flatMap((page) => page.data) || [];

  if (scholarships.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-12 text-center text-muted-foreground">
        No scholarships found matching your criteria.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {scholarships.map((scholarship) => (
          <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
        ))}
      </div>

      <div ref={ref} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
