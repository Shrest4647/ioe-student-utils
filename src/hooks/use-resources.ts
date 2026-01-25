import { useInfiniteQuery } from "@tanstack/react-query";
import type { Resource } from "@/components/resources/resource-card";
import { apiClient } from "@/lib/eden";

export interface ResourceResponse {
  success: boolean;
  data: Resource[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
}

export interface ResourceFilters {
  category?: string;
  contentType?: string;
  search?: string;
  limit?: string;
}

export function useResources(filters: ResourceFilters) {
  return useInfiniteQuery({
    queryKey: ["resources", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.resources.get({
        query: {
          category: filters.category || undefined,
          contentType: filters.contentType || undefined,
          search: filters.search || undefined,
          page: String(pageParam),
          limit: filters.limit || "12",
        },
      });

      if (response.data?.success) {
        // Transform data to match our Resource type
        const transformedData = response.data.data.map((item) => ({
          ...item,
          categories: (item.categories || []).map((cat) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            createdAt: cat.createdAt
              ? new Date(cat.createdAt).toISOString()
              : undefined,
            updatedAt: cat.updatedAt
              ? new Date(cat.updatedAt).toISOString()
              : undefined,
          })),
          contentType: item.contentType
            ? {
                id: item.contentType.id,
                name: item.contentType.name,
              }
            : null,
          createdAt: item.createdAt
            ? new Date(item.createdAt).toISOString()
            : undefined,
          updatedAt: item.updatedAt
            ? new Date(item.updatedAt).toISOString()
            : undefined,
        }));

        return {
          ...response.data,
          data: transformedData,
        } as ResourceResponse;
      }
      throw new Error("Failed to fetch resources");
    },
    getNextPageParam: (lastPage: ResourceResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: ResourceResponse) => {
      if (firstPage.metadata.currentPage > 1) {
        return firstPage.metadata.currentPage - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
