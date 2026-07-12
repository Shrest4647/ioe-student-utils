import { Button } from "@/components/ui/button";

interface QuizFooterProps {
  canProceed: boolean;
  isLastQuestion: boolean;
  onNext: () => void;
}

export function QuizFooter({
  canProceed,
  isLastQuestion,
  onNext,
}: QuizFooterProps) {
  return (
    <div className="flex justify-end">
      <Button onClick={onNext} disabled={!canProceed}>
        {isLastQuestion ? "Finish Quiz" : "Next Question"}
      </Button>
    </div>
  );
}
