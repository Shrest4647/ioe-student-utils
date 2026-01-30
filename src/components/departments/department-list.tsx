"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useDepartments } from "@/hooks/use-content";
import { useDepartmentFilters } from "@/hooks/use-department-filters";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DepartmentCard } from "./department-card";

export function DepartmentList() {
  const { filters } = useDepartmentFilters();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useDepartments({
      search: filters.search || undefined,
      page: String(filters.page),
    });

  const observerRef = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  });

  const departments = data?.pages.flatMap((page) => page.data) || [];
  const totalCount = data?.pages[0]?.metadata.totalCount || 0;

  if (isLoading && departments.length === 0) {
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
      <motion.div
        className="text-muted-foreground text-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        key={`count-${totalCount}`}
      >
        Showing {departments.length} of {totalCount} departments
      </motion.div>

      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        key={`list-${filters.search}`}
      >
        <AnimatePresence mode="popLayout">
          {departments.map((department) => (
            <motion.div
              key={department.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DepartmentCard department={department} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div
        ref={observerRef}
        className="flex h-12 items-center justify-center"
        aria-hidden="true"
      >
        {isFetchingNextPage && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
