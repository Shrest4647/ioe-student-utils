import { Skeleton } from "@/components/ui/skeleton";

export function QuizSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  );
}
