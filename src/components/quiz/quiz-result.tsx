import { ArrowRight, BookOpen, RotateCcw, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { QuizQuestionView } from "@/types/quiz";
import type { QuizRuntimeAnswer } from "./use-quiz";

interface QuizResultProps {
  answers: QuizRuntimeAnswer[];
  questions: QuizQuestionView[];
  quizSlug?: string;
  canSaveAttempts?: boolean;
  timeSpentSeconds: number;
  onRestart: () => void;
}

export function QuizResult({
  answers,
  questions,
  quizSlug,
  canSaveAttempts = true,
  timeSpentSeconds,
  onRestart,
}: QuizResultProps) {
  const score = answers.filter((answer) => answer.isCorrect).length;
  const total = questions.length;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const missed = answers.filter((answer) => !answer.isCorrect);
  const questionMap = new Map(
    questions.map((question) => [question.id, question]),
  );
  const minutes = Math.max(1, Math.round(timeSpentSeconds / 60));

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="border-b pb-8">
        <p className="mb-2 font-medium text-primary text-sm">
          Session complete
        </p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {percentage >= 80
            ? "Strong recall"
            : percentage >= 60
              ? "Good progress"
              : "Keep building the pattern"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          You answered {score} of {total} questions correctly in {minutes} min.
        </p>
      </div>

      <div className="grid gap-8 py-8 sm:grid-cols-[1fr_1.4fr]">
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-semibold text-5xl tracking-tight">
                {percentage}%
              </p>
              <p className="mt-1 text-muted-foreground text-sm">accuracy</p>
            </div>
            <Target className="mb-1 size-7 text-primary" />
          </div>
          <Progress value={percentage} className="mt-5 h-2" />
          <dl className="mt-6 space-y-3 border-t pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Correct</dt>
              <dd className="font-medium">{score}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Needs review</dt>
              <dd className="font-medium">{missed.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Time studied</dt>
              <dd className="font-medium">{minutes} min</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="font-semibold text-lg">
            {missed.length ? "Recommended review" : "Everything held"}
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {missed.length
              ? "These questions will appear earlier in your next practice session."
              : "Try another shuffled session later to strengthen long-term recall."}
          </p>
          {missed.length ? (
            <ol className="mt-4 divide-y rounded-lg border px-4">
              {missed.slice(0, 4).map((answer) => (
                <li key={answer.questionId} className="py-3 text-sm">
                  <p>
                    <span className="mr-2 text-muted-foreground">
                      {answers.findIndex(
                        (item) => item.questionId === answer.questionId,
                      ) + 1}
                      .
                    </span>
                    {questionMap.get(answer.questionId)?.prompt}
                  </p>
                  <p className="mt-1.5 pl-5 text-muted-foreground text-xs leading-relaxed">
                    Correct answer:{" "}
                    {questionMap
                      .get(answer.questionId)
                      ?.options.filter((option) => option.isCorrect)
                      .map((option) => option.text)
                      .join(", ")}
                  </p>
                  {questionMap.get(answer.questionId)?.rationale ? (
                    <p className="mt-1 pl-5 text-muted-foreground text-xs leading-relaxed">
                      {questionMap.get(answer.questionId)?.rationale}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-primary/5 p-4 text-sm">
              <BookOpen className="size-5 text-primary" />
              No missed questions in this session.
            </div>
          )}
        </div>
      </div>

      {!canSaveAttempts ? (
        <div className="mb-6 rounded-xl border bg-muted/40 p-4">
          <p className="font-medium text-sm">Keep this progress</p>
          <p className="mt-1 text-muted-foreground text-sm">
            This session is saved on this device. Sign in to sync study history
            across devices.
          </p>
          <Button asChild variant="outline" className="mt-3 min-h-10">
            <Link href="/auth/signin">Sign in to sync</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" className="min-h-11 sm:min-h-8">
          <Link href="/quiz">Browse quizzes</Link>
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="min-h-11 flex-1 sm:min-h-8"
            onClick={onRestart}
          >
            <RotateCcw />
            New session
          </Button>
          {quizSlug && missed.length > 0 ? (
            <Button asChild className="min-h-11 flex-1 sm:min-h-8">
              <Link href={`/quiz/${quizSlug}?mode=review_incorrect`}>
                Review missed
                <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
