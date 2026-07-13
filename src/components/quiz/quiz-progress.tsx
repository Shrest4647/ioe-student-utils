import { Clock3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  current: number;
  total: number;
  progress: number;
  score: number;
  remainingSeconds?: number | null;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function QuizProgress({
  current,
  total,
  progress,
  score,
  remainingSeconds,
}: QuizProgressProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <p className="font-medium">
          Question {current}
          <span className="font-normal text-muted-foreground"> of {total}</span>
        </p>
        <div className="flex items-center gap-4 text-muted-foreground text-xs">
          <span>{score} correct</span>
          {remainingSeconds !== null && remainingSeconds !== undefined ? (
            <span className="flex items-center gap-1 font-medium tabular-nums">
              <Clock3 className="size-3.5" />
              {formatTime(remainingSeconds)}
            </span>
          ) : null}
        </div>
      </div>
      <Progress
        value={progress}
        aria-label={`${Math.round(progress)}% of quiz completed`}
        className="h-1.5"
      />
    </div>
  );
}
