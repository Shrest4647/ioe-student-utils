"use client";

import { useState } from "react";
import { ResourceGrid } from "@/components/resources/resource-grid";
import { ResourceHero } from "@/components/resources/resource-hero";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useDebouncedSearch } from "@/hooks/use-debounced-search";
import { useResourceMetadata } from "@/hooks/use-resource-metadata";
import { useResources } from "@/hooks/use-resources";

export default function ResourceLibraryPage() {
  const [filters, setFilters] = useState({
    category: "",
    contentType: "",
    search: "",
    limit: "12",
  });

  // Debounce the search input
  const debouncedSearch = useDebouncedSearch(filters.search, 300);

  // Fetch metadata (categories and content types)
  const {
    categories,
    contentTypes,
    isLoading: isLoadingMetadata,
  } = useResourceMetadata();

  // Fetch resources with infinite query
  const {
    data: resourcesData,
    isLoading: isLoadingResources,
    isError,
    error,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = useResources({
    category: filters.category || undefined,
    contentType: filters.contentType || undefined,
    search: debouncedSearch || undefined,
    limit: filters.limit || "12",
  });

  // Flatten the infinite query data
  const allResources = resourcesData?.pages.flatMap((page) => page.data) || [];
  const pagination = resourcesData?.pages[0]?.metadata;

  const featuredResources = allResources.filter((r) => r.isFeatured);
  const nonFeaturedResources = allResources.filter((r) => !r.isFeatured);

  const handlePageChange = (newPage: number) => {
    if (newPage > (pagination?.currentPage || 1)) {
      fetchNextPage();
    } else if (newPage < (pagination?.currentPage || 1)) {
      fetchPreviousPage();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLoading = isLoadingMetadata || isLoadingResources;

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4">
          <h2 className="text-red-800">Error loading resources</h2>
          <p className="text-red-600">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ResourceHero
        categories={categories}
        contentTypes={contentTypes}
        filters={filters}
        setFilters={setFilters}
      />

      <main className="container mx-auto px-4 py-8" id="resources-main">
        <div className="mb-4 flex w-full items-center justify-end">
          <h2 className="flex-1 font-bold text-xl">
            {isLoading
              ? "Finding resources..."
              : `${pagination?.totalCount || 0} resources found`}
          </h2>
          {pagination && pagination.totalPages > 1 && (
            <Pagination className="w-full flex-2 justify-end">
              <PaginationContent className="items-center">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handlePageChange((pagination.currentPage || 1) - 1)
                    }
                    disabled={
                      !hasPreviousPage || (pagination.currentPage || 1) === 1
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-muted-foreground text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange((pagination.currentPage || 1) + 1)
                    }
                    disabled={!hasNextPage}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
        <div className="mb-4 flex w-full items-center justify-between"></div>
        {featuredResources.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-orange-500" />
              <h2 className="font-bold text-xl tracking-tight">
                Featured Resources
              </h2>
            </div>
            <ResourceGrid resources={featuredResources} isLoading={isLoading} />
          </div>
        )}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-orange-500" />
          <h2 className="font-bold text-xl tracking-tight">All Resources</h2>
        </div>
        <ResourceGrid resources={nonFeaturedResources} isLoading={isLoading} />
      </main>
    </div>
  );
}
