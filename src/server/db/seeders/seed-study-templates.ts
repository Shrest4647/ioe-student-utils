import { db } from "../index";
import { studyTemplates } from "../schema";
import { eq } from "drizzle-orm";

const templates = [
  {
    name: "1-Day Sprint",
    durationDays: 1,
    difficultyLevel: "intensive",
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
    name: "3-Day Boost",
    durationDays: 3,
    difficultyLevel: "moderate",
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
    name: "1-Week Plan",
    durationDays: 7,
    difficultyLevel: "moderate",
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
    name: "2-Week Comprehensive Plan",
    durationDays: 14,
    difficultyLevel: "moderate",
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
    name: "1-Month Plan",
    durationDays: 30,
    difficultyLevel: "comprehensive",
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

async function seedStudyTemplates() {
  console.log("🌱 Seeding study templates...");

  try {
    // Check if templates already exist by selecting one
    const existingTemplates = await db
      .select()
      .from(studyTemplates)
      .limit(1);

    if (existingTemplates.length > 0) {
      console.log(`⏭️ Study templates already seeded.`);
      return;
    }

    // Insert all templates
    for (const template of templates) {
      await db.insert(studyTemplates).values(template);
    }

    console.log(`✅ Inserted ${templates.length} study templates successfully.`);
  } catch (error) {
    console.error("❌ Seeding study templates failed:", error);
    throw error;
  }
}

seedStudyTemplates()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
