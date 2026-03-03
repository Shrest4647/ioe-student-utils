export type QuizStatus = "draft" | "published" | "archived";
export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuizQuestionType = "single_choice";
export type QuizAttemptStatus = "in_progress" | "completed" | "abandoned";

export interface QuizOptionInput {
  id?: string;
  orderNo: number;
  text: string;
  isCorrect: boolean;
  rationale?: string | null;
}

export interface QuizQuestionInput {
  id?: string;
  orderNo: number;
  prompt: string;
  hint?: string | null;
  rationale?: string | null;
  questionType?: QuizQuestionType;
  points?: number;
  isActive?: boolean;
  options: QuizOptionInput[];
}

export interface QuizInput {
  slug: string;
  title: string;
  description?: string | null;
  status?: QuizStatus;
  difficulty?: QuizDifficulty | null;
  estimatedMinutes?: number | null;
  timeLimitSeconds?: number | null;
  passPercentage?: number;
}

export interface QuizPublicListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: QuizDifficulty | null;
  estimatedMinutes: number | null;
  questionCount: number;
  status: QuizStatus;
  publishedAt: Date | null;
}

export interface QuizOptionView {
  id: string;
  orderNo: number;
  text: string;
  isCorrect?: boolean;
  rationale: string | null;
}

export interface QuizQuestionView {
  id: string;
  orderNo: number;
  prompt: string;
  hint: string | null;
  rationale: string | null;
  questionType: QuizQuestionType;
  points: number;
  isActive: boolean;
  options: QuizOptionView[];
}

export interface QuizView {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: QuizStatus;
  difficulty: QuizDifficulty | null;
  estimatedMinutes: number | null;
  timeLimitSeconds: number | null;
  passPercentage: number;
  version: number;
  publishedAt: Date | null;
  questions: QuizQuestionView[];
}
