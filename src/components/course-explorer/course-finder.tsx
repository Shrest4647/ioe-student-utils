"use client";

import { ArrowRight, BookOpen, Clock3, FileText, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import type {
  CourseCatalogItem,
  CourseCatalogResult,
} from "@/types/course-learning";

interface CourseFinderProps {
  result: CourseCatalogResult;
  initialSearch: string;
}

export function CourseFinder({ result, initialSearch }: CourseFinderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (current === debouncedSearch) return;

    const next = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) next.set("q", debouncedSearch);
    else next.delete("q");

    startTransition(() => {
      router.replace(`/course-explorer${next.size ? `?${next}` : ""}`, {
        scroll: false,
      });
    });
  }, [debouncedSearch, router, searchParams]);

  const ready = useMemo(
    () => result.data.filter((course) => course.hasExplorerContent),
    [result.data],
  );
  const upcoming = useMemo(
    () => result.data.filter((course) => !course.hasExplorerContent),
    [result.data],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="max-w-2xl">
        <p className="font-medium text-primary text-sm">Course Explorer</p>
        <h1 className="mt-2 font-bold text-3xl tracking-tight sm:text-4xl">
          Find a course to study
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Search the syllabus by course, code, or topic. Open a course to review
          its units, priorities, prerequisites, and resources.
        </p>
      </header>

      <div className="mt-8 max-w-2xl">
        <label htmlFor="course-search" className="sr-only">
          Search courses and topics
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="course-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try CT 501, Mathematics, or pointers"
            className="h-11 pl-10 text-base"
          />
        </div>
        <p className="mt-2 text-muted-foreground text-xs" aria-live="polite">
          {isPending
            ? "Updating results…"
            : `${ready.length} course${ready.length === 1 ? "" : "s"} ready to explore`}
        </p>
      </div>

      <RecentCourseLink />

      <section className="mt-10" aria-labelledby="available-courses-heading">
        <div className="flex items-end justify-between gap-4 border-b pb-3">
          <div>
            <h2
              id="available-courses-heading"
              className="font-semibold text-xl"
            >
              Available course outlines
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Only courses with active topics appear here.
            </p>
          </div>
          <span className="text-muted-foreground text-sm">{ready.length}</span>
        </div>

        {ready.length > 0 ? (
          <div className="divide-y">
            {ready.map((course) => (
              <CourseResult key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="py-14 text-center">
            <BookOpen className="mx-auto size-8 text-muted-foreground" />
            <h3 className="mt-4 font-medium">No ready outlines found</h3>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
              {search
                ? `No course or topic matched “${search}”. Try a course code or a broader topic.`
                : "Course outlines will appear here after units and topics are published."}
            </p>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <details className="mt-10 border-y py-4">
          <summary className="cursor-pointer font-medium text-sm">
            Outlines coming soon ({upcoming.length})
          </summary>
          <div className="mt-4 divide-y">
            {upcoming.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium">{course.name}</p>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {course.code} · No published topics yet
                  </p>
                </div>
                <Badge variant="outline">Coming soon</Badge>
              </div>
            ))}
          </div>
        </details>
      )}
    </main>
  );
}

function CourseResult({ course }: { course: CourseCatalogItem }) {
  return (
    <article>
      <Link
        href={`/course-explorer/${course.slug}`}
        className="group grid gap-4 py-5 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 sm:grid-cols-[1fr_auto] sm:items-center sm:px-3"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-lg group-hover:text-primary">
              {course.name}
            </h3>
            <Badge variant="outline" className="font-mono">
              {course.code}
            </Badge>
          </div>
          {course.description && (
            <p className="mt-2 line-clamp-2 max-w-3xl text-muted-foreground text-sm">
              {course.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground text-xs">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="size-3.5" />
              {course.activeUnitCount} units
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" />
              {course.activeTopicCount} topics
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {course.credits
                ? `${course.credits} credits`
                : "Credits not listed"}
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 font-medium text-primary text-sm">
          Open outline
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    </article>
  );
}

function RecentCourseLink() {
  const [recent, setRecent] = useState<{
    slug: string;
    name: string;
    code: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ioesu:recent-course");
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      setRecent(null);
    }
  }, []);

  if (!recent) return null;

  return (
    <aside className="mt-8 flex max-w-2xl flex-wrap items-center justify-between gap-3 border-y py-4">
      <div>
        <p className="font-medium text-sm">Continue learning</p>
        <p className="text-muted-foreground text-sm">
          {recent.code} · {recent.name}
        </p>
      </div>
      <Link
        href={`/course-explorer/${recent.slug}`}
        className="font-medium text-primary text-sm hover:underline"
      >
        Continue course
      </Link>
    </aside>
  );
}
