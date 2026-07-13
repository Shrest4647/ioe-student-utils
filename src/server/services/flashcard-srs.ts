import type {
  FlashcardLearningState,
  FlashcardReviewRating,
} from "@/types/flashcard-platform";

export interface FlashcardSrsPolicy {
  srsAlgorithm: "sm2" | "fsrs";
  learningSteps: number[];
  graduatingIntervalDays: number;
  easyIntervalDays: number;
  desiredRetention?: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function estimateRetrievability(
  state: Pick<FlashcardSrsState, "stability" | "lastReviewedAt">,
  now: Date,
) {
  if (!state.lastReviewedAt || state.stability <= 0) return 0;
  const elapsedDays = Math.max(
    0,
    (now.getTime() - state.lastReviewedAt.getTime()) / 86_400_000,
  );
  return clamp(Math.exp(-elapsedDays / state.stability), 0, 1);
}

function nextFsrsState({ policy, previous, rating, now }: FlashcardSrsInput) {
  const prev =
    previous ??
    ({
      state: "new",
      dueAt: now,
      stability: 0,
      difficulty: 5,
      easeFactor: 2.5,
      intervalDays: 0,
      repetition: 0,
      lapses: 0,
      lastReviewedAt: null,
    } satisfies FlashcardSrsState);
  const desiredRetention = clamp(policy.desiredRetention ?? 0.9, 0.75, 0.97);
  const retrievability = estimateRetrievability(prev, now);
  const ratingWeight = { again: 1, hard: 2, good: 3, easy: 4 }[rating];
  const difficulty = clamp(
    prev.difficulty + (3 - ratingWeight) * 0.7 - (ratingWeight === 4 ? 0.2 : 0),
    1,
    10,
  );

  if (rating === "again") {
    const stability = Math.max(0.15, prev.stability * 0.35);
    return {
      state: prev.state === "new" ? "learning" : "relearning",
      dueAt: addMinutes(now, policy.learningSteps[0] ?? 1),
      stability,
      difficulty,
      easeFactor: Math.max(1.3, prev.easeFactor - 0.2),
      intervalDays: 0,
      repetition: 0,
      lapses: prev.lapses + 1,
      lastReviewedAt: now,
    } satisfies FlashcardSrsState;
  }

  const initialStability =
    rating === "hard" ? 0.6 : rating === "good" ? 1.4 : 3.5;
  const recallBonus = 1 + (1 - retrievability) * (11 - difficulty) * 0.12;
  const ratingBonus = rating === "hard" ? 0.75 : rating === "easy" ? 1.45 : 1;
  const stability = Math.max(
    initialStability,
    (prev.stability || initialStability) * recallBonus * ratingBonus,
  );
  const intervalMultiplier = Math.log(desiredRetention) / Math.log(0.9);
  const intervalDays = Math.max(1, Math.round(stability * intervalMultiplier));

  return {
    state: "review",
    dueAt: addDays(now, intervalDays),
    stability,
    difficulty,
    easeFactor: clamp(
      prev.easeFactor +
        (rating === "easy" ? 0.1 : rating === "hard" ? -0.05 : 0),
      1.3,
      3,
    ),
    intervalDays,
    repetition: prev.repetition + 1,
    lapses: prev.lapses,
    lastReviewedAt: now,
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

export function confidenceToRating(
  confidence: number,
  scale: 3 | 4 = 4,
): FlashcardReviewRating {
  const bounded = Math.round(clamp(confidence, 1, scale));
  if (scale === 3) {
    return bounded === 1 ? "again" : bounded === 2 ? "good" : "easy";
  }
  return (["again", "again", "hard", "good", "easy"] as const)[bounded];
}

export function ratingToConfidence(
  rating: FlashcardReviewRating,
  scale: 3 | 4 = 4,
) {
  if (scale === 3) {
    return rating === "again" ? 1 : rating === "easy" ? 3 : 2;
  }
  return { again: 1, hard: 2, good: 3, easy: 4 }[rating];
}
