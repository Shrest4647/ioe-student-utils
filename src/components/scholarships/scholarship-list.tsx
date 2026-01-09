"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useScholarshipFilters } from "@/hooks/use-scholarship-filters";
import { useScholarships } from "@/hooks/use-scholarships";
import { cn } from "@/lib/utils";
import { ScholarshipCard } from "./scholarship-card";

export function ScholarshipList() {
  const { filters } = useScholarshipFilters();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    status,
    error,
  } = useScholarships(filters);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Only show skeletons on initial load (when there's no data yet)
  if (status === "pending" && !data) {
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

  if (scholarships.length === 0 && !isFetching) {
    return (
      <div className="rounded-lg border-2 border-dashed py-12 text-center text-muted-foreground">
        No scholarships found matching your criteria.
      </div>
    );
  }

  const isFiltering = isFetching && !isFetchingNextPage;

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "grid grid-cols-1 gap-6 transition-opacity duration-300 md:grid-cols-2 lg:grid-cols-3",
          isFiltering ? "pointer-events-none opacity-50" : "opacity-100",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {scholarships.map((scholarship) => (
            <motion.div
              key={scholarship.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.2,
                layout: { duration: 0.3 },
              }}
            >
              <ScholarshipCard scholarship={scholarship} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div
        ref={ref}
        className="flex min-h-[50px] items-center justify-center py-4"
      >
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
        {!hasNextPage && scholarships.length > 0 && !isFetching && (
          <p className="text-muted-foreground text-sm">
            You've reached the end of the list.
          </p>
        )}
      </div>
    </div>
  );
}
