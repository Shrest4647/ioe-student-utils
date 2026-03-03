"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { QuizView } from "@/types/quiz";

const STORAGE_PREFIX = "quiz_progress_";

export interface QuizRuntimeAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
}

interface UseQuizOptions {
  quiz: QuizView;
  persistenceKey?: string;
  onAnswer?: (payload: {
    questionId: string;
    selectedOptionIds: string[];
    isCorrect: boolean;
  }) => Promise<void> | void;
  onComplete?: (payload: {
    score: number;
    total: number;
    percentage: number;
    timeSpentSeconds: number;
  }) => Promise<void> | void;
}

export function useQuiz({
  quiz,
  persistenceKey,
  onAnswer,
  onComplete,
}: UseQuizOptions) {
  const storageKey = `${STORAGE_PREFIX}${persistenceKey ?? quiz.slug}`;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<QuizRuntimeAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const questions = quiz.questions ?? [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as {
        currentIndex: number;
        answers: QuizRuntimeAnswer[];
        isComplete: boolean;
        startedAt: number;
      };
      setCurrentIndex(parsed.currentIndex ?? 0);
      setAnswers(parsed.answers ?? []);
      setIsComplete(parsed.isComplete ?? false);
      setStartedAt(parsed.startedAt ?? Date.now());
      const active = parsed.answers?.find(
        (a) => a.questionId === questions[parsed.currentIndex]?.id,
      );
      setSelectedOptionIds(active?.selectedOptionIds ?? []);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [questions, storageKey]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        currentIndex,
        answers,
        isComplete,
        startedAt,
      }),
    );
  }, [storageKey, currentIndex, answers, isComplete, startedAt]);

  const selectAnswer = useCallback(
    async (optionId: string) => {
      if (!currentQuestion) return;
      if (selectedOptionIds.length > 0) return;

      const option = currentQuestion.options.find((o) => o.id === optionId);
      const nextSelected = [optionId];
      const isCorrect = Boolean(option?.isCorrect);

      setSelectedOptionIds(nextSelected);
      setAnswers((prev) => {
        const existing = prev.find((a) => a.questionId === currentQuestion.id);
        if (existing) {
          return prev.map((a) =>
            a.questionId === currentQuestion.id
              ? { ...a, selectedOptionIds: nextSelected, isCorrect }
              : a,
          );
        }
        return [
          ...prev,
          {
            questionId: currentQuestion.id,
            selectedOptionIds: nextSelected,
            isCorrect,
          },
        ];
      });

      await onAnswer?.({
        questionId: currentQuestion.id,
        selectedOptionIds: nextSelected,
        isCorrect,
      });
    },
    [currentQuestion, selectedOptionIds, onAnswer],
  );

  const nextQuestion = useCallback(async () => {
    if (selectedOptionIds.length === 0) return;
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIds([]);
      return;
    }

    const score = answers.filter((a) => a.isCorrect).length;
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const timeSpentSeconds = Math.round((Date.now() - startedAt) / 1000);
    setIsComplete(true);
    await onComplete?.({
      score,
      total,
      percentage,
      timeSpentSeconds,
    });
  }, [
    answers,
    currentIndex,
    onComplete,
    questions,
    selectedOptionIds,
    startedAt,
  ]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOptionIds([]);
    setAnswers([]);
    setIsComplete(false);
    setStartedAt(Date.now());
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  useEffect(() => {
    const answer = answers.find((a) => a.questionId === currentQuestion?.id);
    setSelectedOptionIds(answer?.selectedOptionIds ?? []);
  }, [answers, currentQuestion?.id]);

  const score = useMemo(
    () => answers.filter((a) => a.isCorrect).length,
    [answers],
  );
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  return {
    currentQuestion,
    currentIndex,
    selectedOptionIds,
    selectAnswer,
    nextQuestion,
    isComplete,
    score,
    progress,
    total,
    answers,
    restart,
  };
}
