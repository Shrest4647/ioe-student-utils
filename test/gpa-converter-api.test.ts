import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { db } from "@/server/db";
import {
  gpaConversionRanges,
  gpaConversionStandards,
} from "@/server/db/schema";
import { elysiaApi } from "@/server/elysia";

describe("GPA Converter API", () => {
  const originalSelect = (db as any).select;

  beforeEach(() => {
    (db as any).select = () => ({
      from: (table: unknown) => {
        if (table === gpaConversionStandards) {
          return {
            where: () => ({
              limit: async (count: number) =>
                [
                  {
                    id: "std-1",
                    name: "US 4.0",
                    description: "US scale",
                    isActive: true,
                  },
                ].slice(0, count),
            }),
          };
        }

        if (table === gpaConversionRanges) {
          return {
            where: async () => [
              {
                standardId: "std-1",
                minPercentage: "90",
                maxPercentage: "100",
                gpaValue: "4.0",
                gradeLabel: "A",
                sortOrder: "1",
              },
              {
                standardId: "std-1",
                minPercentage: "80",
                maxPercentage: "89.99",
                gpaValue: "3.7",
                gradeLabel: "A-",
                sortOrder: "2",
              },
            ],
          };
        }

        return {
          where: async () => [],
          limit: async () => [],
        };
      },
    });
  });

  afterEach(() => {
    (db as any).select = originalSelect;
  });

  it("calculates cumulative GPA for valid courses", async () => {
    const response = await elysiaApi
      .handle(
        new Request("http://localhost/api/gpa-converter/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            standardId: "std-1",
            courses: [
              { name: "Math", percentage: "95", credits: "3" },
              { name: "Physics", percentage: "85", credits: "4" },
            ],
          }),
        }),
      )
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(response.data.courses.length).toBe(2);
    expect(response.data.cumulativeGPA).toBe(3.83);
    expect(response.data.totalCredits).toBe(7);
    expect(response.data.totalQualityPoints).toBe(26.8);
  });

  it("returns error when conversion standard does not exist", async () => {
    (db as any).select = () => ({
      from: (table: unknown) => {
        if (table === gpaConversionStandards) {
          return {
            where: () => ({
              limit: async () => [],
            }),
          };
        }
        return {
          where: async () => [],
          limit: async () => [],
        };
      },
    });

    const response = await elysiaApi
      .handle(
        new Request("http://localhost/api/gpa-converter/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            standardId: "missing-standard",
            courses: [{ name: "Math", percentage: "95", credits: "3" }],
          }),
        }),
      )
      .then((res) => res.json());

    expect(response.success).toBe(false);
    expect(response.error).toBe("Conversion standard not found");
  });
});
