import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { Scholarship } from "@/components/scholarships/scholarship-card";
import { apiClient } from "@/lib/eden";
import type { ScholarshipFilters } from "./use-scholarship-filters";

// ... (existing helper function)

export function useScholarshipEvents(start: Date, end: Date) {
  return useQuery({
    queryKey: ["scholarship-events", start, end],
    queryFn: async () => {
      const response = await apiClient.api.scholarships.calendar.get({
        query: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });

      if (response.data?.success) {
        return response.data.data;
      }
      throw new Error("Failed to fetch events");
    },
  });
}

export interface ScholarshipResponse {
  success: boolean;
  data: Scholarship[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
}

export function useScholarships(filters: ScholarshipFilters) {
  return useInfiniteQuery({
    queryKey: ["scholarships", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.scholarships.get({
        query: {
          country: filters.country || undefined,
          degree: filters.degree || undefined,
          field: filters.field || undefined,
          search: filters.search || undefined,
          page: String(pageParam),
          limit: "12",
        },
      });

      if (response.data?.success) {
        // Transform dates if necessary, though Drizzle might return Date objects or strings depending on driver.
        // Eden treaty usually preserves types if configured, but let's be safe for pure JSON serialization.
        const transformedData = (response.data.data as any[]).map((item) => ({
          ...item,
          // deep transformation not strictly needed if frontend handles ISO strings,
          // but Scholarship type expects Date | string.
        }));

        return {
          ...response.data,
          data: transformedData,
        } as ScholarshipResponse;
      }
      throw new Error("Failed to fetch scholarships");
    },
    getNextPageParam: (lastPage: ScholarshipResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });
}
