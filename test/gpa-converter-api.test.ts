import { describe, expect, it } from "bun:test";
import { elysiaApi } from "@/server/elysia";

async function calculate(body: unknown) {
  const response = await elysiaApi.handle(
    new Request("http://localhost/api/gpa-converter/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  return { status: response.status, body: await response.json() };
}

describe("GPA Converter API", () => {
  it("uses TU bands and standard quality points for a US estimate", async () => {
    const response = await calculate({
      sourceFormat: "percentage",
      destination: "us-canada",
      score: 72,
      passMark: 40,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.result.value).toBe("3.33");
    expect(response.body.data.result.confidence).toBe("Method-based estimate");
  });

  it("credit-weights course-by-course US estimates", async () => {
    const response = await calculate({
      sourceFormat: "percentage",
      destination: "us-canada",
      passMark: 40,
      courses: [
        { name: "Math", score: 92, credits: 3 },
        { name: "Physics", score: 72, credits: 4 },
      ],
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data.inputScore).toBe(80.57);
    expect(response.body.data.result.value).toBe("3.62");
  });

  it("uses the selected pass mark in the modified Bavarian formula", async () => {
    const response = await calculate({
      sourceFormat: "percentage",
      destination: "germany",
      score: 70,
      passMark: 40,
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data.result.value).toBe("2.50");
    expect(response.body.data.result.comparisonDirection).toBe("lower");
  });

  it("preserves a TU GPA instead of converting it again", async () => {
    const response = await calculate({
      sourceFormat: "gpa",
      destination: "us-canada",
      score: 3.42,
    });

    expect(response.body.success).toBe(true);
    expect(response.body.data.result.value).toBe("3.42");
    expect(response.body.data.result.confidence).toBe("Direct result");
  });

  it("rejects a percentage above 100", async () => {
    const response = await calculate({
      sourceFormat: "percentage",
      destination: "uk",
      score: 101,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("accepts CGPA for an additional destination", async () => {
    const response = await calculate({
      sourceFormat: "cgpa",
      destination: "south-korea",
      score: 3.58,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.result.value).toBe("3.58");
    expect(response.body.data.result.scale).toBe("TU CGPA / 4.0");
  });
});
