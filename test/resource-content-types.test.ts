import { describe, expect, it } from "bun:test";
import {
  isUniqueConstraintViolation,
  normalizeContentTypeName,
  normalizeResourceCategoryName,
} from "@/lib/resource-content-types";

describe("resource category input", () => {
  it("trims a category name", () => {
    expect(normalizeResourceCategoryName("  Engineering  ")).toBe(
      "Engineering",
    );
  });

  it("normalizes whitespace-only category names to an empty string", () => {
    expect(normalizeResourceCategoryName(" \t\n ")).toBe("");
  });
});

describe("resource content type input", () => {
  it("trims a content type name", () => {
    expect(normalizeContentTypeName("  Lecture notes  ")).toBe("Lecture notes");
  });

  it("normalizes whitespace-only names to an empty string", () => {
    expect(normalizeContentTypeName(" \t\n ")).toBe("");
  });

  it("recognizes Postgres unique constraint errors", () => {
    expect(isUniqueConstraintViolation({ code: "23505" })).toBe(true);
    expect(
      isUniqueConstraintViolation(
        new Error("duplicate key violates unique constraint"),
      ),
    ).toBe(true);
  });

  it("does not hide unrelated database errors", () => {
    expect(isUniqueConstraintViolation({ code: "08006" })).toBe(false);
  });
});
