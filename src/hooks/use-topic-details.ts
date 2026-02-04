"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";
import type { ApiResponse, ResourceRelevance } from "@/types/course-explorer";

// ============================================================================
// Types
// ============================================================================

/**
 * Resource linked to a topic with full details
 */
export interface TopicResourceDetail {
  id: string;
  title: string;
  description: string | null;
  s3Url: string | null;
  viewCount: number;
}

/**
 * Topic resource link with relevance information
 */
export interface TopicResourceLink {
  resource: TopicResourceDetail;
  relevance: ResourceRelevance;
  sortOrder: number;
}

/**
 * Prerequisite topic information
 */
export interface PrerequisiteTopic {
  id: string;
  slug: string;
  name: string;
  priorityLevel: "core" | "important" | "optional";
}

/**
 * Prerequisite relationship with topic details
 */
export interface TopicPrerequisiteDetail {
  prerequisiteTopic: PrerequisiteTopic;
  dependencyType: "strong" | "weak";
}

/**
 * Child topic information
 */
export interface ChildTopic {
  id: string;
  slug: string;
  name: string;
  priorityLevel: "core" | "important" | "optional";
}

/**
 * Course information for topic context
 */
export interface TopicCourseInfo {
  id: string;
  slug: string;
  name: string;
}

/**
 * Unit information for topic context
 */
export interface TopicUnitInfo extends TopicCourseInfo {
  course: TopicCourseInfo;
}

/**
 * Parent topic information
 */
export interface ParentTopic {
  id: string;
  slug: string;
  name: string;
}

/**
 * Complete topic details from API
 */
export interface TopicDetails {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priorityLevel: "core" | "important" | "optional";
  hours: number;
  weightage: string | null;
  sortOrder: number;
  unit: TopicUnitInfo;
  parentTopic: ParentTopic | null;
  children: ChildTopic[];
  prerequisites: TopicPrerequisiteDetail[];
  resources: TopicResourceLink[];
}

/**
 * API response for topic details
 */
export type TopicDetailsResponse = ApiResponse<TopicDetails>;

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Query key factory for topic details
 */
const topicDetailsKeys = {
  all: ["topic-details"] as const,
  bySlug: (slug: string) => [...topicDetailsKeys.all, "slug", slug] as const,
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch topic details from the API
 *
 * @param slug - The topic slug to fetch details for
 * @returns Promise with topic details
 */
async function fetchTopicDetails(slug: string): Promise<TopicDetails> {
  const { data, error } = await apiClient.api["course-explorer"].topics
    .slug({
      slug,
    })
    .get();

  if (error || !data?.success) {
    throw new Error(
      (error?.value as any)?.error ||
        data?.error ||
        "Failed to fetch topic details",
    );
  }

  return data.data as TopicDetails;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to fetch and manage topic details
 *
 * @param slug - The topic slug to fetch details for (undefined to disable)
 * @returns React Query result with topic details
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTopicDetails("binary-search-trees");
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <h1>{data.name}</h1>
 *     <p>{data.description}</p>
 *     <h2>Resources</h2>
 *     {data.resources.map(link => (
 *       <ResourceCard key={link.resource.id} resource={link} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useTopicDetails(slug: string | undefined) {
  return useQuery({
    queryKey: topicDetailsKeys.bySlug(slug ?? ""),
    queryFn: () => fetchTopicDetails(slug as string),
    enabled: !!slug,
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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Group resources by relevance level
 *
 * @param resources - Array of topic resource links
 * @returns Object with resources grouped by relevance
 */
export function groupResourcesByRelevance(resources: TopicResourceLink[]) {
  return {
    primary: resources.filter((r) => r.relevance === "primary"),
    supplementary: resources.filter((r) => r.relevance === "supplementary"),
    practice: resources.filter((r) => r.relevance === "practice"),
  };
}

/**
 * Get relevance badge variant for UI
 *
 * @param relevance - Resource relevance level
 * @returns Badge variant name
 */
export function getRelevanceBadgeVariant(
  relevance: ResourceRelevance,
): "default" | "secondary" | "outline" {
  switch (relevance) {
    case "primary":
      return "default";
    case "supplementary":
      return "secondary";
    case "practice":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Get priority badge variant for UI
 *
 * @param priority - Topic priority level
 * @returns Badge variant name
 */
export function getPriorityBadgeVariant(
  priority: "core" | "important" | "optional",
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "core":
      return "destructive";
    case "important":
      return "default";
    case "optional":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Format hours for display
 *
 * @param hours - Number of hours
 * @returns Formatted string
 */
export function formatHours(hours: number): string {
  if (hours === 0) return "Self-paced";
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}

/**
 * Format weightage for display
 *
 * @param weightage - Weightage string (e.g., "15.00")
 * @returns Formatted string or null
 */
export function formatWeightage(weightage: string | null): string | null {
  if (!weightage) return null;
  const num = parseFloat(weightage);
  if (Number.isNaN(num) || num === 0) return null;
  return `${num}%`;
}
