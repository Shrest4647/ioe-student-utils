export function normalizeCourseSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCanonicalCourseSlug(input: {
  code: string;
  name: string;
}): string {
  const codeSlug = normalizeCourseSlug(input.code);
  if (codeSlug) return codeSlug;

  const nameSlug = normalizeCourseSlug(input.name);
  return nameSlug || "course";
}

export function isOpaqueCourseReference(value: string): boolean {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    ) || /^[A-Za-z0-9_-]{18,}$/.test(value)
  );
}

export type CourseRouteSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function withCourseSearchParams(
  pathname: string,
  searchParams: CourseRouteSearchParams,
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item);
    } else if (value !== undefined) {
      query.set(key, value);
    }
  }

  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}
