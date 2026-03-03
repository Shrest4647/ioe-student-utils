export type CourseGraphSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: CourseGraphSeverity;
  code: string;
  path: string;
  message: string;
}

export interface GraphEntityRef {
  id?: string;
  slug?: string;
  externalKey?: string;
}

export interface CourseGraphCourseInput {
  id?: string;
  slug?: string;
  code?: string;
  name: string;
  description?: string | null;
  credits?: string | null;
  isActive?: boolean;
  externalKey?: string;
}

export interface CourseGraphResourceLinkInput {
  resourceId: string;
  relevance: "primary" | "supplementary" | "practice";
  sortOrder?: number;
}

export interface CourseGraphPrerequisiteInput {
  topicRef: GraphEntityRef;
  dependencyType: "strong" | "weak";
}

export interface CourseGraphTopicInput {
  id?: string;
  slug?: string;
  name: string;
  description?: string | null;
  priorityLevel: "core" | "important" | "optional";
  hours?: number;
  weightage?: number | null;
  sortOrder?: number;
  parentTopicRef?: GraphEntityRef | null;
  prerequisites?: CourseGraphPrerequisiteInput[];
  resources?: CourseGraphResourceLinkInput[];
  isActive?: boolean;
  externalKey?: string;
}

export interface CourseGraphUnitInput {
  id?: string;
  slug?: string;
  name: string;
  description?: string | null;
  unitType: "module" | "chapter";
  sortOrder?: number;
  topics: CourseGraphTopicInput[];
  isActive?: boolean;
  externalKey?: string;
}

export interface CourseGraphInputV1 {
  schemaVersion: "v1";
  course: CourseGraphCourseInput;
  units: CourseGraphUnitInput[];
}

export interface CourseGraphValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
  };
}

export interface CourseGraphDiffSection {
  course: string[];
  units: string[];
  topics: string[];
  prerequisites: string[];
  resources: string[];
}

export interface CourseGraphDiffResult {
  mode: "create" | "merge" | "replace";
  targetCourseId?: string;
  creates: CourseGraphDiffSection;
  updates: CourseGraphDiffSection;
  deactivations: CourseGraphDiffSection;
  validation: CourseGraphValidationResult;
}

export interface CourseGraphUpsertResult {
  mode: "create" | "merge" | "replace";
  course: {
    id: string;
    slug: string;
    code: string;
    created: boolean;
  };
  created: {
    units: number;
    topics: number;
    prerequisites: number;
    resources: number;
  };
  updated: {
    units: number;
    topics: number;
  };
  deactivated: {
    units: number;
    topics: number;
    prerequisites: number;
    resources: number;
  };
  validation: CourseGraphValidationResult;
}

export const COURSE_GRAPH_LIMITS = {
  maxCourses: 1,
  maxUnits: 200,
  maxTopics: 2000,
  maxPrerequisites: 5000,
  maxResources: 5000,
} as const;

export function buildRefKey(ref: GraphEntityRef): string {
  if (ref.id) return `id:${ref.id}`;
  if (ref.slug) return `slug:${ref.slug}`;
  return `external:${ref.externalKey ?? ""}`;
}
