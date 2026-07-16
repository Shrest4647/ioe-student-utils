"use client";

import { RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ResourceLibraryFilters } from "./resource-hero";

interface ResourceFiltersProps {
  categories: { id: string; name: string }[];
  contentTypes: { id: string; name: string }[];
  filters: ResourceLibraryFilters;
  setFilters: (filters: ResourceLibraryFilters) => void;
}

export function ResourceFilters({
  categories,
  contentTypes,
  filters,
  setFilters,
}: ResourceFiltersProps) {
  const activeCategory = categories.find(
    (item) => item.id === filters.category,
  );
  const activeContentType = contentTypes.find(
    (item) => item.id === filters.contentType,
  );
  const hasStructuredFilters = activeCategory || activeContentType;

  return (
    <div className="border-t px-1 pt-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="px-2 font-medium text-muted-foreground text-xs">
          Narrow results
        </span>
        <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                category: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger
              aria-label="Filter by topic"
              className="h-8 w-full bg-muted/40 sm:w-44"
            >
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All topics</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.contentType || "all"}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                contentType: value === "all" ? "" : value,
              })
            }
          >
            <SelectTrigger
              aria-label="Filter by resource type"
              className="h-8 w-full bg-muted/40 sm:w-44"
            >
              <SelectValue placeholder="All resource types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All resource types</SelectItem>
              {contentTypes.map((contentType) => (
                <SelectItem key={contentType.id} value={contentType.id}>
                  {contentType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasStructuredFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start text-muted-foreground sm:self-auto"
            onClick={() =>
              setFilters({ ...filters, category: "", contentType: "" })
            }
          >
            <RotateCcw />
            Reset filters
          </Button>
        )}
      </div>

      {hasStructuredFilters && (
        <div
          className="flex flex-wrap gap-1.5 px-2 pt-2 pb-1"
          aria-label="Active filters"
        >
          {activeCategory && (
            <button
              type="button"
              className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/10 px-2 font-medium text-primary text-xs hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setFilters({ ...filters, category: "" })}
              aria-label={`Remove topic filter ${activeCategory.name}`}
            >
              {activeCategory.name}
              <X className="size-3" />
            </button>
          )}
          {activeContentType && (
            <button
              type="button"
              className="inline-flex h-6 items-center gap-1 rounded-full bg-primary/10 px-2 font-medium text-primary text-xs hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setFilters({ ...filters, contentType: "" })}
              aria-label={`Remove resource type filter ${activeContentType.name}`}
            >
              {activeContentType.name}
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
