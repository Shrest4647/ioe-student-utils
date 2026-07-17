export function normalizeContentTypeName(name: string): string {
  return name.trim();
}

export function normalizeResourceCategoryName(name: string): string {
  return name.trim();
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("unique constraint");
}
