import { describe, expect, it } from "bun:test";
import {
  buildStudySession,
  isSelectionCorrect,
  orderSessionQuestions,
  shuffleWithSeed,
} from "@/lib/quiz/study-engine";
import type { QuizQuestionView, QuizStudyProfile } from "@/types/quiz";

const questions: QuizQuestionView[] = ["q1", "q2", "q3"].map(
  (id, questionIndex) => ({
    id,
    orderNo: questionIndex + 1,
    prompt: `Question ${questionIndex + 1}`,
    hint: null,
    rationale: null,
    questionType: "single_choice",
    points: 1,
    isActive: true,
    options: ["a", "b", "c"].map((suffix, optionIndex) => ({
      id: `${id}-${suffix}`,
      orderNo: optionIndex + 1,
      text: suffix,
      isCorrect: optionIndex === 0,
      rationale: null,
    })),
  }),
);

const profile: QuizStudyProfile = {
  completedAttempts: 3,
  overallAccuracy: 67,
  bookmarkedQuestionIds: ["q3"],
  questions: {
    q1: {
      attempts: 3,
      correct: 3,
      averageResponseSeconds: 4,
      averageConfidence: 3,
      lastCorrect: true,
    },
    q2: {
      attempts: 3,
      correct: 0,
      averageResponseSeconds: 15,
      averageConfidence: 1,
      lastCorrect: false,
    },
  },
};

describe("quiz study engine", () => {
  it("creates deterministic shuffled orders without losing entries", () => {
    const first = shuffleWithSeed([1, 2, 3, 4, 5], "session-one");
    const second = shuffleWithSeed([1, 2, 3, 4, 5], "session-one");

    expect(first).toEqual(second);
    expect([...first].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it("prioritizes weak questions in adaptive practice", () => {
    const session = buildStudySession({
      questions,
      profile,
      mode: "practice",
      feedbackMode: "instant",
      seed: "adaptive-test",
    });

    expect(session.questionOrder[0]).toBe("q2");
    expect(new Set(session.questionOrder).size).toBe(questions.length);
  });

  it("builds focused incorrect and bookmarked sessions", () => {
    const incorrect = buildStudySession({
      questions,
      profile,
      mode: "review_incorrect",
      feedbackMode: "instant",
      seed: "incorrect-test",
    });
    const bookmarked = buildStudySession({
      questions,
      profile,
      mode: "review_bookmarked",
      feedbackMode: "instant",
      seed: "bookmark-test",
    });

    expect(incorrect.questionOrder).toEqual(["q2"]);
    expect(bookmarked.questionOrder).toEqual(["q3"]);
  });

  it("restores the persisted question and option order", () => {
    const session = buildStudySession({
      questions,
      mode: "practice",
      feedbackMode: "end",
      seed: "restore-test",
    });
    const ordered = orderSessionQuestions(questions, session);

    expect(ordered.map((question) => question.id)).toEqual(
      session.questionOrder,
    );
    expect(ordered[0]?.options.map((option) => option.id)).toEqual(
      session.optionOrderByQuestion[ordered[0]?.id ?? ""],
    );
  });

  it("grades single and multiple selections independent of order", () => {
    const multiple = {
      ...questions[0],
      questionType: "multiple_select" as const,
      options: questions[0].options.map((option, index) => ({
        ...option,
        isCorrect: index < 2,
      })),
    };

    expect(isSelectionCorrect(questions[0], ["q1-a"])).toBe(true);
    expect(isSelectionCorrect(multiple, ["q1-b", "q1-a"])).toBe(true);
    expect(isSelectionCorrect(multiple, ["q1-a"])).toBe(false);
  });
});
