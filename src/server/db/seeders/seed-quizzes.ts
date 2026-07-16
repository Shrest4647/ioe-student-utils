import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { conn, db } from "../index";
import { quizOptions, quizQuestions, quizzes } from "../schema";

type AssetOption = {
  text: string;
  isCorrect: boolean;
  rationale?: string;
};

type AssetQuestion = {
  question: string;
  answerOptions: AssetOption[];
  hint?: string;
};

type AssetQuiz = {
  title: string;
  questions: AssetQuestion[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 255);
}

function validateQuiz(quiz: AssetQuiz) {
  if (!quiz.title?.trim() || !Array.isArray(quiz.questions)) {
    throw new Error("Quiz asset must include a title and questions array.");
  }

  quiz.questions.forEach((question, questionIndex) => {
    if (!question.question?.trim() || !Array.isArray(question.answerOptions)) {
      throw new Error(
        `Question ${questionIndex + 1} is missing its prompt or options.`,
      );
    }

    const correctOptionCount = question.answerOptions.filter(
      (option) => option.isCorrect,
    ).length;
    if (correctOptionCount !== 1) {
      throw new Error(
        `Question ${questionIndex + 1} must have exactly one correct option.`,
      );
    }

    if (question.answerOptions.some((option) => !option.text?.trim())) {
      throw new Error(`Question ${questionIndex + 1} has an empty option.`);
    }
  });
}

export async function seedQuizzes(createdById?: string) {
  const assetPath = path.join(process.cwd(), "assets", "yolox-quiz.json");
  const raw = await readFile(assetPath, "utf8");
  const parsed = JSON.parse(raw) as AssetQuiz;
  validateQuiz(parsed);

  const slug = slugify(parsed.title || "yolox-quiz");
  const existing = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    console.log(`⏭️ Quiz already seeded: ${slug}`);
    return;
  }

  const fallbackUser = createdById
    ? createdById
    : (
        await db.query.user.findFirst({
          columns: { id: true },
        })
      )?.id;

  if (!fallbackUser) {
    console.log("⏭️ Skipped quiz seed because no user exists.");
    return;
  }

  await db.transaction(async (tx) => {
    const [quiz] = await tx
      .insert(quizzes)
      .values({
        slug,
        title: parsed.title,
        description: "Imported from assets/yolox-quiz.json",
        difficulty: "medium",
        estimatedMinutes: 20,
        passPercentage: 60,
        status: "published",
        createdById: fallbackUser,
        updatedById: fallbackUser,
        publishedAt: new Date(),
        version: 1,
      })
      .returning({ id: quizzes.id });

    for (const [questionIndex, question] of parsed.questions.entries()) {
      const [insertedQuestion] = await tx
        .insert(quizQuestions)
        .values({
          quizId: quiz.id,
          orderNo: questionIndex + 1,
          prompt: question.question,
          hint: question.hint ?? null,
          rationale: null,
          questionType: "single_choice",
          points: 1,
          isActive: true,
        })
        .returning({ id: quizQuestions.id });

      await tx.insert(quizOptions).values(
        question.answerOptions.map((option, optionIndex) => ({
          questionId: insertedQuestion.id,
          orderNo: optionIndex + 1,
          text: option.text,
          isCorrect: option.isCorrect,
          rationale: option.rationale ?? null,
        })),
      );
    }
  });

  const optionCount = parsed.questions.reduce(
    (total, question) => total + question.answerOptions.length,
    0,
  );
  console.log(
    `✅ Seeded ${parsed.title} with ${parsed.questions.length} questions and ${optionCount} options.`,
  );
}

if (import.meta.main) {
  seedQuizzes()
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await conn.end();
    });
}
