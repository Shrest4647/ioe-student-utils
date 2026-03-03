"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { QuizPlayer, QuizSkeleton } from "@/components/quiz";
import {
  useMyQuizAttempts,
  useQuizBySlug,
} from "@/components/quiz/use-quiz-data";
import { ActionButton } from "@/components/ui/action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";

export default function QuizPlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<
    "not_started" | "in_progress" | "completed"
  >("not_started");
  const { data, isLoading, error } = useQuizBySlug(slug);
  const attemptsQuery = useMyQuizAttempts(
    data?.id ?? "",
    isAuthenticated && Boolean(data?.id),
  );
  const deleteAttemptMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const response = await apiClient.api.quizzes
        .attempts({ attemptId })
        .delete();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to delete attempt");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quiz", "attempts", "mine", data?.id ?? ""],
      });
    },
  });

  if (isLoading) return <QuizSkeleton />;

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Quiz not available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This quiz does not exist or is not published.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuizPlayer quiz={data} onPhaseChange={setPhase} />
      {isAuthenticated && (phase === "not_started" || phase === "completed") ? (
        <div className="container mx-auto max-w-2xl px-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {attemptsQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">
                  Loading attempts...
                </p>
              ) : (attemptsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No attempts yet. Complete the quiz to see your score history.
                </p>
              ) : (
                <div className="space-y-3">
                  {attemptsQuery.data?.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {attempt.status}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {attempt.completedAt
                            ? new Date(attempt.completedAt).toLocaleString()
                            : new Date(attempt.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {attempt.score}/{attempt.totalQuestions}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {attempt.percentage}% score
                          </p>
                        </div>
                        <ActionButton
                          action={async () => {
                            try {
                              await deleteAttemptMutation.mutateAsync(
                                attempt.id,
                              );
                              return { error: false };
                            } catch {
                              return {
                                error: true,
                                message:
                                  "Failed to delete this attempt. Please try again.",
                              };
                            }
                          }}
                          requireAreYouSure
                          areYouSureDescription={
                            "Delete this attempt? This action cannot be undone."
                          }
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deleteAttemptMutation.isPending}
                          aria-label="Delete attempt"
                        >
                          <Trash2 className="size-4" />
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
