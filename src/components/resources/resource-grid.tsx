import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { type Resource, ResourceCard } from "./resource-card";

interface ResourceGridProps {
  resources: Resource[];
  isLoading?: boolean;
}

// Skeleton keys are stable since they're always the same 6 placeholders
const SKELETON_KEYS = ["header", "content", "sidebar", "footer", "nav", "main"];

export function ResourceGrid({ resources, isLoading }: ResourceGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {SKELETON_KEYS.map((key) => (
          <div
            key={`skeleton-${key}`}
            className="h-48 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="py-8">
        <Empty>
          <EmptyTitle>No resources found</EmptyTitle>
          <EmptyDescription>
            Try adjusting your filters or search terms.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
