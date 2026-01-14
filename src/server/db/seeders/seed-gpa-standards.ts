import { db } from "@/server/db";
import {
  gpaConversionRanges,
  gpaConversionStandards,
} from "@/server/db/schema";

const standards = [
  {
    name: "UK (4.0 Scale)",
    description:
      "UK degree classification converted to US 4.0 GPA scale. Used for UK university applications.",
    ranges: [
      {
        minPercentage: "70",
        maxPercentage: "100",
        gpaValue: "4.0",
        gradeLabel: "First-Class",
        sortOrder: "1",
      },
      {
        minPercentage: "60",
        maxPercentage: "69",
        gpaValue: "3.5",
        gradeLabel: "Upper Second (2:1)",
        sortOrder: "2",
      },
      {
        minPercentage: "50",
        maxPercentage: "59",
        gpaValue: "3.0",
        gradeLabel: "Lower Second (2:2)",
        sortOrder: "3",
      },
      {
        minPercentage: "40",
        maxPercentage: "49",
        gpaValue: "2.0",
        gradeLabel: "Third-Class",
        sortOrder: "4",
      },
      {
        minPercentage: "0",
        maxPercentage: "39",
        gpaValue: "0.0",
        gradeLabel: "Fail",
        sortOrder: "5",
      },
    ],
  },
  {
    name: "Canada",
    description:
      "Canadian percentage-based grading converted to US 4.0 GPA scale. Used for Canadian university applications.",
    ranges: [
      {
        minPercentage: "90",
        maxPercentage: "100",
        gpaValue: "4.0",
        gradeLabel: "A+",
        sortOrder: "1",
      },
      {
        minPercentage: "85",
        maxPercentage: "89",
        gpaValue: "4.0",
        gradeLabel: "A",
        sortOrder: "2",
      },
      {
        minPercentage: "80",
        maxPercentage: "84",
        gpaValue: "3.7",
        gradeLabel: "A-",
        sortOrder: "3",
      },
      {
        minPercentage: "75",
        maxPercentage: "79",
        gpaValue: "3.3",
        gradeLabel: "B+",
        sortOrder: "4",
      },
      {
        minPercentage: "70",
        maxPercentage: "74",
        gpaValue: "3.0",
        gradeLabel: "B",
        sortOrder: "5",
      },
      {
        minPercentage: "65",
        maxPercentage: "69",
        gpaValue: "2.7",
        gradeLabel: "B-",
        sortOrder: "6",
      },
      {
        minPercentage: "60",
        maxPercentage: "64",
        gpaValue: "2.3",
        gradeLabel: "C+",
        sortOrder: "7",
      },
      {
        minPercentage: "55",
        maxPercentage: "59",
        gpaValue: "2.0",
        gradeLabel: "C",
        sortOrder: "8",
      },
      {
        minPercentage: "0",
        maxPercentage: "54",
        gpaValue: "0.0",
        gradeLabel: "F",
        sortOrder: "9",
      },
    ],
  },
  {
    name: "Australia (7.0 Scale)",
    description:
      "Australian 7.0 GPA scale converted to US 4.0 scale. Used for Australian university applications.",
    ranges: [
      {
        minPercentage: "85",
        maxPercentage: "100",
        gpaValue: "4.0",
        gradeLabel: "HD (High Distinction)",
        sortOrder: "1",
      },
      {
        minPercentage: "75",
        maxPercentage: "84",
        gpaValue: "3.4",
        gradeLabel: "D (Distinction)",
        sortOrder: "2",
      },
      {
        minPercentage: "65",
        maxPercentage: "74",
        gpaValue: "2.9",
        gradeLabel: "C (Credit)",
        sortOrder: "3",
      },
      {
        minPercentage: "50",
        maxPercentage: "64",
        gpaValue: "2.3",
        gradeLabel: "P (Pass)",
        sortOrder: "4",
      },
      {
        minPercentage: "0",
        maxPercentage: "49",
        gpaValue: "0.0",
        gradeLabel: "F (Fail)",
        sortOrder: "5",
      },
    ],
  },
  {
    name: "Germany (1.0-5.0)",
    description:
      "German grading scale using Modified Bavarian Formula. Lower grades are better. Used for German university applications.",
    ranges: [
      {
        minPercentage: "90",
        maxPercentage: "100",
        gpaValue: "1.0",
        gradeLabel: "Sehr Gut (Very Good)",
        sortOrder: "1",
      },
      {
        minPercentage: "80",
        maxPercentage: "89",
        gpaValue: "2.0",
        gradeLabel: "Gut (Good)",
        sortOrder: "2",
      },
      {
        minPercentage: "70",
        maxPercentage: "79",
        gpaValue: "3.0",
        gradeLabel: "Befriedigend (Satisfactory)",
        sortOrder: "3",
      },
      {
        minPercentage: "60",
        maxPercentage: "69",
        gpaValue: "4.0",
        gradeLabel: "Ausreichend (Sufficient)",
        sortOrder: "4",
      },
      {
        minPercentage: "0",
        maxPercentage: "59",
        gpaValue: "5.0",
        gradeLabel: "Nicht Ausreichend (Fail)",
        sortOrder: "5",
      },
    ],
  },
  {
    name: "ECTS (European)",
    description:
      "European Credit Transfer and Accumulation System using relative grading. Based on percentile distribution.",
    ranges: [
      {
        minPercentage: "90",
        maxPercentage: "100",
        gpaValue: "4.0",
        gradeLabel: "A (Outstanding)",
        sortOrder: "1",
      },
      {
        minPercentage: "75",
        maxPercentage: "89",
        gpaValue: "3.3",
        gradeLabel: "B (Above Average)",
        sortOrder: "2",
      },
      {
        minPercentage: "60",
        maxPercentage: "74",
        gpaValue: "2.7",
        gradeLabel: "C (Average)",
        sortOrder: "3",
      },
      {
        minPercentage: "50",
        maxPercentage: "59",
        gpaValue: "2.0",
        gradeLabel: "D (Satisfactory)",
        sortOrder: "4",
      },
      {
        minPercentage: "0",
        maxPercentage: "49",
        gpaValue: "0.0",
        gradeLabel: "E/F (Fail)",
        sortOrder: "5",
      },
    ],
  },
];

async function seedGPAStandards() {
  console.log("Starting GPA conversion standards seeding...");

  for (const standard of standards) {
    // Check if standard already exists
    const existing = await db.query.gpaConversionStandards.findFirst({
      where: { name: standard.name },
    });

    if (existing) {
      console.log(`⏭️ Standard "${standard.name}" already exists, skipping...`);
      continue;
    }

    // Create the standard
    const standardId = crypto.randomUUID();
    await db.insert(gpaConversionStandards).values({
      id: standardId,
      name: standard.name,
      description: standard.description,
      isActive: true,
    });

    // Create the ranges
    const ranges = standard.ranges.map((range) => ({
      id: crypto.randomUUID(),
      standardId,
      minPercentage: range.minPercentage,
      maxPercentage: range.maxPercentage,
      gpaValue: range.gpaValue,
      gradeLabel: range.gradeLabel,
      sortOrder: range.sortOrder,
    }));

    await db.insert(gpaConversionRanges).values(ranges);
    console.log(`✅ Inserted "${standard.name}" with ${ranges.length} ranges.`);
  }

  console.log("✨ Seeding completed!");
}

seedGPAStandards()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
