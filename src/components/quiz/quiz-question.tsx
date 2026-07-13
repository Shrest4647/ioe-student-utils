import { Check, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizConfidence, QuizQuestionView } from "@/types/quiz";
import type { QuizRuntimeAnswer } from "./use-quiz";

interface QuizQuestionProps {
  question: QuizQuestionView;
  selectedOptionIds: string[];
  answer?: QuizRuntimeAnswer;
  showFeedback: boolean;
  onSelect: (optionId: string) => void;
  onSubmit: () => void;
  onConfidence: (confidence: QuizConfidence) => void;
}

const choiceKeys = ["A", "B", "C", "D", "E", "F"];

export function QuizQuestion({
  question,
  selectedOptionIds,
  answer,
  showFeedback,
  onSelect,
  onSubmit,
  onConfidence,
}: QuizQuestionProps) {
  const answered = Boolean(answer);
  const isMultiple = question.questionType === "multiple_select";

  return (
    <div>
      <div className="mb-6">
        {isMultiple ? (
          <p className="mb-2 font-medium text-primary text-xs uppercase tracking-wide">
            Select all that apply
          </p>
        ) : null}
        <h2 className="max-w-[70ch] text-balance font-semibold text-2xl leading-snug tracking-tight sm:text-[1.7rem]">
          {question.prompt}
        </h2>
      </div>

      {question.hint && !answered ? (
        <details className="mb-5 rounded-lg bg-muted/60 px-4 py-3 text-sm">
          <summary className="cursor-pointer select-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Need a hint?
          </summary>
          <p className="mt-2 max-w-[68ch] text-muted-foreground leading-relaxed">
            {question.hint}
          </p>
        </details>
      ) : null}

      <div className="space-y-2.5" role="group" aria-label="Answer choices">
        {question.options.map((option, index) => {
          const isSelected = selectedOptionIds.includes(option.id);
          const isCorrect = Boolean(option.isCorrect);
          const showCorrect = showFeedback && answered && isCorrect;
          const showIncorrect =
            showFeedback && answered && isSelected && !isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={answered}
              aria-pressed={isSelected}
              className={cn(
                "group flex min-h-14 w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left outline-none transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.995] disabled:cursor-default disabled:opacity-100 sm:px-4",
                isSelected && !showFeedback && "border-primary bg-primary/5",
                showCorrect && "border-primary bg-primary/8",
                showIncorrect && "border-destructive bg-destructive/5",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md border bg-background font-semibold text-muted-foreground text-xs",
                  isSelected &&
                    "border-primary bg-primary text-primary-foreground",
                  showCorrect &&
                    "border-primary bg-primary text-primary-foreground",
                  showIncorrect &&
                    "border-destructive bg-destructive text-destructive-foreground",
                )}
              >
                {showCorrect ? (
                  <Check className="size-4" />
                ) : showIncorrect ? (
                  <XCircle className="size-4" />
                ) : (
                  (choiceKeys[index] ?? index + 1)
                )}
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block text-sm leading-relaxed sm:text-base">
                  {option.text}
                </span>
                {showFeedback && answered && option.rationale ? (
                  <span className="mt-1.5 block text-muted-foreground text-sm leading-relaxed">
                    {option.rationale}
                  </span>
                ) : null}
              </span>
              {showCorrect ? (
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      {isMultiple && !answered ? (
        <Button
          className="mt-4 min-h-11 w-full sm:w-auto"
          disabled={selectedOptionIds.length === 0}
          onClick={onSubmit}
        >
          Check answer
        </Button>
      ) : null}

      {showFeedback && answer ? (
        <div
          className={cn(
            "mt-6 rounded-xl border p-4",
            answer.isCorrect
              ? "border-primary/30 bg-primary/5"
              : "border-destructive/30 bg-destructive/5",
          )}
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">
            {answer.isCorrect ? "Correct" : "Not quite"}
          </p>
          {question.rationale ? (
            <p className="mt-1 max-w-[68ch] text-muted-foreground text-sm leading-relaxed">
              {question.rationale}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-muted-foreground text-xs">
              How confident were you?
            </span>
            {([1, 2, 3] as const).map((confidence) => (
              <button
                key={confidence}
                type="button"
                onClick={() => onConfidence(confidence)}
                aria-pressed={answer.confidence === confidence}
                className={cn(
                  "min-h-9 rounded-md border px-3 font-medium text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  answer.confidence === confidence &&
                    "border-primary bg-primary text-primary-foreground",
                )}
              >
                {confidence === 1
                  ? "Guessing"
                  : confidence === 2
                    ? "Unsure"
                    : "Confident"}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
