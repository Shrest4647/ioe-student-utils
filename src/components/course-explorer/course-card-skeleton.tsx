export function CourseCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/50 p-5 backdrop-blur-xl">
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded-md bg-muted/60" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="h-7 animate-pulse rounded-lg bg-muted/80" />
          <div className="h-7 animate-pulse rounded-lg bg-muted/80" />
        </div>

        <div className="space-y-2 pt-2">
          <div className="h-4 animate-pulse rounded bg-muted/50" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted/50" />
        </div>

        <div className="mt-5 flex flex-col gap-2.5 border-border/50 border-t pt-3.5">
          <div className="h-9 animate-pulse rounded-lg bg-muted/30" />
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
