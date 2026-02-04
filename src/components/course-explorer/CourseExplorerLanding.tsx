"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Layers,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { CourseCard } from "./CourseCard";
import { CourseCardSkeleton } from "./CourseCardSkeleton";
import { FilterChips } from "./FilterChips";

interface Course {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  description: string | null;
  credits: string | null;
  units: Array<{
    id: string;
    name: string;
  }>;
}

interface CoursesResponse {
  success: boolean;
  data: Course[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
  };
}

export function CourseExplorerLanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data: coursesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["courses", debouncedSearch],
    queryFn: async (): Promise<CoursesResponse> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(
        `/api/course-explorer/courses?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      return response.json();
    },
  });

  const courses = coursesData?.data || [];

  const stats = useMemo(() => {
    if (!courses.length) return null;
    return {
      totalCourses: courses.length,
      totalUnits: courses.reduce((sum, c) => sum + c.units.length, 0),
      coreCourses: courses.filter(
        (c) => c.credits && parseInt(c.credits, 10) >= 3,
      ).length,
    };
  }, [courses]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl" />
          <div className="absolute -bottom-1/2 -left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 md:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text font-bold text-3xl text-transparent tracking-tight sm:text-4xl md:text-5xl dark:from-white dark:via-indigo-200 dark:to-white">
              Explore Courses
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Discover your learning path with our interactive course explorer.
              Search through all available courses and find your perfect
              curriculum.
            </p>

            {/* Search Bar */}
            <div className="mt-6 sm:mt-8">
              <div className="relative mx-auto max-w-2xl">
                <label htmlFor="course-search" className="sr-only">
                  Search courses
                </label>
                <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="course-search"
                  type="text"
                  placeholder="Search by course name, code, or topic..."
                  className="h-12 w-full rounded-full border-0 bg-white pr-12 pl-12 text-sm shadow-lg ring-1 ring-gray-200 ring-inset transition-shadow focus:outline-none focus:ring-2 focus:ring-primary sm:h-14 dark:bg-gray-800 dark:ring-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchQuery("");
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Chips */}
            <div className="mt-4 sm:mt-6">
              <FilterChips courses={courses} />
            </div>
          </div>
        </div>
      </section>

      {/* Course Statistics */}
      {stats && !isLoading && (
        <div className="border-b bg-background/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
                  <BookOpen className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <p className="font-semibold text-2xl">{stats.totalCourses}</p>
                  <p className="text-muted-foreground text-sm">Total Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
                  <Layers className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <p className="font-semibold text-2xl">{stats.totalUnits}</p>
                  <p className="text-muted-foreground text-sm">Course Units</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <GraduationCap className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-2xl">{stats.coreCourses}</p>
                  <p className="text-muted-foreground text-sm">
                    Core Courses (3+ cr)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="font-medium text-sm">Failed to load courses</h3>
              <p className="text-muted-foreground text-xs">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Course Count */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? "Loading courses..."
            : `Found ${courses.length} course${courses.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Course Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-lg">No courses found</h3>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
              {searchQuery
                ? `No courses match "${searchQuery}". Try a different search term or clear the filters.`
                : "No courses available yet. Check back soon!"}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
