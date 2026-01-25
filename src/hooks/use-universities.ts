import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import type { Rating } from "@/components/universities/rating-card";
import { apiClient } from "@/lib/eden";

export interface UniversityResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    location: string | null;
    country: string | null;
    websiteUrl: string | null;
    establishedYear: string | null;
    logoUrl: string | null;
    isActive: boolean;
    createdAt: string | Date | null;
    updatedAt: string | Date | null;
  }[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface UniversityFilters {
  search?: string;
  country?: string;
  page?: string;
  limit?: string;
}

export function useUniversities(filters: UniversityFilters) {
  return useInfiniteQuery({
    queryKey: ["universities", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.api.universities.get({
        query: {
          search: filters.search || undefined,
          country: filters.country || undefined,
          page: String(pageParam),
          limit: filters.limit || "12",
        },
      });

      if (response.data?.success) {
        return response.data as UniversityResponse;
      }
      throw new Error("Failed to fetch universities");
    },
    getNextPageParam: (lastPage: UniversityResponse) => {
      if (lastPage.metadata.hasMore) {
        return lastPage.metadata.currentPage + 1;
      }
      return undefined;
    },
    getPreviousPageParam: (firstPage: UniversityResponse) => {
      if (firstPage.metadata.currentPage > 1) {
        return firstPage.metadata.currentPage - 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useUniversity(slug: string) {
  return useQuery({
    queryKey: ["university", slug],
    queryFn: async () => {
      const response = await apiClient.api.universities
        .slug({
          slug,
        })
        .get();

      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to fetch university");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUniversityRatings(
  universityId: string,
  categoryId?: string,
) {
  return useQuery({
    queryKey: ["university-ratings", universityId, categoryId],
    queryFn: async () => {
      const response = await apiClient.api
        .universities({ id: universityId })
        .ratings.get({
          query: { categoryId },
        });

      if (response.data?.success) {
        return response.data.data.map((item) => ({
          ...item,
          categoryId: item.ratingCategoryId,
          category: {
            id: item.ratingCategory?.id,
            name: item.ratingCategory?.name,
          },
        })) as Rating[];
      }
      throw new Error("Failed to fetch university ratings");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCollegeRatings(collegeId: string, categoryId?: string) {
  return useQuery({
    queryKey: ["college-ratings", collegeId, categoryId],
    queryFn: async () => {
      const response = await apiClient.api
        .colleges({ id: collegeId })
        .ratings.get({
          query: { categoryId },
        });

      if (response.data?.success) {
        return response.data.data.map((item) => ({
          ...item,
          categoryId: item.ratingCategoryId,
          category: {
            id: item.ratingCategory?.id,
            name: item.ratingCategory?.name,
          },
        })) as Rating[];
      }
      throw new Error("Failed to fetch college ratings");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useDepartmentRatings(
  departmentId: string,
  categoryId?: string,
) {
  return useQuery({
    queryKey: ["department-ratings", departmentId, categoryId],
    queryFn: async () => {
      const response = await apiClient.api
        .departments({ id: departmentId })
        .ratings.get({
          query: { categoryId },
        });

      if (response.data?.success) {
        return response.data.data.map((item) => ({
          ...item,
          categoryId: item.ratingCategoryId,
          category: {
            id: item.ratingCategory?.id,
            name: item.ratingCategory?.name,
          },
        })) as Rating[];
      }
      throw new Error("Failed to fetch department ratings");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useRatingCategories(entityType?: string) {
  return useQuery({
    queryKey: ["rating-categories", entityType],
    queryFn: async () => {
      const response = await apiClient.api.ratings.categories.get({
        query: entityType ? { entityType: entityType } : undefined,
      });

      if (response.data?.success) {
        return response.data.data as Array<{
          id: string;
          name: string;
          description: string | null;
          isActive: boolean;
          sortOrder: string | null;
          createdAt: string | Date | null;
          updatedAt: string | Date;
        }>;
      }
      throw new Error("Failed to fetch rating categories");
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
