import { Button } from "@/components/ui/button";
import type { FlashcardReviewRating } from "@/types/flashcard-platform";

interface FlashcardControlsProps {
  currentRating?: FlashcardReviewRating;
  isLastCard: boolean;
  onRate: (rating: FlashcardReviewRating) => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
}

const ratings: FlashcardReviewRating[] = ["again", "hard", "good", "easy"];

export function FlashcardControls({
  currentRating,
  isLastCard,
  onRate,
  onNext,
  onPrevious,
  canGoPrevious,
}: FlashcardControlsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {ratings.map((rating) => (
          <Button
            key={rating}
            type="button"
            variant={currentRating === rating ? "default" : "outline"}
            className="capitalize"
            onClick={() => onRate(rating)}
          >
            {rating}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          Previous
        </Button>
        <Button type="button" onClick={onNext}>
          {isLastCard ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}
