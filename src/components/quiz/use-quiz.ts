"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isSelectionCorrect,
  orderSessionQuestions,
} from "@/lib/quiz/study-engine";
import type {
  QuizConfidence,
  QuizStudyProfile,
  QuizStudySession,
  QuizView,
} from "@/types/quiz";

const STORAGE_PREFIX = "quiz-study-session:";
const PROFILE_PREFIX = "quiz-study-profile:";

export interface QuizRuntimeAnswer {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect: boolean;
  timeSpentSeconds: number;
  confidence?: QuizConfidence;
}

interface PersistedQuizState {
  session: QuizStudySession;
  currentIndex: number;
  answers: QuizRuntimeAnswer[];
  isComplete: boolean;
  startedAt: number;
  bookmarkedQuestionIds: string[];
}

interface UseQuizOptions {
  quiz: QuizView;
  persistenceKey?: string;
  onAnswer?: (payload: QuizRuntimeAnswer) => Promise<void> | void;
  onComplete?: (payload: {
    score: number;
    total: number;
    percentage: number;
    timeSpentSeconds: number;
  }) => Promise<void> | void;
  onBookmarksChange?: (questionIds: string[]) => Promise<void> | void;
}

export function useQuiz({
  quiz,
  persistenceKey,
  onAnswer,
  onComplete,
  onBookmarksChange,
}: UseQuizOptions) {
  const storageKey = `${STORAGE_PREFIX}${persistenceKey ?? quiz.slug}`;
  const profileKey = `${PROFILE_PREFIX}${persistenceKey ?? quiz.slug}`;
  const [session, setSession] = useState<QuizStudySession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftSelectedOptionIds, setDraftSelectedOptionIds] = useState<
    string[]
  >([]);
  const [answers, setAnswers] = useState<QuizRuntimeAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(
    Date.now(),
  );
  const [bookmarkedQuestionIds, setBookmarkedQuestionIds] = useState<string[]>(
    [],
  );
  const [now, setNow] = useState(Date.now());
  const [isHydrated, setIsHydrated] = useState(false);
  const [localProfile, setLocalProfile] = useState<QuizStudyProfile | null>(
    null,
  );
  const completionStarted = useRef(false);

  const questions = useMemo(
    () => (session ? orderSessionQuestions(quiz.questions ?? [], session) : []),
    [quiz.questions, session],
  );
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.find(
    (answer) => answer.questionId === currentQuestion?.id,
  );
  const selectedOptionIds =
    currentAnswer?.selectedOptionIds ?? draftSelectedOptionIds;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const storedProfile = localStorage.getItem(profileKey);
    if (storedProfile) {
      try {
        setLocalProfile(JSON.parse(storedProfile) as QuizStudyProfile);
      } catch {
        localStorage.removeItem(profileKey);
      }
    }
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PersistedQuizState;
        if (parsed.session?.questionOrder?.length) {
          setSession(parsed.session);
          setCurrentIndex(parsed.currentIndex ?? 0);
          setAnswers(parsed.answers ?? []);
          setIsComplete(parsed.isComplete ?? false);
          setStartedAt(parsed.startedAt ?? Date.now());
          setBookmarkedQuestionIds(parsed.bookmarkedQuestionIds ?? []);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setIsHydrated(true);
  }, [profileKey, storageKey]);

  useEffect(() => {
    if (!isHydrated || !session) return;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        session,
        currentIndex,
        answers,
        isComplete,
        startedAt,
        bookmarkedQuestionIds,
      } satisfies PersistedQuizState),
    );
  }, [
    answers,
    bookmarkedQuestionIds,
    currentIndex,
    isComplete,
    isHydrated,
    session,
    startedAt,
    storageKey,
  ]);

  useEffect(() => {
    if (!session || isComplete) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [isComplete, session]);

  const beginSession = useCallback(
    (
      nextSession: QuizStudySession,
      initialAnswers: QuizRuntimeAnswer[] = [],
      initialBookmarks: string[] = [],
    ) => {
      setSession(nextSession);
      setAnswers(initialAnswers);
      setBookmarkedQuestionIds(initialBookmarks);
      setCurrentIndex(
        Math.min(initialAnswers.length, nextSession.questionOrder.length - 1),
      );
      setDraftSelectedOptionIds([]);
      setIsComplete(false);
      setStartedAt(Date.now());
      setQuestionStartedAt(Date.now());
      completionStarted.current = false;
    },
    [],
  );

  const toggleOption = useCallback(
    (optionId: string) => {
      if (!currentQuestion || currentAnswer) return;
      if (currentQuestion.questionType !== "multiple_select") {
        setDraftSelectedOptionIds([optionId]);
        return;
      }
      setDraftSelectedOptionIds((current) =>
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      );
    },
    [currentAnswer, currentQuestion],
  );

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion || currentAnswer || selectedOptionIds.length === 0) {
      return;
    }
    const answer: QuizRuntimeAnswer = {
      questionId: currentQuestion.id,
      selectedOptionIds,
      isCorrect: isSelectionCorrect(currentQuestion, selectedOptionIds),
      timeSpentSeconds: Math.max(
        1,
        Math.round((Date.now() - questionStartedAt) / 1_000),
      ),
    };
    setAnswers((current) => [...current, answer]);
    await onAnswer?.(answer);
  }, [
    currentAnswer,
    currentQuestion,
    onAnswer,
    questionStartedAt,
    selectedOptionIds,
  ]);

  const selectAnswer = useCallback(
    async (optionId: string) => {
      toggleOption(optionId);
      if (
        currentQuestion?.questionType !== "multiple_select" &&
        !currentAnswer
      ) {
        const answer: QuizRuntimeAnswer = {
          questionId: currentQuestion.id,
          selectedOptionIds: [optionId],
          isCorrect: isSelectionCorrect(currentQuestion, [optionId]),
          timeSpentSeconds: Math.max(
            1,
            Math.round((Date.now() - questionStartedAt) / 1_000),
          ),
        };
        setAnswers((current) => [...current, answer]);
        await onAnswer?.(answer);
      }
    },
    [currentAnswer, currentQuestion, onAnswer, questionStartedAt, toggleOption],
  );

  const finish = useCallback(
    async (finalAnswers = answers) => {
      if (completionStarted.current) return;
      completionStarted.current = true;
      const score = finalAnswers.filter((answer) => answer.isCorrect).length;
      const total = questions.length;
      setIsComplete(true);
      setLocalProfile((current) => {
        const questionsHistory = { ...(current?.questions ?? {}) };
        for (const answer of finalAnswers) {
          const history = questionsHistory[answer.questionId] ?? {
            attempts: 0,
            correct: 0,
            averageResponseSeconds: 0,
            averageConfidence: null,
            lastCorrect: null,
          };
          const attempts = history.attempts + 1;
          const confidenceTotal =
            (history.averageConfidence ?? 0) * history.attempts +
            (answer.confidence ?? 0);
          questionsHistory[answer.questionId] = {
            attempts,
            correct: history.correct + (answer.isCorrect ? 1 : 0),
            averageResponseSeconds: Math.round(
              (history.averageResponseSeconds * history.attempts +
                answer.timeSpentSeconds) /
                attempts,
            ),
            averageConfidence: answer.confidence
              ? Number((confidenceTotal / attempts).toFixed(1))
              : history.averageConfidence,
            lastCorrect: answer.isCorrect,
          };
        }
        const allHistory = Object.values(questionsHistory);
        const answerCount = allHistory.reduce(
          (sum, history) => sum + history.attempts,
          0,
        );
        const correctCount = allHistory.reduce(
          (sum, history) => sum + history.correct,
          0,
        );
        const nextProfile: QuizStudyProfile = {
          questions: questionsHistory,
          bookmarkedQuestionIds,
          completedAttempts: (current?.completedAttempts ?? 0) + 1,
          overallAccuracy:
            answerCount > 0
              ? Math.round((correctCount / answerCount) * 100)
              : 0,
        };
        localStorage.setItem(profileKey, JSON.stringify(nextProfile));
        return nextProfile;
      });
      await onComplete?.({
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        timeSpentSeconds: Math.round((Date.now() - startedAt) / 1_000),
      });
    },
    [
      answers,
      bookmarkedQuestionIds,
      onComplete,
      profileKey,
      questions.length,
      startedAt,
    ],
  );

  const nextQuestion = useCallback(async () => {
    if (!currentAnswer) return;
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((index) => index + 1);
      setDraftSelectedOptionIds([]);
      setQuestionStartedAt(Date.now());
      return;
    }
    await finish();
  }, [currentAnswer, currentIndex, finish, questions.length]);

  const previousQuestion = useCallback(() => {
    if (currentIndex === 0) return;
    setCurrentIndex((index) => index - 1);
    setDraftSelectedOptionIds([]);
  }, [currentIndex]);

  const setConfidence = useCallback(
    async (confidence: QuizConfidence) => {
      if (!currentAnswer) return;
      const updated = { ...currentAnswer, confidence };
      setAnswers((current) =>
        current.map((answer) =>
          answer.questionId === currentAnswer.questionId ? updated : answer,
        ),
      );
      await onAnswer?.(updated);
    },
    [currentAnswer, onAnswer],
  );

  const toggleBookmark = useCallback(async () => {
    if (!currentQuestion) return;
    const next = bookmarkedQuestionIds.includes(currentQuestion.id)
      ? bookmarkedQuestionIds.filter((id) => id !== currentQuestion.id)
      : [...bookmarkedQuestionIds, currentQuestion.id];
    setBookmarkedQuestionIds(next);
    setLocalProfile((current) => {
      const nextProfile: QuizStudyProfile = current
        ? { ...current, bookmarkedQuestionIds: next }
        : {
            questions: {},
            bookmarkedQuestionIds: next,
            completedAttempts: 0,
            overallAccuracy: 0,
          };
      localStorage.setItem(profileKey, JSON.stringify(nextProfile));
      return nextProfile;
    });
    await onBookmarksChange?.(next);
  }, [bookmarkedQuestionIds, currentQuestion, onBookmarksChange, profileKey]);

  const restart = useCallback(() => {
    setSession(null);
    setCurrentIndex(0);
    setDraftSelectedOptionIds([]);
    setAnswers([]);
    setIsComplete(false);
    setStartedAt(Date.now());
    setBookmarkedQuestionIds(localProfile?.bookmarkedQuestionIds ?? []);
    completionStarted.current = false;
    localStorage.removeItem(storageKey);
  }, [localProfile?.bookmarkedQuestionIds, storageKey]);

  const timeLimitSeconds =
    session?.mode === "timed" ? quiz.timeLimitSeconds : null;
  const elapsedSeconds = Math.round((now - startedAt) / 1_000);
  const remainingSeconds = timeLimitSeconds
    ? Math.max(0, timeLimitSeconds - elapsedSeconds)
    : null;

  useEffect(() => {
    if (remainingSeconds === 0 && session && !isComplete) {
      void finish();
    }
  }, [finish, isComplete, remainingSeconds, session]);

  const score = answers.filter((answer) => answer.isCorrect).length;
  const total = questions.length;
  const progress = total > 0 ? (answers.length / total) * 100 : 0;

  return {
    session,
    beginSession,
    isHydrated,
    currentQuestion,
    currentAnswer,
    currentIndex,
    selectedOptionIds,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    canGoPrevious: currentIndex > 0,
    isComplete,
    score,
    progress,
    total,
    answers,
    restart,
    remainingSeconds,
    elapsedSeconds,
    localProfile,
    bookmarkedQuestionIds,
    isBookmarked: currentQuestion
      ? bookmarkedQuestionIds.includes(currentQuestion.id)
      : false,
    toggleBookmark,
    setConfidence,
  };
}
