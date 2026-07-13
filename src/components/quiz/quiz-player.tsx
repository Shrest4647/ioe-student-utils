"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, Cloud, CloudOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";
import { buildStudySession } from "@/lib/quiz/study-engine";
import { cn } from "@/lib/utils";
import type {
  QuizFeedbackMode,
  QuizMode,
  QuizStudyProfile,
  QuizStudySession,
  QuizView,
} from "@/types/quiz";
import { QuizFooter } from "./quiz-footer";
import { QuizProgress } from "./quiz-progress";
import { QuizQuestion } from "./quiz-question";
import { QuizResult } from "./quiz-result";
import { QuizSetup } from "./quiz-setup";
import { useQuiz } from "./use-quiz";
import { useQuizStudyProfile } from "./use-quiz-data";

interface QuizPlayerProps {
  quiz: QuizView;
  onPhaseChange?: (phase: "not_started" | "in_progress" | "completed") => void;
}

function isStudySession(value: unknown): value is QuizStudySession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<QuizStudySession>;
  return Boolean(
    candidate.seed &&
      candidate.mode &&
      candidate.feedbackMode &&
      Array.isArray(candidate.questionOrder) &&
      candidate.optionOrderByQuestion,
  );
}

export function QuizPlayer({ quiz, onPhaseChange }: QuizPlayerProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuizStudyProfile(quiz.id, isAuthenticated);
  const serverProfile = profileQuery.data as QuizStudyProfile | undefined;
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const answerMutation = useMutation({
    mutationFn: async (payload: {
      questionId: string;
      selectedOptionIds: string[];
      timeSpentSeconds: number;
      confidence?: 1 | 2 | 3;
    }) => {
      if (!attemptId) return;
      const response = await apiClient.api.quizzes
        .attempts({ attemptId })
        .answer.patch(payload);
      if (response.error || !response.data?.success) {
        throw new Error("Your answer could not be synced.");
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (timeSpentSeconds: number) => {
      if (!attemptId) return;
      const response = await apiClient.api.quizzes
        .attempts({ attemptId })
        .complete.post({ timeSpentSeconds });
      if (response.error || !response.data?.success) {
        throw new Error("Your completed session could not be synced.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quiz", "attempts", "mine", quiz.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["quiz", "study-profile", quiz.id],
      });
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: async (bookmarkedQuestionIds: string[]) => {
      if (!attemptId) return;
      const response = await apiClient.api.quizzes
        .attempts({ attemptId })
        .preferences.patch({ bookmarkedQuestionIds });
      if (response.error || !response.data?.success) {
        throw new Error("Bookmarks could not be synced.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["quiz", "study-profile", quiz.id],
      });
    },
  });

  const runtime = useQuiz({
    quiz,
    onAnswer: async (answer) => {
      if (!isAuthenticated) return;
      await answerMutation.mutateAsync(answer);
    },
    onComplete: async ({ timeSpentSeconds }) => {
      if (!isAuthenticated) return;
      await completeMutation.mutateAsync(timeSpentSeconds);
    },
    onBookmarksChange: async (questionIds) => {
      if (!isAuthenticated) return;
      await preferencesMutation.mutateAsync(questionIds);
    },
  });
  const profile = serverProfile ?? runtime.localProfile ?? undefined;

  const startAttempt = useMutation({
    mutationFn: async (requestedSession: QuizStudySession) => {
      const response = await apiClient.api.quizzes
        .quiz({ quizId: quiz.id })
        .attempts.post({
          guestSessionId: crypto.randomUUID(),
          metadata: {
            session: requestedSession,
            bookmarkedQuestionIds:
              profile?.bookmarkedQuestionIds ?? runtime.bookmarkedQuestionIds,
          },
        });
      if (response.error || !response.data?.success) {
        throw new Error("Could not prepare your study session.");
      }
      const attempt = response.data.data;
      if (!attempt) {
        throw new Error("Could not prepare your study session.");
      }
      return { requestedSession, attempt };
    },
    onSuccess: ({ requestedSession, attempt }) => {
      const metadata = (attempt.metadata ?? {}) as Record<string, unknown>;
      const savedSession = isStudySession(metadata.session)
        ? metadata.session
        : requestedSession;
      const initialAnswers = (attempt.answers ?? []).map((answer) => ({
        questionId: answer.questionId,
        selectedOptionIds: answer.selectedOptionIds,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds,
        confidence: (
          (metadata.confidenceByQuestion ?? {}) as Record<string, 1 | 2 | 3>
        )[answer.questionId],
      }));
      const bookmarks = Array.isArray(metadata.bookmarkedQuestionIds)
        ? (metadata.bookmarkedQuestionIds as string[])
        : (profile?.bookmarkedQuestionIds ?? []);
      setAttemptId(attempt.id);
      runtime.beginSession(savedSession, initialAnswers, bookmarks);
      setIsActive(true);
      setSessionError(null);
    },
    onError: (error) => {
      setSessionError(
        error instanceof Error ? error.message : "Could not start the quiz.",
      );
    },
  });

  const startSession = useCallback(
    (mode: QuizMode, feedbackMode: QuizFeedbackMode) => {
      const session = buildStudySession({
        questions: quiz.questions,
        profile,
        mode,
        feedbackMode: mode === "timed" ? "end" : feedbackMode,
      });
      if (session.questionOrder.length === 0) {
        setSessionError(
          "There are no questions available for this study mode.",
        );
        return;
      }
      if (isAuthenticated) {
        startAttempt.mutate(session);
      } else {
        runtime.beginSession(
          session,
          [],
          profile?.bookmarkedQuestionIds ?? runtime.bookmarkedQuestionIds,
        );
        setIsActive(true);
        setSessionError(null);
      }
    },
    [isAuthenticated, profile, quiz.questions, runtime, startAttempt],
  );

  const resumeSession = useCallback(() => {
    if (!runtime.session) return;
    if (isAuthenticated) {
      startAttempt.mutate(runtime.session);
    } else {
      setIsActive(true);
    }
  }, [isAuthenticated, runtime.session, startAttempt]);

  const phase: "not_started" | "in_progress" | "completed" = runtime.isComplete
    ? "completed"
    : isActive
      ? "in_progress"
      : "not_started";

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [onPhaseChange, phase]);

  useEffect(() => {
    if (!isActive || runtime.isComplete) return;
    const handleKeyboard = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (/^[1-6]$/.test(event.key) && !runtime.currentAnswer) {
        const option = runtime.currentQuestion?.options[Number(event.key) - 1];
        if (option) void runtime.selectAnswer(option.id);
      }
      if (event.key === "Enter" && runtime.currentAnswer) {
        event.preventDefault();
        void runtime.nextQuestion();
      }
      if (event.key.toLowerCase() === "b") {
        void runtime.toggleBookmark();
      }
      if (event.key === "ArrowLeft") runtime.previousQuestion();
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [isActive, runtime]);

  if (!runtime.isHydrated) return null;

  if (!isActive && !runtime.isComplete) {
    return (
      <>
        <QuizSetup
          quiz={quiz}
          profile={profile}
          hasSavedSession={Boolean(runtime.session)}
          isStarting={startAttempt.isPending}
          onStart={startSession}
          onResume={resumeSession}
        />
        {sessionError ? (
          <p
            role="alert"
            className="mx-auto -mt-6 max-w-3xl px-4 text-destructive text-sm sm:px-6"
          >
            {sessionError}
          </p>
        ) : null}
      </>
    );
  }

  if (runtime.isComplete) {
    return (
      <QuizResult
        answers={runtime.answers}
        questions={quiz.questions}
        quizSlug={quiz.slug}
        canSaveAttempts={isAuthenticated}
        timeSpentSeconds={runtime.elapsedSeconds}
        onRestart={() => {
          runtime.restart();
          setAttemptId(null);
          setIsActive(false);
        }}
      />
    );
  }

  if (!runtime.currentQuestion || !runtime.session) return null;
  const showFeedback =
    runtime.session.feedbackMode === "instant" &&
    Boolean(runtime.currentAnswer);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{quiz.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
              {isAuthenticated ? (
                <Cloud className="size-3.5" />
              ) : (
                <CloudOff className="size-3.5" />
              )}
              {isAuthenticated ? "Progress synced" : "Saved on this device"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className={cn("shrink-0", runtime.isBookmarked && "text-primary")}
            onClick={() => void runtime.toggleBookmark()}
            aria-label={
              runtime.isBookmarked ? "Remove bookmark" : "Bookmark question"
            }
            title="Bookmark question (B)"
          >
            {runtime.isBookmarked ? <BookmarkCheck /> : <Bookmark />}
          </Button>
        </div>
        <QuizProgress
          current={runtime.currentIndex + 1}
          total={runtime.total}
          progress={runtime.progress}
          score={runtime.score}
          remainingSeconds={runtime.remainingSeconds}
        />
      </header>

      <QuizQuestion
        question={runtime.currentQuestion}
        selectedOptionIds={runtime.selectedOptionIds}
        answer={runtime.currentAnswer}
        showFeedback={showFeedback}
        onSelect={(optionId) => void runtime.selectAnswer(optionId)}
        onSubmit={() => void runtime.submitAnswer()}
        onConfidence={(confidence) => void runtime.setConfidence(confidence)}
      />

      {answerMutation.isError || preferencesMutation.isError ? (
        <p role="status" className="mt-4 text-destructive text-sm">
          Your work is safe on this device, but sync is temporarily unavailable.
        </p>
      ) : null}

      <QuizFooter
        canProceed={Boolean(runtime.currentAnswer)}
        canGoPrevious={runtime.canGoPrevious}
        isLastQuestion={runtime.currentIndex + 1 >= runtime.total}
        onPrevious={runtime.previousQuestion}
        onNext={() => void runtime.nextQuestion()}
      />
    </main>
  );
}
