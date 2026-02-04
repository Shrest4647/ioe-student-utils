export function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="mt-4 h-8 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
