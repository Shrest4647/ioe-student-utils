import { eq } from "drizzle-orm";
import { conn, db } from "../index";
import { type NewStudyTemplate, studyTemplates } from "../schema";

const templates: NewStudyTemplate[] = [
  {
    slug: "one-day-sprint",
    name: "1-Day Sprint",
    description: "A focused final review for one available study day.",
    durationDays: 1,
    difficultyLevel: "intensive",
    planningMode: "exam-prep",
    version: 1,
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 90,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} practice problems on {TOPIC}",
          estimated_minutes: 90,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review all {TOPIC} concepts and formulas",
          estimated_minutes: 30,
        },
        {
          type: "prepare",
          template: "Create quick reference sheet for {TOPIC}",
          estimated_minutes: 30,
        },
      ],
    },
    intensityCurve: {
      day_1: "review_only",
    },
    subjectArea: "general",
  },
  {
    slug: "three-day-boost",
    name: "3-Day Boost",
    description: "A short exam-preparation plan with practice and review.",
    durationDays: 3,
    difficultyLevel: "moderate",
    planningMode: "exam-prep",
    version: 1,
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 60,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Complete exercises for {TOPIC}",
          estimated_minutes: 60,
        },
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 30,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} material",
          estimated_minutes: 20,
        },
        {
          type: "prepare",
          template: "Make notes for key {TOPIC} concepts",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_2: "normal",
      day_3: "review_only",
    },
    subjectArea: "general",
  },
  {
    slug: "one-week-exam-prep",
    name: "1-Week Plan",
    description: "A balanced week of learning, practice, and review.",
    durationDays: 7,
    difficultyLevel: "moderate",
    planningMode: "exam-prep",
    version: 1,
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 45,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 60,
        },
        {
          type: "practice",
          template: "Complete exercises {RANGE}",
          estimated_minutes: 30,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} notes",
          estimated_minutes: 15,
        },
        {
          type: "prepare",
          template: "Make flashcards for {KEY_TERMS_COUNT} terms",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_2: "warmup",
      days_3_5: "normal",
      days_6_7: "review_only",
    },
    subjectArea: "general",
  },
  {
    slug: "two-week-comprehensive",
    name: "2-Week Comprehensive Plan",
    description: "A two-week course plan with room for foundations and review.",
    durationDays: 14,
    difficultyLevel: "moderate",
    planningMode: "full-coverage",
    version: 1,
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 45,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 60,
        },
        {
          type: "practice",
          template: "Complete exercises {RANGE}",
          estimated_minutes: 30,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} notes",
          estimated_minutes: 15,
        },
        {
          type: "prepare",
          template: "Make flashcards for {KEY_TERMS_COUNT} terms",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_3: "warmup",
      days_4_10: "normal",
      days_11_13: "intensive",
      day_14: "review_only",
    },
    subjectArea: "general",
  },
  {
    slug: "one-month-comprehensive",
    name: "1-Month Plan",
    description: "A steady month-long plan for broad syllabus coverage.",
    durationDays: 30,
    difficultyLevel: "comprehensive",
    planningMode: "full-coverage",
    version: 1,
    dailyStructure: {
      morning: [
        {
          type: "learn",
          template: "Study {TOPIC} from Chapter {CHAPTER}",
          estimated_minutes: 60,
        },
      ],
      afternoon: [
        {
          type: "practice",
          template: "Solve {PROBLEM_COUNT} problems on {TOPIC}",
          estimated_minutes: 90,
        },
      ],
      evening: [
        {
          type: "review",
          template: "Review today's {TOPIC} material",
          estimated_minutes: 20,
        },
        {
          type: "prepare",
          template: "Create summary notes for {TOPIC}",
          estimated_minutes: 20,
        },
      ],
    },
    intensityCurve: {
      days_1_5: "warmup",
      days_6_20: "normal",
      days_21_25: "intensive",
      days_26_30: "review_only",
    },
    subjectArea: "general",
  },
];

export async function seedStudyTemplates() {
  console.log("🌱 Seeding study templates...");

  try {
    for (const template of templates) {
      const existing = template.slug
        ? await db.query.studyTemplates.findFirst({
            where: {
              OR: [{ slug: template.slug }, { name: template.name }],
            },
            columns: { id: true },
          })
        : null;
      if (existing) {
        await db
          .update(studyTemplates)
          .set(template)
          .where(eq(studyTemplates.id, existing.id));
      } else {
        await db.insert(studyTemplates).values(template);
      }
    }

    console.log(
      `✅ Inserted ${templates.length} study templates successfully.`,
    );
  } catch (error) {
    console.error("❌ Seeding study templates failed:", error);
    throw error;
  }
}

if (import.meta.main) {
  seedStudyTemplates()
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await conn.end();
    });
}
