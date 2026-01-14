import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";

export interface AdminStatsResponse {
  universities: number;
  colleges: number;
  programs: number;
  courses: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [univRes, collRes, progRes, courseRes] = await Promise.all([
        apiClient.api.universities.get({ query: { limit: "1" } }),
        apiClient.api.colleges.get({ query: { limit: "1" } }),
        apiClient.api.programs.get({ query: { limit: "1" } }),
        apiClient.api.courses.get({ query: { limit: "1" } }),
      ]);

      const stats: AdminStatsResponse = {
        universities: univRes.data?.metadata?.totalCount ?? 0,
        colleges: collRes.data?.metadata?.totalCount ?? 0,
        programs: progRes.data?.metadata?.totalCount ?? 0,
        courses: courseRes.data?.metadata?.totalCount ?? 0,
      };

      return stats;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
