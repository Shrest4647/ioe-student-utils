import { Elysia, t } from "elysia";
import {
  aggregateCourses,
  convertTuGrade,
  type DestinationId,
  destinationOptions,
  type GradeCourse,
  type SourceFormat,
} from "@/lib/tu-grade-converter";

const courseSchema = t.Object({
  name: t.Optional(t.String()),
  score: t.Number({ minimum: 0 }),
  credits: t.Number({ exclusiveMinimum: 0 }),
});

export const gpaConverterRoutes = new Elysia({ prefix: "/gpa-converter" })
  .get("/standards", () => ({ success: true, data: destinationOptions }), {
    detail: {
      tags: ["GPA Converter"],
      summary: "Get supported destination methods",
    },
  })
  .post(
    "/calculate",
    ({ body, set }) => {
      try {
        const sourceFormat = body.sourceFormat as SourceFormat;
        const destination = body.destination as DestinationId;
        const courses: GradeCourse[] | undefined = body.courses?.map(
          (course, index) => ({
            name: course.name?.trim() || `Course ${index + 1}`,
            score: course.score,
            credits: course.credits,
          }),
        );
        const score = courses?.length
          ? aggregateCourses(courses).score
          : body.score;

        if (score === undefined) {
          set.status = 400;
          return {
            success: false as const,
            error: "Enter a score or courses.",
          };
        }

        const result = convertTuGrade({
          score,
          sourceFormat,
          destination,
          passMark: body.passMark,
          courses,
        });

        return {
          success: true as const,
          data: {
            inputScore: Number(score.toFixed(2)),
            result,
          },
        };
      } catch (error) {
        set.status = 400;
        return {
          success: false as const,
          error:
            error instanceof Error
              ? error.message
              : "Unable to convert result.",
        };
      }
    },
    {
      body: t.Object({
        sourceFormat: t.Union([
          t.Literal("percentage"),
          t.Literal("gpa"),
          t.Literal("cgpa"),
        ]),
        destination: t.Union([
          t.Literal("us-canada"),
          t.Literal("germany"),
          t.Literal("uk"),
          t.Literal("australia"),
          t.Literal("india"),
          t.Literal("europe"),
          t.Literal("japan"),
          t.Literal("south-korea"),
          t.Literal("norway"),
          t.Literal("denmark"),
          t.Literal("finland"),
          t.Literal("ireland"),
          t.Literal("france"),
          t.Literal("spain"),
          t.Literal("singapore"),
          t.Literal("malaysia"),
          t.Literal("china"),
          t.Literal("portugal"),
        ]),
        score: t.Optional(t.Number({ minimum: 0 })),
        passMark: t.Optional(
          t.Number({ minimum: 1, maximum: 99, default: 40 }),
        ),
        courses: t.Optional(t.Array(courseSchema, { minItems: 1 })),
      }),
      detail: {
        tags: ["GPA Converter"],
        summary: "Estimate a TU result for an international destination",
      },
    },
  );
