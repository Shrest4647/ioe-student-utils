import { describe, expect, it } from "bun:test";
import { convertTuGrade } from "@/lib/tu-grade-converter";

describe("TU grade conversion engine", () => {
  it("has no decimal gaps between percentage bands", () => {
    const cases = [
      [49.99, "1.00"],
      [50, "2.67"],
      [59.99, "2.67"],
      [60, "3.00"],
      [69.99, "3.00"],
      [70, "3.33"],
      [79.99, "3.33"],
      [80, "3.67"],
      [89.99, "3.67"],
      [90, "4.00"],
    ] as const;

    for (const [score, expected] of cases) {
      const result = convertTuGrade({
        score,
        sourceFormat: "percentage",
        destination: "us-canada",
        passMark: 40,
      });
      expect(result.value).toBe(expected);
    }
  });

  it("respects programme-specific pass marks", () => {
    const passing = convertTuGrade({
      score: 47,
      sourceFormat: "percentage",
      destination: "us-canada",
      passMark: 40,
    });
    const failing = convertTuGrade({
      score: 47,
      sourceFormat: "percentage",
      destination: "us-canada",
      passMark: 50,
    });

    expect(passing.value).toBe("1.00");
    expect(failing.value).toBe("0.00");
  });

  it("does not invent an ECTS letter grade", () => {
    const result = convertTuGrade({
      score: 74,
      sourceFormat: "percentage",
      destination: "europe",
    });

    expect(result.value).toBe("74.0%");
    expect(result.classification).toBe("Use a programme grading table");
  });

  it("marks a result below the selected German pass mark as failed", () => {
    const result = convertTuGrade({
      score: 44,
      sourceFormat: "percentage",
      destination: "germany",
      passMark: 45,
    });

    expect(result.value).toBe("5.00");
    expect(result.classification).toBe("Fail");
  });

  it("preserves an awarded TU CGPA", () => {
    const result = convertTuGrade({
      score: 3.46,
      sourceFormat: "cgpa",
      destination: "malaysia",
    });

    expect(result.value).toBe("3.46");
    expect(result.scale).toBe("TU CGPA / 4.0");
    expect(result.classification).toBe("Typical context: 4.0 CGPA");
  });

  it("supports every destination without manufacturing a local grade", () => {
    const destinations = [
      "japan",
      "south-korea",
      "norway",
      "denmark",
      "finland",
      "ireland",
      "france",
      "spain",
      "singapore",
      "malaysia",
      "china",
      "portugal",
    ] as const;

    for (const destination of destinations) {
      const result = convertTuGrade({
        score: 72,
        sourceFormat: "percentage",
        destination,
      });
      expect(result.value).toBe("72.0%");
      expect(result.confidence).toBe("Direct result");
    }
  });
});
