/**
 * TypeScript types for Course Explorer feature
 * Includes mindmap data structures, API responses, and component props
 */

// ============================================================================
// Mindmap Data Types
// ============================================================================

/**
 * Priority level for topics
 */
export type PriorityLevel = "core" | "important" | "optional";

/**
 * Study path filter options
 */
export type StudyPath = "exam-prep" | "minimum" | "all" | undefined;

/**
 * Dependency type for prerequisite relationships
 */
export type DependencyType = "strong" | "weak";

/**
 * Resource relevance level
 */
export type ResourceRelevance = "primary" | "supplementary" | "practice";

/**
 * Unit type for course organization
 */
export type UnitType = "module" | "chapter";

/**
 * Resource linked to a topic
 */
export interface TopicResource {
  id: string;
  title: string;
  description?: string;
  s3Url?: string;
  relevance: ResourceRelevance;
}

/**
 * Mindmap node representing a course topic
 */
export interface MindmapNode {
  id: string;
  label: string;
  slug: string;
  level: number;
  priority: PriorityLevel;
  weightage: string | null;
  hours: number;
  description: string | null;
  unitId: string;
  unitName: string;
  resources: TopicResource[];
}

/**
 * Mindmap edge representing prerequisite relationship
 */
export interface MindmapEdge {
  from: string;
  to: string;
  type: DependencyType;
}

/**
 * Course information in mindmap response
 */
export interface MindmapCourse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

/**
 * Complete mindmap data response from API
 */
export interface MindmapData {
  course: MindmapCourse;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

/**
 * API response wrapper for mindmap data
 */
export interface MindmapApiResponse {
  success: boolean;
  data: MindmapData;
  error?: string;
}

// ============================================================================
// React Flow Integration Types
// ============================================================================

import type { Edge, Node } from "@xyflow/react";

/**
 * Extended node data for React Flow custom nodes
 * Must satisfy Record<string, unknown> constraint for React Flow
 */
export interface MindmapNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  slug: string;
  priority: PriorityLevel;
  hours: number;
  weightage: string | null;
  description: string | null;
  unitName: string;
  resourceCount: number;
}

/**
 * React Flow node type for mindmap
 */
export type MindmapFlowNode = Node<MindmapNodeData>;

/**
 * Extended edge data for React Flow custom edges
 * Must satisfy Record<string, unknown> constraint for React Flow
 */
export interface MindmapEdgeData extends Record<string, unknown> {
  type: DependencyType;
}

/**
 * React Flow edge type for mindmap
 */
export type MindmapFlowEdge = Edge<MindmapEdgeData>;

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for MindmapView component
 */
export interface MindmapViewProps {
  /** Course slug to fetch mindmap data for */
  courseSlug: string;
  /** Optional study path filter */
  path?: StudyPath;
  /** Callback when a node is clicked */
  onNodeClick?: (node: MindmapFlowNode) => void;
  /** Callback when study path changes (for controlled components) */
  onPathChange?: (path: StudyPath) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for custom node component
 */
export interface MindmapNodeProps {
  id: string;
  data: MindmapNodeData;
  selected?: boolean;
}

/**
 * Props for custom edge component
 */
export interface MindmapEdgeProps {
  id: string;
  source: string;
  target: string;
  data?: MindmapEdgeData;
}

// ============================================================================
// Course/Unit/Topic Types
// ============================================================================

/**
 * Basic course information
 */
export interface Course {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  code: string | null;
  credits: number | null;
  isActive: boolean;
}

/**
 * Course unit information
 */
export interface CourseUnit {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  unitType: UnitType;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Course topic information
 */
export interface CourseTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priorityLevel: PriorityLevel;
  hours: number;
  weightage: string | null;
  sortOrder: number;
  isActive: boolean;
  parentTopicId?: string | null;
}

/**
 * Prerequisite relationship
 */
export interface TopicPrerequisite {
  id: string;
  topicId: string;
  prerequisiteTopicId: string;
  dependencyType: DependencyType;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic API success response
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/**
 * Generic API response type
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Paginated response metadata
 */
export interface PaginationMetadata {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T[];
  metadata: PaginationMetadata;
}
