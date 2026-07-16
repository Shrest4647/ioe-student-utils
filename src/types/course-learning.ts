import type {
  DependencyType,
  PriorityLevel,
  ResourceRelevance,
  UnitType,
} from "./course-explorer";

export type CourseFocusMode = "overview" | "exam" | "essentials" | "full";
export type CourseWorkspaceView = "outline" | "map";

export interface CourseCatalogItem {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string | null;
  credits: string | null;
  activeUnitCount: number;
  activeTopicCount: number;
  resourceCount: number;
  hasExplorerContent: boolean;
  updatedAt: string | null;
}

export interface CourseCatalogResult {
  data: CourseCatalogItem[];
  metadata: {
    totalCount: number;
    readyCount: number;
    upcomingCount: number;
    currentPage: number;
    totalPages: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface CourseResolution {
  id: string;
  slug: string;
  code: string;
  name: string;
  matchedBy: "slug" | "alias" | "code" | "id";
}

export interface LearningPrerequisite {
  id: string;
  slug: string;
  name: string;
  dependencyType: DependencyType;
}

export interface CourseLearningTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priority: PriorityLevel;
  hours: number;
  weightage: number | null;
  sortOrder: number;
  parentTopicId: string | null;
  resourceCount: number;
  prerequisites: LearningPrerequisite[];
  children: CourseLearningTopic[];
}

export interface CourseLearningUnit {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  unitType: UnitType;
  sortOrder: number;
  estimatedHours: number;
  topicCount: number;
  topics: CourseLearningTopic[];
}

export interface TopicFocusReason {
  slug: string;
  reason: string;
  isPrerequisite: boolean;
}

export interface CoursePlacement {
  id: string;
  program: { id: string; code: string; name: string };
  yearNumber: number | null;
  partNumber: number | null;
  courseType: "core" | "elective" | null;
}

export interface CourseLearningView {
  course: {
    id: string;
    slug: string;
    code: string;
    name: string;
    description: string | null;
    credits: string | null;
    updatedAt: string | null;
  };
  programs: Array<{ id: string; code: string; name: string }>;
  placements: CoursePlacement[];
  readiness: {
    activeUnitCount: number;
    activeTopicCount: number;
    resourceCount: number;
    hasExplorerContent: boolean;
  };
  units: CourseLearningUnit[];
  focus: {
    exam: TopicFocusReason[];
    essentials: TopicFocusReason[];
  };
}

export interface TopicDetailResource {
  id: string;
  title: string;
  description: string | null;
  s3Url: string;
  relevance: ResourceRelevance;
}
