import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizFooterProps {
  canProceed: boolean;
  canGoPrevious: boolean;
  isLastQuestion: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

export function QuizFooter({
  canProceed,
  canGoPrevious,
  isLastQuestion,
  onPrevious,
  onNext,
}: QuizFooterProps) {
  return (
    <footer className="sticky bottom-0 z-10 -mx-4 mt-8 border-t bg-background/95 px-4 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:pt-5 sm:pb-0 sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          className="min-h-11 px-3 sm:min-h-8"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ArrowLeft />
          Previous
        </Button>
        <Button
          className="min-h-11 min-w-32 px-4 text-sm sm:min-h-8"
          onClick={onNext}
          disabled={!canProceed}
        >
          {isLastQuestion ? "Finish" : "Next"}
          <ArrowRight />
        </Button>
      </div>
      <p className="mt-2 hidden text-center text-[0.7rem] text-muted-foreground sm:block">
        Press 1–6 to answer, Enter to continue, B to bookmark
      </p>
    </footer>
  );
}
