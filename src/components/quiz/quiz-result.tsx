import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuizResultProps {
  score: number;
  total: number;
  quizSlug?: string;
  canSaveAttempts?: boolean;
  onRestart: () => void;
}

export function QuizResult({
  score,
  total,
  quizSlug,
  canSaveAttempts = true,
  onRestart,
}: QuizResultProps) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="font-semibold text-3xl">
          {score}/{total}
        </p>
        <p className="text-muted-foreground text-sm">{percentage}% score</p>
        {!canSaveAttempts ? (
          <p className="text-muted-foreground text-sm">
            You’re playing as a guest. Sign in to save your future attempts.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={onRestart}>Retry</Button>
          <Button asChild variant="outline">
            <Link href="/quiz">All Quizzes</Link>
          </Button>
          {quizSlug ? (
            <Button asChild variant="ghost">
              <Link href={`/quiz/${quizSlug}`}>Quiz Page</Link>
            </Button>
          ) : null}
          {!canSaveAttempts ? (
            <>
              <Button asChild variant="default">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
