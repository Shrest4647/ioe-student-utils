import { computeNextState } from "@/server/services/flashcard-srs";
import type {
  FlashcardDeckView,
  FlashcardReviewRating,
  FlashcardStudyPreferences,
  FlashcardUserCardStateView,
} from "@/types/flashcard-platform";

interface FlashcardRatingControlsProps {
  deck: FlashcardDeckView;
  state: FlashcardUserCardStateView | null;
  preferences: FlashcardStudyPreferences;
  disabled?: boolean;
  onRate: (rating: FlashcardReviewRating) => void;
}

const ratingCopy = {
  again: { label: "Again", description: "Forgot" },
  hard: { label: "Hard", description: "Struggled" },
  good: { label: "Good", description: "Recalled" },
  easy: { label: "Easy", description: "Instant" },
} satisfies Record<
  FlashcardReviewRating,
  { label: string; description: string }
>;

function formatInterval(dueAt: Date, now: Date) {
  const minutes = Math.max(
    1,
    Math.round((dueAt.getTime() - now.getTime()) / 60_000),
  );
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}

export function FlashcardRatingControls({
  deck,
  state,
  preferences,
  disabled,
  onRate,
}: FlashcardRatingControlsProps) {
  const ratings: FlashcardReviewRating[] =
    preferences.confidenceScale === 3
      ? ["again", "good", "easy"]
      : ["again", "hard", "good", "easy"];
  const now = new Date();
  const retention =
    preferences.schedulingAggressiveness === "relaxed"
      ? 0.85
      : preferences.schedulingAggressiveness === "intensive"
        ? 0.94
        : 0.9;

  return (
    <fieldset>
      <legend className="mb-2 w-full text-center text-muted-foreground text-xs">
        How well did you know this?
      </legend>
      <div
        className={`grid gap-2 ${ratings.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}
      >
        {ratings.map((rating, index) => {
          const next = computeNextState({
            policy: {
              srsAlgorithm: deck.srsAlgorithm,
              learningSteps: deck.learningSteps,
              graduatingIntervalDays: deck.graduatingIntervalDays,
              easyIntervalDays: deck.easyIntervalDays,
              desiredRetention: retention,
            },
            previous: state
              ? {
                  ...state,
                  dueAt: new Date(state.dueAt),
                  lastReviewedAt: state.lastReviewedAt
                    ? new Date(state.lastReviewedAt)
                    : null,
                }
              : null,
            rating,
            now,
          });
          return (
            <button
              key={rating}
              type="button"
              disabled={disabled}
              onClick={() => onRate(rating)}
              className="group min-h-14 rounded-xl border bg-background px-2 py-2 text-center outline-none transition-colors hover:border-primary/50 hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="block font-semibold text-sm">
                {ratingCopy[rating].label}
                <kbd className="ml-1.5 hidden font-normal text-[10px] text-muted-foreground sm:inline">
                  {index + 1}
                </kbd>
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {formatInterval(next.dueAt, now)} ·{" "}
                {ratingCopy[rating].description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
