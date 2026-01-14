import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";

export interface Category {
  id: string;
  name: string;
}

export interface ContentType {
  id: string;
  name: string;
}

export interface MetadataResponse {
  success: boolean;
  data: Category[] | ContentType[];
}

export function useResourceMetadata() {
  const categoriesQuery = useQuery({
    queryKey: ["resource-categories"],
    queryFn: async (): Promise<Category[]> => {
      const response = await apiClient.api.resources.categories.get();
      if (response.data?.success) {
        return response.data.data as Category[];
      }
      throw new Error("Failed to fetch categories");
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const contentTypesQuery = useQuery({
    queryKey: ["resource-content-types"],
    queryFn: async (): Promise<ContentType[]> => {
      const response = await apiClient.api.resources["content-types"].get();
      if (response.data?.success) {
        return response.data.data as ContentType[];
      }
      throw new Error("Failed to fetch content types");
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    categories: categoriesQuery.data || [],
    contentTypes: contentTypesQuery.data || [],
    isLoading: categoriesQuery.isLoading || contentTypesQuery.isLoading,
    isError: categoriesQuery.isError || contentTypesQuery.isError,
    error: categoriesQuery.error || contentTypesQuery.error,
  };
}
