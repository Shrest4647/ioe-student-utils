import type {
  recommendationLetter,
  recommendationTemplate,
  studentProfileData,
} from "../schema";

// Template types
export type RecommendationTemplate =
  typeof recommendationTemplate.$inferSelect;
export type NewRecommendationTemplate =
  typeof recommendationTemplate.$inferInsert;

// Letter types
export type RecommendationLetter = typeof recommendationLetter.$inferSelect;
export type NewRecommendationLetter = typeof recommendationLetter.$inferInsert;

// Student profile types
export type StudentProfileData = typeof studentProfileData.$inferSelect;
export type NewStudentProfileData = typeof studentProfileData.$inferInsert;

// Template variable types
export type TemplateVariable = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "multiselect";
  required: boolean;
  defaultValue?: string;
  description?: string;
  options?: string[];
};

// Enums
export type LetterStatus = "draft" | "completed" | "exported";
export type TemplateCategory =
  | "research"
  | "academic"
  | "industry"
  | "general"
  | "country_specific";
export type TargetProgramType = "phd" | "masters" | "job" | "funding" | "any";
export type TargetRegion = "us" | "uk" | "eu" | "asia" | "global" | null;

// API Request/Response types
export type CreateLetterRequest = {
  templateId: string;
  title: string;
  recommenderName: string;
  recommenderTitle: string;
  recommenderInstitution: string;
  recommenderEmail?: string;
  recommenderDepartment?: string;
  targetInstitution: string;
  targetProgram: string;
  targetDepartment?: string;
  targetCountry: string;
  purpose: string;
  relationship: string;
  contextOfMeeting?: string;
  studentAchievements?: string;
  researchExperience?: string;
  academicPerformance?: string;
  personalQualities?: string;
  customContent?: string;
};

export type UpdateLetterRequest = Partial<CreateLetterRequest> & {
  finalContent?: string;
  status?: LetterStatus;
  pdfUrl?: string;
  googleDocUrl?: string;
};

export type TemplateQueryParams = {
  category?: TemplateCategory;
  targetProgramType?: TargetProgramType;
  targetRegion?: TargetRegion;
  isActive?: boolean;
};

export type LetterQueryParams = {
  status?: LetterStatus;
  templateId?: string;
  page?: number;
  limit?: number;
};
