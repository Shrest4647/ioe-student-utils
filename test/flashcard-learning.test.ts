import { describe, expect, it } from "bun:test";
import { buildFlashcardQueue } from "@/server/services/flashcard-queue";
import {
  computeNextState,
  confidenceToRating,
  estimateRetrievability,
} from "@/server/services/flashcard-srs";
import type {
  FlashcardCardView,
  FlashcardUserCardStateView,
} from "@/types/flashcard-platform";

const now = new Date("2026-07-13T00:00:00.000Z");
const policy = {
  srsAlgorithm: "fsrs" as const,
  learningSteps: [1, 10],
  graduatingIntervalDays: 1,
  easyIntervalDays: 4,
  desiredRetention: 0.9,
};

function card(id: string): FlashcardCardView {
  return {
    id,
    orderNo: Number(id.replace("card-", "")),
    front: `Question ${id}`,
    back: `Answer ${id}`,
    hint: null,
    explanation: null,
    media: null,
    isActive: true,
  };
}

function state(
  cardId: string,
  overrides: Partial<FlashcardUserCardStateView> = {},
): FlashcardUserCardStateView {
  return {
    id: `state-${cardId}`,
    userId: "user-1",
    deckId: "deck-1",
    cardId,
    state: "review",
    dueAt: new Date("2026-07-12T00:00:00.000Z"),
    stability: 4,
    difficulty: 5,
    easeFactor: 2.5,
    intervalDays: 4,
    repetition: 2,
    lapses: 0,
    lastReviewedAt: new Date("2026-07-09T00:00:00.000Z"),
    ...overrides,
  };
}

describe("adaptive flashcard scheduling", () => {
  it("maps configurable confidence scales to scheduling ratings", () => {
    expect(confidenceToRating(1, 4)).toBe("again");
    expect(confidenceToRating(2, 4)).toBe("hard");
    expect(confidenceToRating(3, 4)).toBe("good");
    expect(confidenceToRating(3, 3)).toBe("easy");
  });

  it("schedules easy recall later than hard recall", () => {
    const previous = state("card-1");
    const hard = computeNextState({ policy, previous, rating: "hard", now });
    const easy = computeNextState({ policy, previous, rating: "easy", now });

    expect(easy.intervalDays).toBeGreaterThan(hard.intervalDays);
    expect(easy.difficulty).toBeLessThan(hard.difficulty);
  });

  it("drops retrievability as time passes", () => {
    const previous = state("card-1");
    const early = estimateRetrievability(
      previous,
      new Date("2026-07-10T00:00:00.000Z"),
    );
    const late = estimateRetrievability(
      previous,
      new Date("2026-07-20T00:00:00.000Z"),
    );
    expect(early).toBeGreaterThan(late);
  });

  it("prioritizes difficult overdue cards and limits unseen cards", () => {
    const cards = Array.from({ length: 8 }, (_, index) =>
      card(`card-${index + 1}`),
    );
    const result = buildFlashcardQueue({
      cards,
      states: [
        state("card-1", { difficulty: 3, lapses: 0 }),
        state("card-2", { difficulty: 9, lapses: 4 }),
        state("card-3", { dueAt: new Date("2026-07-20T00:00:00.000Z") }),
      ],
      mode: "adaptive",
      seed: "session-a",
      now,
      newCardsLimit: 2,
      reviewLimit: 10,
    });

    expect(result.items[0]?.card.id).toBe("card-2");
    expect(result.items.filter((item) => item.kind === "new")).toHaveLength(2);
    expect(result.items.some((item) => item.card.id === "card-3")).toBe(false);
  });

  it("uses the session seed so cards do not have a fixed sequence", () => {
    const cards = Array.from({ length: 12 }, (_, index) =>
      card(`card-${index + 1}`),
    );
    const queue = (seed: string) =>
      buildFlashcardQueue({
        cards,
        states: [],
        mode: "random",
        seed,
        now,
        newCardsLimit: 12,
        reviewLimit: 12,
      }).items.map((item) => item.card.id);

    expect(queue("session-a")).not.toEqual(queue("session-b"));
  });
});
