"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MindmapApiResponse,
  MindmapData,
  StudyPath,
} from "@/types/course-explorer";

/**
 * Query key factory for mindmap data
 */
const mindmapKeys = {
  all: ["mindmap"] as const,
  course: (slug: string) => [...mindmapKeys.all, "course", slug] as const,
  courseWithPath: (slug: string, path: StudyPath) =>
    [...mindmapKeys.course(slug), { path }] as const,
};

/**
 * Fetch mindmap data from the API
 *
 * @param courseSlug - The course slug to fetch data for
 * @param path - Optional study path filter
 * @returns Promise with mindmap data
 */
async function fetchMindmapData(
  courseSlug: string,
  path?: StudyPath,
): Promise<MindmapData> {
  const url = new URL(
    `/api/course-explorer/courses/slug/${courseSlug}/mindmap`,
    window.location.origin,
  );

  if (path && path !== "all") {
    url.searchParams.set("path", path);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch mindmap data: ${response.statusText}`,
    );
  }

  const result: MindmapApiResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch mindmap data");
  }

  return result.data;
}

/**
 * Hook to fetch and manage mindmap data for a course
 *
 * @param courseSlug - The course slug to fetch data for
 * @param path - Optional study path filter ("exam-prep", "minimum", or undefined)
 * @returns React Query result with mindmap data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMindmapData("bct-301", "exam-prep");
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * return <MindmapView nodes={data.nodes} edges={data.edges} />;
 * ```
 */
export function useMindmapData(courseSlug: string, path?: StudyPath) {
  return useQuery({
    queryKey: mindmapKeys.courseWithPath(courseSlug, path),
    queryFn: () => fetchMindmapData(courseSlug, path),
    enabled: !!courseSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to get the prefetch function with proper query client
 *
 * @returns Object with prefetch function
 */
export function useMindmapPrefetch() {
  const queryClient = useQueryClient();

  return {
    prefetch: (courseSlug: string, path?: StudyPath) => {
      queryClient.prefetchQuery({
        queryKey: mindmapKeys.courseWithPath(courseSlug, path),
        queryFn: () => fetchMindmapData(courseSlug, path),
        staleTime: 5 * 60 * 1000,
      });
    },
  };
}
