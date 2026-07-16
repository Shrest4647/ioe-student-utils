import type {
  QuizQuestionView,
  QuizStudyProfile,
  QuizStudySession,
} from "@/types/quiz";

export function createSeed(): string {
  return crypto.randomUUID();
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (const character of seed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const random = seededRandom(seed);
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

function weaknessScore(questionId: string, profile?: QuizStudyProfile | null) {
  const history = profile?.questions[questionId];
  if (!history || history.attempts === 0) return 0.65;
  const accuracy = history.correct / history.attempts;
  const recencyBoost = history.lastCorrect === false ? 0.35 : 0;
  const uncertaintyBoost = history.averageConfidence
    ? (3 - history.averageConfidence) * 0.1
    : 0;
  return Math.max(0.08, 1 - accuracy + recencyBoost + uncertaintyBoost);
}

export function buildStudySession({
  questions,
  profile,
  mode,
  feedbackMode,
  seed = createSeed(),
}: {
  questions: QuizQuestionView[];
  profile?: QuizStudyProfile | null;
  mode: QuizStudySession["mode"];
  feedbackMode: QuizStudySession["feedbackMode"];
  seed?: string;
}): QuizStudySession {
  const bookmarked = new Set(profile?.bookmarkedQuestionIds ?? []);
  const missed = new Set(
    Object.entries(profile?.questions ?? {})
      .filter(([, value]) => value.lastCorrect === false)
      .map(([questionId]) => questionId),
  );

  let candidates = questions;
  if (mode === "review_incorrect") {
    candidates = questions.filter((question) => missed.has(question.id));
  }
  if (mode === "review_bookmarked") {
    candidates = questions.filter((question) => bookmarked.has(question.id));
  }

  const random = seededRandom(`${seed}:adaptive`);
  const questionOrder = [...candidates]
    .map((question) => ({
      id: question.id,
      priority: weaknessScore(question.id, profile) * 0.75 + random() * 0.25,
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ id }) => id);

  const optionOrderByQuestion = Object.fromEntries(
    candidates.map((question) => [
      question.id,
      shuffleWithSeed(
        question.options.map((option) => option.id),
        `${seed}:${question.id}`,
      ),
    ]),
  );

  return {
    seed,
    mode,
    feedbackMode,
    questionOrder,
    optionOrderByQuestion,
  };
}

export function orderSessionQuestions(
  questions: QuizQuestionView[],
  session: QuizStudySession,
) {
  const questionsById = new Map(
    questions.map((question) => [question.id, question]),
  );
  return session.questionOrder.flatMap((questionId) => {
    const question = questionsById.get(questionId);
    if (!question) return [];
    const optionsById = new Map(
      question.options.map((option) => [option.id, option]),
    );
    return [
      {
        ...question,
        options: (session.optionOrderByQuestion[questionId] ?? []).flatMap(
          (optionId) => {
            const option = optionsById.get(optionId);
            return option ? [option] : [];
          },
        ),
      },
    ];
  });
}

export function isSelectionCorrect(
  question: QuizQuestionView,
  selectedOptionIds: string[],
) {
  const selected = [...selectedOptionIds].sort();
  const correct = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort();
  return (
    selected.length === correct.length &&
    selected.every((optionId, index) => optionId === correct[index])
  );
}
