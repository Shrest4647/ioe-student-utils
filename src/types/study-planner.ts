export type StudyPlanGoal = "minimum" | "exam-prep" | "full-coverage";
export type StudyTaskKind = "learn" | "practice" | "review" | "prepare";
export type StudyTopicPriority = "core" | "important" | "optional";

export interface StudyPlanSeed {
  courseSlug?: string;
  topicSlugs?: string[];
  focusMode?: "overview" | "exam" | "essentials" | "full";
  targetDate?: string;
  mode?: "course" | "manual";
}

export type WeekdayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type StudyAvailability = Record<WeekdayKey, number>;

export interface PlanningPrerequisite {
  topicSlug: string;
  dependencyType: "strong" | "weak";
}

export interface PlanningTopic {
  id?: string;
  slug: string;
  name: string;
  unitName?: string;
  hours: number;
  weightage: number | null;
  priority: StudyTopicPriority;
  prerequisites: PlanningPrerequisite[];
  resourceCount?: number;
}

export interface StudyPlanningContext {
  course: {
    id: string;
    slug: string;
    code: string;
    name: string;
    credits: string | null;
  };
  topics: PlanningTopic[];
}

export interface StudyPlanPreviewInput {
  courseSlug?: string;
  subjectName?: string;
  topics?: PlanningTopic[];
  topicSlugs?: string[];
  knownTopicSlugs?: string[];
  goal: StudyPlanGoal;
  startDate: string;
  examDate: string;
  availability: StudyAvailability;
  preferredSessionMinutes?: number;
}

export interface StudyPlanWarning {
  code:
    | "insufficient-capacity"
    | "no-study-days"
    | "empty-selection"
    | "invalid-date-range"
    | "missing-prerequisite"
    | "prerequisite-cycle";
  message: string;
  blocking: boolean;
}

export interface StudyPlanPreviewTask {
  key: string;
  slug: string;
  title: string;
  description: string;
  taskType: StudyTaskKind;
  estimatedMinutes: number;
  topicId?: string;
  topicSlug: string;
  topicName: string;
  scheduledDate: string | null;
  dayNumber: number | null;
  position: number;
  resourceCount: number;
}

export interface StudyPlanPreviewDay {
  date: string;
  dayNumber: number;
  capacityMinutes: number;
  scheduledMinutes: number;
  tasks: StudyPlanPreviewTask[];
}

export interface StudyPlanPreview {
  scheduleVersion: 1;
  subjectName: string;
  courseSlug?: string;
  goal: StudyPlanGoal;
  startDate: string;
  examDate: string;
  availableMinutes: number;
  scheduledMinutes: number;
  unscheduledMinutes: number;
  selectedTopicSlugs: string[];
  knownTopicSlugs: string[];
  warnings: StudyPlanWarning[];
  days: StudyPlanPreviewDay[];
  unscheduledTasks: StudyPlanPreviewTask[];
}

export interface StudyPlanSummary {
  id: string;
  slug: string;
  subjectName: string;
  courseId: string | null;
  goal: string | null;
  examDate: string;
  startDate: string;
  endDate: string;
  progressPercentage: string | null;
  status: string;
  totalTasks?: number;
  completedTasks?: number;
  todayTasks?: number;
  overdueTasks?: number;
}

export interface StudyWorkspaceTask {
  id: string;
  slug: string | null;
  dayNumber: number;
  scheduledDate: string | null;
  position: number;
  title: string;
  description: string | null;
  taskType: string;
  estimatedMinutes: number | null;
  completed: boolean | null;
  completedAt: string | Date | null;
  actualMinutesSpent: number | null;
  notes: string | null;
  topic: {
    slug: string;
    name: string;
    resourceCount: number;
  } | null;
}

export interface StudyPlanWorkspace extends StudyPlanSummary {
  course: { slug: string; code: string; name: string } | null;
  tasks: StudyWorkspaceTask[];
  today: StudyWorkspaceTask[];
  overdue: StudyWorkspaceTask[];
  upcoming: StudyWorkspaceTask[];
}

export interface StudyPlanRebalanceChange {
  taskId: string;
  taskSlug: string | null;
  title: string;
  fromDate: string;
  toDate: string;
}

export interface StudyPlanRebalancePreview {
  planSlug: string;
  changes: StudyPlanRebalanceChange[];
  unscheduledTaskIds: string[];
  message: string;
}

export const DEFAULT_STUDY_AVAILABILITY: StudyAvailability = {
  monday: 90,
  tuesday: 90,
  wednesday: 90,
  thursday: 90,
  friday: 90,
  saturday: 150,
  sunday: 0,
};
