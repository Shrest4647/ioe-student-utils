import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  current: number;
  total: number;
  progress: number;
}

export function QuizProgress({ current, total, progress }: QuizProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          Question {current} of {total}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
