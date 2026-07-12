"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";
import type { QuizView } from "@/types/quiz";
import { QuizFooter } from "./quiz-footer";
import { QuizProgress } from "./quiz-progress";
import { QuizQuestion } from "./quiz-question";
import { QuizResult } from "./quiz-result";
import { useQuiz } from "./use-quiz";

interface QuizPlayerProps {
  quiz: QuizView;
  onPhaseChange?: (phase: "not_started" | "in_progress" | "completed") => void;
}

export function QuizPlayer({ quiz, onPhaseChange }: QuizPlayerProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [guestStarted, setGuestStarted] = useState(false);
  const startAttempt = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.quizzes
        .quiz({ quizId: quiz.id })
        .attempts.post({
          guestSessionId: crypto.randomUUID(),
        });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to start attempt");
      }
      queryClient.invalidateQueries({
        queryKey: ["quiz", "attempts", "mine", quiz.id],
      });
      return response.data.data;
    },
  });

  const answerMutation = useMutation({
    mutationFn: async (payload: {
      questionId: string;
      selectedOptionIds: string[];
    }) => {
      if (!startAttempt.data?.id) return;
      await apiClient.api.quizzes
        .attempts({ attemptId: startAttempt.data.id })
        .answer.patch({
          questionId: payload.questionId,
          selectedOptionIds: payload.selectedOptionIds,
        });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (timeSpentSeconds: number) => {
      if (!startAttempt.data?.id) return;
      await apiClient.api.quizzes
        .attempts({ attemptId: startAttempt.data.id })
        .complete.post({ timeSpentSeconds });
      queryClient.invalidateQueries({
        queryKey: ["quiz", "attempts", "mine", quiz.id],
      });
    },
  });

  const runtime = useQuiz({
    quiz,
    onAnswer: async ({ questionId, selectedOptionIds }) => {
      if (!isAuthenticated) return;
      await answerMutation.mutateAsync({ questionId, selectedOptionIds });
    },
    onComplete: async ({ timeSpentSeconds }) => {
      if (!isAuthenticated) return;
      await completeMutation.mutateAsync(timeSpentSeconds);
    },
  });

  const phase: "not_started" | "in_progress" | "completed" =
    !runtime.isComplete &&
    ((isAuthenticated &&
      !startAttempt.data &&
      !startAttempt.isPending &&
      !guestStarted) ||
      (!isAuthenticated && !guestStarted))
      ? "not_started"
      : runtime.isComplete
        ? "completed"
        : "in_progress";

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  const description =
    quiz.description?.trim() || "Test your understanding with this quiz.";
  const estimatedMinutes =
    quiz.estimatedMinutes && quiz.estimatedMinutes > 0
      ? `${quiz.estimatedMinutes} min`
      : null;

  if (
    !runtime.isComplete &&
    ((isAuthenticated && !startAttempt.data && !startAttempt.isPending) ||
      (!isAuthenticated && !guestStarted))
  ) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader className="gap-3">
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{description}</p>
            <div className="flex flex-wrap items-center gap-2">
              {quiz.difficulty ? (
                <Badge variant="secondary" className="capitalize">
                  {quiz.difficulty}
                </Badge>
              ) : null}
              <Badge variant="outline">{runtime.total} questions</Badge>
              {estimatedMinutes ? (
                <Badge variant="outline">{estimatedMinutes}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="flex justify-end border-t pt-4">
            <Button
              type="button"
              size="lg"
              onClick={() => {
                if (isAuthenticated) {
                  startAttempt.mutate();
                } else {
                  setGuestStarted(true);
                }
              }}
              disabled={startAttempt.isPending}
            >
              {startAttempt.isPending ? "Starting..." : "Start Quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (runtime.isComplete) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <QuizResult
          score={runtime.score}
          total={runtime.total}
          quizSlug={quiz.slug}
          canSaveAttempts={isAuthenticated}
          onRestart={runtime.restart}
        />
      </div>
    );
  }

  if (!runtime.currentQuestion) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>{quiz.title}</CardTitle>
          <p className="text-muted-foreground text-sm">{description}</p>
          <QuizProgress
            current={runtime.currentIndex + 1}
            total={runtime.total}
            progress={runtime.progress}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <QuizQuestion
            question={runtime.currentQuestion}
            selectedOptionIds={runtime.selectedOptionIds}
            onSelect={(optionId) => void runtime.selectAnswer(optionId)}
          />
          <QuizFooter
            canProceed={runtime.selectedOptionIds.length > 0}
            isLastQuestion={runtime.currentIndex + 1 >= runtime.total}
            onNext={() => void runtime.nextQuestion()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
