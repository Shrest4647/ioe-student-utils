import { eq } from "drizzle-orm";
import { conn, db } from "../index";
import { quizOptions, quizQuestions, quizzes } from "../schema";

type SeedOption = {
  orderNo: number;
  text: string;
  isCorrect: boolean;
  rationale?: string;
};

type SeedQuestion = {
  orderNo: number;
  prompt: string;
  hint?: string;
  rationale?: string;
  options: SeedOption[];
};

const sampleQuiz: {
  slug: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  passPercentage: number;
  questions: SeedQuestion[];
} = {
  slug: "ioe-computer-networks-basics",
  title: "Computer Networks Basics",
  description:
    "Fundamental networking concepts for IOE students. Covers OSI model, protocols, addressing, and transport basics.",
  difficulty: "medium",
  estimatedMinutes: 10,
  passPercentage: 60,
  questions: [
    {
      orderNo: 1,
      prompt: "Which layer of the OSI model is responsible for routing?",
      hint: "Think about IP packets and path selection.",
      options: [
        {
          orderNo: 1,
          text: "Application layer",
          isCorrect: false,
          rationale: "Application handles end-user services, not routing.",
        },
        {
          orderNo: 2,
          text: "Network layer",
          isCorrect: true,
          rationale:
            "The network layer performs logical addressing and routing.",
        },
        {
          orderNo: 3,
          text: "Data link layer",
          isCorrect: false,
          rationale: "Data link handles local framing and MAC addressing.",
        },
        {
          orderNo: 4,
          text: "Transport layer",
          isCorrect: false,
          rationale: "Transport provides end-to-end process communication.",
        },
      ],
    },
    {
      orderNo: 2,
      prompt: "What is the default port number for HTTPS?",
      hint: "This is the secure variant of HTTP.",
      options: [
        { orderNo: 1, text: "21", isCorrect: false, rationale: "21 is FTP." },
        {
          orderNo: 2,
          text: "80",
          isCorrect: false,
          rationale: "80 is default for HTTP.",
        },
        {
          orderNo: 3,
          text: "443",
          isCorrect: true,
          rationale: "443 is the default for HTTPS.",
        },
        {
          orderNo: 4,
          text: "8080",
          isCorrect: false,
          rationale: "8080 is an alternative HTTP port.",
        },
      ],
    },
    {
      orderNo: 3,
      prompt: "Which device forwards frames based on MAC addresses?",
      options: [
        {
          orderNo: 1,
          text: "Router",
          isCorrect: false,
          rationale: "Routers forward packets using IP.",
        },
        {
          orderNo: 2,
          text: "Switch",
          isCorrect: true,
          rationale: "Switches operate at L2 and use MAC address tables.",
        },
        {
          orderNo: 3,
          text: "Hub",
          isCorrect: false,
          rationale: "Hubs broadcast blindly to all ports.",
        },
        {
          orderNo: 4,
          text: "Gateway",
          isCorrect: false,
          rationale: "Gateway translates across protocols/networks.",
        },
      ],
    },
  ],
};

export async function seedQuizzes(createdById?: string) {
  const existing = await db
    .select({ id: quizzes.id })
    .from(quizzes)
    .where(eq(quizzes.slug, sampleQuiz.slug))
    .limit(1);

  if (existing.length > 0) {
    console.log("⏭️ Sample quiz already seeded.");
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

  const [quiz] = await db
    .insert(quizzes)
    .values({
      slug: sampleQuiz.slug,
      title: sampleQuiz.title,
      description: sampleQuiz.description,
      difficulty: sampleQuiz.difficulty,
      estimatedMinutes: sampleQuiz.estimatedMinutes,
      passPercentage: sampleQuiz.passPercentage,
      status: "published",
      createdById: fallbackUser,
      updatedById: fallbackUser,
      publishedAt: new Date(),
      version: 1,
    })
    .returning({ id: quizzes.id });

  for (const question of sampleQuiz.questions) {
    const [insertedQuestion] = await db
      .insert(quizQuestions)
      .values({
        quizId: quiz.id,
        orderNo: question.orderNo,
        prompt: question.prompt,
        hint: question.hint ?? null,
        rationale: question.rationale ?? null,
        questionType: "single_choice",
        points: 1,
        isActive: true,
      })
      .returning({ id: quizQuestions.id });

    await db.insert(quizOptions).values(
      question.options.map((option) => ({
        questionId: insertedQuestion.id,
        orderNo: option.orderNo,
        text: option.text,
        isCorrect: option.isCorrect,
        rationale: option.rationale ?? null,
      })),
    );
  }

  console.log("✅ Seeded sample quiz with questions and options.");
}

seedQuizzes()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await conn.end();
    process.exit(0);
  });
