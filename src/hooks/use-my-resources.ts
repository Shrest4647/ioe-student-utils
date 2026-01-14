import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";

export function useMyResources() {
  return useQuery({
    queryKey: ["my-resources"],
    queryFn: async () => {
      const response = await apiClient.api.resources.mine.get();

      if (response.data?.success) {
        return response.data;
      }
      throw new Error("Failed to fetch my resources");
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
