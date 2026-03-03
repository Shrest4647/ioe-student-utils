export type FlashcardDeckStatus = "draft" | "published" | "archived";
export type FlashcardDifficulty = "easy" | "medium" | "hard";
export type FlashcardSrsAlgorithm = "sm2" | "fsrs";
export type FlashcardSessionStatus = "in_progress" | "completed" | "abandoned";
export type FlashcardReviewRating = "again" | "hard" | "good" | "easy";
export type FlashcardLearningState =
  | "new"
  | "learning"
  | "review"
  | "relearning";

export interface FlashcardDeckInput {
  slug?: string;
  title: string;
  description?: string | null;
  status?: FlashcardDeckStatus;
  difficulty?: FlashcardDifficulty | null;
  estimatedMinutes?: number | null;
  language?: string | null;
  srsAlgorithm?: FlashcardSrsAlgorithm;
  newCardsPerDay?: number;
  maxReviewsPerDay?: number;
  learningSteps?: number[];
  graduatingIntervalDays?: number;
  easyIntervalDays?: number;
}

export interface FlashcardCardInput {
  id?: string;
  orderNo: number;
  front: string;
  back: string;
  hint?: string | null;
  explanation?: string | null;
  media?: Record<string, unknown> | null;
  isActive?: boolean;
}

export interface FlashcardTagInput {
  name: string;
  slug?: string;
}

export interface FlashcardDeckListItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: FlashcardDifficulty | null;
  estimatedMinutes: number | null;
  cardCount: number;
  status: FlashcardDeckStatus;
  publishedAt: Date | null;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface FlashcardCardView {
  id: string;
  orderNo: number;
  front: string;
  back: string;
  hint: string | null;
  explanation: string | null;
  media: Record<string, unknown> | null;
  isActive: boolean;
}

export interface FlashcardDeckView {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: FlashcardDeckStatus;
  difficulty: FlashcardDifficulty | null;
  estimatedMinutes: number | null;
  language: string | null;
  srsAlgorithm: FlashcardSrsAlgorithm;
  newCardsPerDay: number;
  maxReviewsPerDay: number;
  learningSteps: number[];
  graduatingIntervalDays: number;
  easyIntervalDays: number;
  version: number;
  publishedAt: Date | null;
  tags: Array<{ id: string; name: string; slug: string }>;
  cards: FlashcardCardView[];
}

export interface FlashcardUserCardStateView {
  id: string;
  userId: string;
  deckId: string;
  cardId: string;
  state: FlashcardLearningState;
  dueAt: Date;
  stability: number;
  difficulty: number;
  easeFactor: number;
  intervalDays: number;
  repetition: number;
  lapses: number;
  lastReviewedAt: Date | null;
}
