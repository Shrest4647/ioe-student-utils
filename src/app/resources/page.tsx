"use client";

import { AlertCircle, Library, Rows3 } from "lucide-react";
import { useRef, useState } from "react";
import { ResourceGrid } from "@/components/resources/resource-grid";
import {
  ResourceHero,
  type ResourceLibraryFilters,
} from "@/components/resources/resource-hero";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useResourceMetadata } from "@/hooks/use-resource-metadata";
import { useResources } from "@/hooks/use-resources";

const EMPTY_FILTERS: ResourceLibraryFilters = {
  category: "",
  contentType: "",
  search: "",
  limit: "12",
};

export default function ResourceLibraryPage() {
  const [filters, setFilters] = useState<ResourceLibraryFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLElement>(null);
  const debouncedSearch = useDebouncedSearch(filters.search, 300);

  const {
    categories,
    contentTypes,
    isLoading: isLoadingMetadata,
  } = useResourceMetadata();
  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    isFetching,
    isError,
    error,
  } = useResources({
    category: filters.category || undefined,
    contentType: filters.contentType || undefined,
    search: debouncedSearch || undefined,
    limit: filters.limit,
    page,
  });

  const currentResponse = resourcesData?.pages.at(-1);
  const resources = currentResponse?.data ?? [];
  const pagination = currentResponse?.metadata;
  const isLoading = isLoadingMetadata || isLoadingResources;
  const hasActiveQuery = Boolean(
    filters.search || filters.category || filters.contentType,
  );

  const updateFilters = (nextFilters: ResourceLibraryFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isError) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <AlertCircle className="mb-3 size-5 text-destructive" />
          <h1 className="font-semibold text-lg">
            Resources could not be loaded
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {error?.message || "Please try again in a moment."}
          </p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ResourceHero
        categories={categories}
        contentTypes={contentTypes}
        filters={filters}
        setFilters={updateFilters}
      />

      <main
        ref={resultsRef}
        className="mx-auto max-w-7xl scroll-mt-4 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        id="resources-main"
      >
        <div className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Library className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-lg tracking-tight">
                {hasActiveQuery ? "Search results" : "All resources"}
              </h2>
            </div>
            <p
              className="mt-1 text-muted-foreground text-xs"
              aria-live="polite"
            >
              {isLoading || isFetching
                ? "Updating results…"
                : `${pagination?.totalCount ?? 0} ${pagination?.totalCount === 1 ? "resource" : "resources"}`}
              {pagination && pagination.totalPages > 1
                ? `, page ${pagination.currentPage} of ${pagination.totalPages}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Rows3
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground text-xs">Show</span>
            <Select
              value={filters.limit}
              onValueChange={(limit) => updateFilters({ ...filters, limit })}
            >
              <SelectTrigger
                aria-label="Resources per page"
                className="h-8 w-20"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="24">24</SelectItem>
                <SelectItem value="48">48</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ResourceGrid
          resources={resources}
          isLoading={isLoading}
          onClear={
            hasActiveQuery
              ? () => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }
              : undefined
          }
        />

        {pagination && pagination.totalPages > 1 && (
          <Pagination className="mt-8 justify-between border-t pt-5">
            <PaginationContent className="w-full justify-between">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 text-muted-foreground text-xs">
                  {page} / {pagination.totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </main>
    </div>
  );
}
