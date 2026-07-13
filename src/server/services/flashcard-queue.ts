import type {
  FlashcardCardView,
  FlashcardQueueItem,
  FlashcardQueueSummary,
  FlashcardStudyMode,
  FlashcardUserCardStateView,
} from "@/types/flashcard-platform";
import { estimateRetrievability } from "./flashcard-srs";

interface BuildFlashcardQueueInput {
  cards: FlashcardCardView[];
  states: FlashcardUserCardStateView[];
  mode: FlashcardStudyMode;
  seed: string;
  now: Date;
  newCardsLimit: number;
  reviewLimit: number;
}

function seededUnit(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4_294_967_296;
}

function shuffleScore(seed: string, cardId: string) {
  return seededUnit(`${seed}:${cardId}`);
}

function statePriority(state: FlashcardUserCardStateView, now: Date) {
  const overdueDays = Math.max(
    0,
    (now.getTime() - new Date(state.dueAt).getTime()) / 86_400_000,
  );
  const retrievability = estimateRetrievability(
    {
      stability: state.stability,
      lastReviewedAt: state.lastReviewedAt
        ? new Date(state.lastReviewedAt)
        : null,
    },
    now,
  );
  return (
    overdueDays * 4 +
    state.difficulty * 2 +
    state.lapses * 3 +
    (1 - retrievability) * 10
  );
}

export function buildFlashcardQueue({
  cards,
  states,
  mode,
  seed,
  now,
  newCardsLimit,
  reviewLimit,
}: BuildFlashcardQueueInput): {
  items: FlashcardQueueItem[];
  summary: FlashcardQueueSummary;
} {
  const stateByCard = new Map(states.map((state) => [state.cardId, state]));
  const allItems = cards.map((card): FlashcardQueueItem => {
    const state = stateByCard.get(card.id) ?? null;
    const isDue = Boolean(state && new Date(state.dueAt) <= now);
    const retrievability = state
      ? estimateRetrievability(
          {
            stability: state.stability,
            lastReviewedAt: state.lastReviewedAt
              ? new Date(state.lastReviewedAt)
              : null,
          },
          now,
        )
      : null;
    return {
      card,
      state,
      kind: state ? (isDue ? "due" : "extra") : "new",
      priority: state ? statePriority(state, now) : shuffleScore(seed, card.id),
      retrievability,
    };
  });

  let items: FlashcardQueueItem[];
  if (mode === "random") {
    items = [...allItems]
      .sort(
        (left, right) =>
          shuffleScore(seed, left.card.id) - shuffleScore(seed, right.card.id),
      )
      .slice(0, reviewLimit);
  } else if (mode === "cram") {
    items = [...allItems]
      .sort(
        (left, right) =>
          right.priority - left.priority ||
          shuffleScore(seed, left.card.id) - shuffleScore(seed, right.card.id),
      )
      .slice(0, reviewLimit);
  } else {
    const due = allItems
      .filter((item) => item.kind === "due")
      .sort(
        (left, right) =>
          right.priority - left.priority ||
          shuffleScore(seed, left.card.id) - shuffleScore(seed, right.card.id),
      );
    const fresh = allItems
      .filter((item) => item.kind === "new")
      .sort(
        (left, right) =>
          shuffleScore(seed, left.card.id) - shuffleScore(seed, right.card.id),
      )
      .slice(0, newCardsLimit);
    items = [...due, ...fresh].slice(0, reviewLimit);
  }

  const learning = states.filter(
    (state) => state.state === "learning" || state.state === "relearning",
  ).length;
  const due = allItems.filter((item) => item.kind === "due").length;
  const fresh = allItems.filter((item) => item.kind === "new").length;

  return {
    items,
    summary: {
      due,
      new: fresh,
      learning,
      total: items.length,
      estimatedMinutes: Math.max(1, Math.ceil(items.length * 0.45)),
    },
  };
}
