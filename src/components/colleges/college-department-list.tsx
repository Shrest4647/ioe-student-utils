"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DepartmentCard } from "@/components/departments/department-card";
import { useCollegeDepartmentFilters } from "@/hooks/use-college-department-filters";
import { useDepartments } from "@/hooks/use-content";

export function CollegeDepartmentList({ collegeId }: { collegeId?: string }) {
  const { filters } = useCollegeDepartmentFilters(collegeId);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useDepartments({
      search: filters.search || undefined,
      collegeId,
      page: String(filters.page),
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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
  };

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

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        key={`list-${filters.search}-${filters.page}`}
      >
        <AnimatePresence mode="popLayout">
          {departments.map((department) => (
            <motion.div
              key={department.id}
              variants={item}
              layout
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <DepartmentCard department={department} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {hasNextPage && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-muted-foreground text-sm transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more departments"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
