export type FlashcardDeckStatus = "draft" | "published" | "archived";
export type FlashcardDifficulty = "easy" | "medium" | "hard";
export type FlashcardSrsAlgorithm = "sm2" | "fsrs";
export type FlashcardSessionStatus = "in_progress" | "completed" | "abandoned";
export type FlashcardReviewRating = "again" | "hard" | "good" | "easy";
export type FlashcardStudyMode = "adaptive" | "random" | "cram";
export type FlashcardSchedulingAggressiveness =
  | "relaxed"
  | "balanced"
  | "intensive";
export type FlashcardAppearance = "comfortable" | "compact";
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
  media: FlashcardMedia | null;
  isActive: boolean;
}

export interface FlashcardMediaItem {
  type: "image" | "audio" | "video" | "diagram";
  src: string;
  alt?: string;
  caption?: string;
  captionsSrc?: string;
  poster?: string;
}

export interface FlashcardMedia {
  front?: FlashcardMediaItem[];
  back?: FlashcardMediaItem[];
}

export interface FlashcardStudyPreferences {
  studyMode: FlashcardStudyMode;
  schedulingAggressiveness: FlashcardSchedulingAggressiveness;
  confidenceScale: 3 | 4;
  newCardsPerDay: number | null;
  maxReviewsPerDay: number | null;
  autoAdvance: boolean;
  showHints: boolean;
  appearance: FlashcardAppearance;
}

export interface FlashcardQueueItem {
  card: FlashcardCardView;
  state: FlashcardUserCardStateView | null;
  kind: "due" | "new" | "extra";
  priority: number;
  retrievability: number | null;
}

export interface FlashcardQueueSummary {
  due: number;
  new: number;
  learning: number;
  total: number;
  estimatedMinutes: number;
}

export interface FlashcardAnalytics {
  reviewStreakDays: number;
  masteryPercentage: number;
  retentionPercentage: number;
  accuracyPercentage: number;
  averageConfidence: number | null;
  totalReviews: number;
  totalCards: number;
  cardsSeen: number;
  timeSpentSeconds: number;
  dueToday: number;
  dueNextSevenDays: number;
  trends: Array<{
    date: string;
    reviews: number;
    accuracyPercentage: number;
    averageConfidence: number | null;
  }>;
  difficultCards: Array<{
    cardId: string;
    front: string;
    difficulty: number;
    lapses: number;
    retentionPercentage: number;
  }>;
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
