import { CheckCircle2, XCircle } from "lucide-react";
import type { QuizQuestionView } from "@/types/quiz";

interface QuizQuestionProps {
  question: QuizQuestionView;
  selectedOptionIds: string[];
  onSelect: (optionId: string) => void;
}

export function QuizQuestion({
  question,
  selectedOptionIds,
  onSelect,
}: QuizQuestionProps) {
  const selected = selectedOptionIds[0];
  const answered = Boolean(selected);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-xl leading-relaxed">
        {question.prompt}
      </h2>

      {question.hint ? (
        <details className="rounded-md border bg-muted/30 p-3 text-sm">
          <summary className="cursor-pointer font-medium">Show hint</summary>
          <p className="mt-2 text-muted-foreground">{question.hint}</p>
        </details>
      ) : null}

      <div className="space-y-3">
        {question.options.map((option) => {
          const isSelected = selected === option.id;
          const isCorrect = Boolean(option.isCorrect);
          const showCorrect = answered && isCorrect;
          const showIncorrect = answered && isSelected && !isCorrect;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={answered}
              className={`w-full rounded-lg border p-4 text-left transition ${
                showCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : showIncorrect
                    ? "border-destructive bg-destructive/10"
                    : "hover:bg-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex-1">{option.text}</span>
                {showCorrect ? (
                  <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" />
                ) : null}
                {showIncorrect ? (
                  <XCircle className="mt-0.5 size-5 text-destructive" />
                ) : null}
              </div>
              {answered && isSelected && option.rationale ? (
                <p className="mt-2 text-muted-foreground text-sm">
                  {option.rationale}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
