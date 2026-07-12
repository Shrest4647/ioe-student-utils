import { Progress } from "@/components/ui/progress";

interface FlashcardProgressProps {
  current: number;
  total: number;
  progress: number;
}

export function FlashcardProgress({
  current,
  total,
  progress,
}: FlashcardProgressProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          Card {current} of {total}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
