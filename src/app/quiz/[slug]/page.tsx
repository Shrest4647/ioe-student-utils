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
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="font-semibold text-2xl">Quiz not available</h1>
        <p className="mt-2 text-muted-foreground">
          This quiz does not exist or is not published.
        </p>
      </div>
    );
  }

  return (
    <div>
      <QuizPlayer quiz={data} onPhaseChange={setPhase} />
      {isAuthenticated && (phase === "not_started" || phase === "completed") ? (
        <section className="mx-auto max-w-3xl border-t px-4 py-8 sm:px-6">
          <h2 className="font-semibold text-lg">Recent sessions</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            A simple record of your progress on this quiz.
          </p>
          <div className="mt-4">
            {attemptsQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">
                Loading attempts...
              </p>
            ) : (attemptsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-muted-foreground text-sm">
                No attempts yet. Complete the quiz to see your score history.
              </p>
            ) : (
              <div className="divide-y border-y">
                {attemptsQuery.data?.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex min-h-16 items-center justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {attempt.status === "in_progress"
                          ? "In progress"
                          : "Completed"}
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
                          {attempt.status === "in_progress"
                            ? "Resume above"
                            : `${attempt.score}/${attempt.totalQuestions}`}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {attempt.status === "in_progress"
                            ? "Saved"
                            : `${attempt.percentage}% accuracy`}
                        </p>
                      </div>
                      <ActionButton
                        action={async () => {
                          try {
                            await deleteAttemptMutation.mutateAsync(attempt.id);
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
          </div>
        </section>
      ) : null}
    </div>
  );
}
