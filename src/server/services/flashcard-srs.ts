import type {
  FlashcardLearningState,
  FlashcardReviewRating,
} from "@/types/flashcard-platform";

export interface FlashcardSrsPolicy {
  srsAlgorithm: "sm2" | "fsrs";
  learningSteps: number[];
  graduatingIntervalDays: number;
  easyIntervalDays: number;
}

export interface FlashcardSrsState {
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

export interface FlashcardSrsInput {
  policy: FlashcardSrsPolicy;
  previous: FlashcardSrsState | null;
  rating: FlashcardReviewRating;
  now: Date;
}

const ratingToRecall: Record<FlashcardReviewRating, boolean> = {
  again: false,
  hard: true,
  good: true,
  easy: true,
};

function addMinutes(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * 60 * 1000);
}

function addDays(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

function nextSm2State({ policy, previous, rating, now }: FlashcardSrsInput) {
  const prev =
    previous ??
    ({
      state: "new",
      dueAt: now,
      stability: 0,
      difficulty: 0,
      easeFactor: 2.5,
      intervalDays: 0,
      repetition: 0,
      lapses: 0,
      lastReviewedAt: null,
    } satisfies FlashcardSrsState);

  let repetition = prev.repetition;
  let lapses = prev.lapses;
  let easeFactor = prev.easeFactor;
  let intervalDays = prev.intervalDays;
  let state: FlashcardLearningState = prev.state;

  if (rating === "again") {
    repetition = 0;
    lapses += 1;
    intervalDays = 0;
    state = prev.state === "new" ? "learning" : "relearning";
    const step = policy.learningSteps[0] ?? 1;
    return {
      state,
      dueAt: addMinutes(now, step),
      stability: Math.max(0, prev.stability - 0.5),
      difficulty: Math.min(10, prev.difficulty + 0.5),
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      intervalDays,
      repetition,
      lapses,
      lastReviewedAt: now,
    } satisfies FlashcardSrsState;
  }

  if (
    prev.state === "new" ||
    prev.state === "learning" ||
    prev.state === "relearning"
  ) {
    const firstStep = policy.learningSteps[0] ?? 1;
    const secondStep = policy.learningSteps[1] ?? 10;

    if (prev.repetition === 0 && rating === "hard") {
      return {
        state: "learning",
        dueAt: addMinutes(now, firstStep),
        stability: prev.stability + 0.2,
        difficulty: Math.max(0, prev.difficulty - 0.1),
        easeFactor: Math.max(1.3, easeFactor - 0.05),
        intervalDays: 0,
        repetition: 1,
        lapses,
        lastReviewedAt: now,
      } satisfies FlashcardSrsState;
    }

    if (rating === "hard") {
      return {
        state: "learning",
        dueAt: addMinutes(now, secondStep),
        stability: prev.stability + 0.3,
        difficulty: Math.max(0, prev.difficulty - 0.2),
        easeFactor: Math.max(1.3, easeFactor - 0.03),
        intervalDays: 0,
        repetition: prev.repetition + 1,
        lapses,
        lastReviewedAt: now,
      } satisfies FlashcardSrsState;
    }

    intervalDays =
      rating === "easy"
        ? policy.easyIntervalDays
        : policy.graduatingIntervalDays;

    return {
      state: "review",
      dueAt: addDays(now, intervalDays),
      stability: prev.stability + (rating === "easy" ? 1.2 : 0.8),
      difficulty: Math.max(
        0,
        prev.difficulty - (rating === "easy" ? 0.4 : 0.2),
      ),
      easeFactor: Math.min(3.0, easeFactor + (rating === "easy" ? 0.15 : 0.05)),
      intervalDays,
      repetition: prev.repetition + 1,
      lapses,
      lastReviewedAt: now,
    } satisfies FlashcardSrsState;
  }

  if (rating === "hard") {
    easeFactor = Math.max(1.3, easeFactor - 0.05);
    intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
  } else if (rating === "good") {
    intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
  } else {
    easeFactor = Math.min(3.0, easeFactor + 0.1);
    intervalDays = Math.max(1, Math.round(intervalDays * (easeFactor + 0.2)));
  }

  return {
    state: "review",
    dueAt: addDays(now, intervalDays),
    stability: prev.stability + (rating === "easy" ? 1.0 : 0.6),
    difficulty: Math.max(0, prev.difficulty - (rating === "easy" ? 0.3 : 0.1)),
    easeFactor,
    intervalDays,
    repetition: repetition + 1,
    lapses,
    lastReviewedAt: now,
  } satisfies FlashcardSrsState;
}

function nextFsrsState(input: FlashcardSrsInput) {
  // v1 approximation. Keeps a separate strategy key while returning a deterministic schedule.
  const sm2 = nextSm2State(input);
  const factor =
    input.rating === "again"
      ? 0.5
      : input.rating === "hard"
        ? 0.8
        : input.rating === "good"
          ? 1.1
          : 1.35;
  const intervalDays =
    input.rating === "again"
      ? 0
      : Math.max(1, Math.round(sm2.intervalDays * factor));
  const dueAt =
    intervalDays === 0
      ? addMinutes(input.now, input.policy.learningSteps[0] ?? 1)
      : addDays(input.now, intervalDays);

  return {
    ...sm2,
    dueAt,
    intervalDays,
    stability: Math.max(0, sm2.stability * factor),
  } satisfies FlashcardSrsState;
}

export function computeNextState(input: FlashcardSrsInput): FlashcardSrsState {
  return input.policy.srsAlgorithm === "fsrs"
    ? nextFsrsState(input)
    : nextSm2State(input);
}

export function isRatingRecalled(rating: FlashcardReviewRating) {
  return ratingToRecall[rating];
}
