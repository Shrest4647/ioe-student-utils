import { SearchX } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { type Resource, ResourceCard } from "./resource-card";

interface ResourceGridProps {
  resources: Resource[];
  isLoading?: boolean;
  onClear?: () => void;
}

const SKELETON_KEYS = ["one", "two", "three", "four", "five", "six"];

export function ResourceGrid({
  resources,
  isLoading,
  onClear,
}: ResourceGridProps) {
  if (isLoading) {
    return (
      <div
        className="space-y-3"
        aria-label="Loading resources"
        aria-busy="true"
      >
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="flex gap-4 rounded-xl border p-4">
            <div className="size-11 shrink-0 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-4 w-2/5 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <Empty className="min-h-64 border">
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No matching resources</EmptyTitle>
        <EmptyDescription>
          Try a broader keyword or remove a filter.
        </EmptyDescription>
        {onClear && (
          <button
            type="button"
            className="font-medium text-primary text-xs underline underline-offset-4"
            onClick={onClear}
          >
            Clear search and filters
          </button>
        )}
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {resources.map((resource) => (
        <ResourceCard key={resource.id} resource={resource} />
      ))}
    </div>
  );
}
