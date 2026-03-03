import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { db } from "@/server/db";
import { elysiaApi } from "@/server/elysia";

describe("Scholarships Taxonomy API", () => {
  const originalCountriesFindMany = (db as any).query.countries.findMany;
  const originalDegreesFindMany = (db as any).query.degreeLevels.findMany;
  const originalFieldsFindMany = (db as any).query.fieldsOfStudy.findMany;

  beforeEach(() => {
    (db as any).query.countries.findMany = async () => [
      { code: "US", name: "United States" },
      { code: "DE", name: "Germany" },
    ];

    (db as any).query.degreeLevels.findMany = async () => [
      { id: "bachelors", name: "Bachelors", rank: 1 },
      { id: "masters", name: "Masters", rank: 2 },
    ];

    (db as any).query.fieldsOfStudy.findMany = async () => [
      { id: "cs", name: "Computer Science" },
      { id: "ee", name: "Electrical Engineering" },
    ];
  });

  afterEach(() => {
    (db as any).query.countries.findMany = originalCountriesFindMany;
    (db as any).query.degreeLevels.findMany = originalDegreesFindMany;
    (db as any).query.fieldsOfStudy.findMany = originalFieldsFindMany;
  });

  it("lists countries", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/scholarships/countries"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[0].name).toBe("United States");
  });

  it("lists degree levels", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/scholarships/degrees"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[1].name).toBe("Masters");
  });

  it("lists fields of study", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/scholarships/fields"))
      .then((res) => res.json());

    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBe(2);
    expect(response.data[0].id).toBe("cs");
  });
});
