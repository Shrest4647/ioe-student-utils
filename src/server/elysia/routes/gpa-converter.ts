import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import {
  gpaConversionStandards,
  gpaConversionRanges,
  gpaConversions,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";
import { sql } from "drizzle-orm";

// Course input type for calculations
const courseInputSchema = t.Object({
  name: t.String({ minLength: 1 }),
  percentage: t.String({
    pattern: "^\\d+\\.?\\d*$",
    error: "Percentage must be a valid number",
  }),
  credits: t.String({
    pattern: "^\\d+\\.?\\d*$",
    error: "Credits must be a valid number",
  }),
});

// Helper function to convert percentage to GPA based on ranges
function calculateGPAForCourse(
  percentage: number,
  ranges: Array<{
    minPercentage: string;
    maxPercentage: string;
    gpaValue: string;
    gradeLabel: string | null;
  }>,
) {
  // Find matching range (inclusive boundaries)
  const matchingRange = ranges.find(
    (range) =>
      percentage >= parseFloat(range.minPercentage) &&
      percentage <= parseFloat(range.maxPercentage),
  );

  if (!matchingRange) {
    throw new Error(`No matching GPA range found for percentage: ${percentage}`);
  }

  return {
    gpa: parseFloat(matchingRange.gpaValue),
    gradeLabel: matchingRange.gradeLabel,
  };
}

export const gpaConverterRoutes = new Elysia({ prefix: "/gpa-converter" })
  .use(authorizationPlugin)
  // GET /standards - Get all active conversion standards
  .get(
    "/standards",
    async () => {
      // Get all active standards using select instead of query
      const standards = await db
        .select()
        .from(gpaConversionStandards)
        .where(eq(gpaConversionStandards.isActive, true));

      // Get all ranges
      const allRanges = await db.select().from(gpaConversionRanges);

      // Group ranges by standardId and sort them
      const standardsWithRanges = standards.map((standard) => {
        const ranges = allRanges
          .filter((range) => range.standardId === standard.id)
          .sort((a, b) => parseInt(a.sortOrder) - parseInt(b.sortOrder));

        return {
          ...standard,
          ranges,
        };
      });

      return {
        success: true,
        data: standardsWithRanges,
      };
    },
    {
      detail: {
        tags: ["GPA Converter"],
        summary: "Get all active conversion standards with their ranges",
      },
    },
  )

  // POST /calculate - Calculate GPA from course grades
  .post(
    "/calculate",
    async ({ body }) => {
      const { standardId, courses } = body;

      // Validate standard exists
      const [standard] = await db
        .select()
        .from(gpaConversionStandards)
        .where(eq(gpaConversionStandards.id, standardId))
        .limit(1);

      if (!standard) {
        return {
          success: false,
          error: "Conversion standard not found",
        };
      }

      if (!standard.isActive) {
        return {
          success: false,
          error: "Conversion standard is not active",
        };
      }

      // Get ranges for this standard
      const ranges = await db
        .select()
        .from(gpaConversionRanges)
        .where(eq(gpaConversionRanges.standardId, standardId));

      // Sort ranges
      const sortedRanges = ranges.sort(
        (a, b) => parseInt(a.sortOrder) - parseInt(b.sortOrder),
      );

      // Calculate GPA for each course
      const courseResults = courses.map((course) => {
        const percentage = parseFloat(course.percentage);
        const credits = parseFloat(course.credits);

        if (percentage < 0 || percentage > 100) {
          throw new Error(
            `Invalid percentage for course "${course.name}": must be between 0 and 100`,
          );
        }

        if (credits <= 0) {
          throw new Error(
            `Invalid credits for course "${course.name}": must be greater than 0`,
          );
        }

        const { gpa, gradeLabel } = calculateGPAForCourse(
          percentage,
          sortedRanges,
        );
        const qualityPoints = gpa * credits;

        return {
          name: course.name,
          percentage: course.percentage,
          credits: course.credits,
          gpa,
          gradeLabel,
          qualityPoints: parseFloat(qualityPoints.toFixed(2)),
        };
      });

      // Calculate cumulative GPA
      const totalCredits = courseResults.reduce(
        (sum, course) => sum + parseFloat(course.credits),
        0,
      );
      const totalQualityPoints = courseResults.reduce(
        (sum, course) => sum + course.qualityPoints,
        0,
      );
      const cumulativeGPA =
        totalCredits > 0 ? totalQualityPoints / totalCredits : 0;

      return {
        success: true,
        data: {
          courses: courseResults,
          cumulativeGPA: parseFloat(cumulativeGPA.toFixed(2)),
          totalCredits: parseFloat(totalCredits.toFixed(2)),
          totalQualityPoints: parseFloat(totalQualityPoints.toFixed(2)),
          standard: {
            id: standard.id,
            name: standard.name,
            description: standard.description,
          },
        },
      };
    },
    {
      body: t.Object({
        standardId: t.String({ minLength: 1 }),
        courses: t.Array(courseInputSchema, {
          minItems: 1,
          error: "At least one course is required",
        }),
      }),
      detail: {
        tags: ["GPA Converter"],
        summary: "Calculate GPA from course grades",
      },
    },
  )

  // POST /save - Save a GPA calculation (authenticated users only)
  .post(
    "/save",
    async ({ body, user }) => {
      const {
        standardId,
        name,
        courses,
        cumulativeGPA,
        totalCredits,
        totalQualityPoints,
      } = body;

      // Validate standard exists
      const [standard] = await db
        .select()
        .from(gpaConversionStandards)
        .where(eq(gpaConversionStandards.id, standardId))
        .limit(1);

      if (!standard) {
        return {
          success: false,
          error: "Conversion standard not found",
        };
      }

      // Create saved calculation
      const id = crypto.randomUUID();
      await db.insert(gpaConversions).values({
        id,
        userId: user.id,
        standardId,
        name: name ?? null,
        cumulativeGPA: cumulativeGPA.toString(),
        totalCredits: totalCredits.toString(),
        totalQualityPoints: totalQualityPoints.toString(),
        courseCount: courses.length.toString(),
        calculationData: courses as any, // Store as JSONB
      });

      return {
        success: true,
        data: { id },
      };
    },
    {
      auth: true,
      body: t.Object({
        standardId: t.String({ minLength: 1 }),
        name: t.Optional(t.String()),
        courses: t.Array(courseInputSchema),
        cumulativeGPA: t.String({
          pattern: "^\\d+\\.?\\d*$",
          error: "Cumulative GPA must be a valid number",
        }),
        totalCredits: t.String({
          pattern: "^\\d+\\.?\\d*$",
          error: "Total credits must be a valid number",
        }),
        totalQualityPoints: t.String({
          pattern: "^\\d+\\.?\\d*$",
          error: "Total quality points must be a valid number",
        }),
      }),
      detail: {
        tags: ["GPA Converter"],
        summary: "Save a GPA calculation (authenticated users only)",
      },
    },
  )

  // GET /history - Get user's saved GPA calculations
  .get(
    "/history",
    async ({ user }) => {
      const calculations = await db
        .select()
        .from(gpaConversions)
        .where(
          and(
            eq(gpaConversions.userId, user.id),
            eq(gpaConversions.isDeleted, false),
          ),
        );

      // Get all standards
      const standards = await db.select().from(gpaConversionStandards);

      // Attach standard info to each calculation
      const calculationsWithStandard = calculations.map((calc) => ({
        ...calc,
        courseCount: parseInt(calc.courseCount),
        standard: standards.find((s) => s.id === calc.standardId),
      }));

      return {
        success: true,
        data: calculationsWithStandard,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["GPA Converter"],
        summary: "Get user's saved GPA calculations",
      },
    },
  )

  // DELETE /:id - Soft delete a saved calculation
  .delete(
    "/:id",
    async ({ params, user }) => {
      const { id } = params;

      // Check if calculation exists and belongs to user
      const [calculation] = await db
        .select()
        .from(gpaConversions)
        .where(eq(gpaConversions.id, id))
        .limit(1);

      if (!calculation) {
        return {
          success: false,
          error: "Calculation not found",
        };
      }

      if (calculation.userId !== user.id) {
        return {
          success: false,
          error: "You don't have permission to delete this calculation",
        };
      }

      // Soft delete
      await db
        .update(gpaConversions)
        .set({ isDeleted: true })
        .where(eq(gpaConversions.id, id));

      return {
        success: true,
        message: "Calculation deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["GPA Converter"],
        summary: "Soft delete a saved calculation",
      },
    },
  );
