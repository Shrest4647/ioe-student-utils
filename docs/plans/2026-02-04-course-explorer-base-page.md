# Course Explorer Base Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a beautiful, discovery-focused landing page for browsing all available courses with interactive search, smart filtering, and progressive disclosure course cards.

**Architecture:** Single-page course directory with hero search section, smart filter chips, responsive course grid. Client-side React component fetching from existing `/api/course-explorer/courses` endpoint with search/pagination. Progressive disclosure on course cards using hover/click states.

**Tech Stack:** Next.js 16 (App Router), React, TypeScript, TanStack Query (for data fetching), Tailwind CSS, Lucide React icons

---

## Overview

This plan creates `/course-explorer` (base route) - a course discovery page where students can browse, search, and filter all available courses. Each course card shows essential info initially, then reveals more details on interaction. The page uses the existing API endpoint `/api/course-explorer/courses` which supports search, pagination, and returns course/units data.

**Key Features:**
- Hero section with large search bar and gradient background
- Smart filter chips (adaptively show only relevant filters)
- Course grid with progressive disclosure cards
- Responsive design (mobile-first)
- Real-time search with debounce
- Loading and error states

---

### Task 1: Create Base Page Route Structure

**Files:**
- Create: `src/app/course-explorer/page.tsx`

**Step 1: Create the page component file**

```typescript
// src/app/course-explorer/page.tsx
import { CourseExplorerLanding } from "@/components/course-explorer/CourseExplorerLanding";

export default function CourseExplorerLandingPage() {
  return <CourseExplorerLanding />;
}
```

**Step 2: Verify file was created**

Run: `ls -la src/app/course-explorer/page.tsx`
Expected: File exists at `src/app/course-explorer/page.tsx`

**Step 3: Commit**

```bash
git add src/app/course-explorer/page.tsx
git commit -m "feat: add course explorer landing page route"
```

---

### Task 2: Create Course Explorer Landing Component Structure

**Files:**
- Create: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Write the failing component test**

Create `src/components/course-explorer/__tests__/CourseExplorerLanding.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { CourseExplorerLanding } from "../CourseExplorerLanding";

describe("CourseExplorerLanding", () => {
  it("renders hero section with search bar", () => {
    render(<CourseExplorerLanding />);
    expect(screen.getByPlaceholderText(/search by course name/i)).toBeInTheDocument();
  });

  it("renders filter chips", () => {
    render(<CourseExplorerLanding />);
    expect(screen.getByRole("button", { name: /all courses/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- CourseExplorerLanding.test.tsx`
Expected: FAIL with "CourseExplorerLanding not found"

**Step 3: Write minimal component structure**

```typescript
// src/components/course-explorer/CourseExplorerLanding.tsx
"use client";

import { Search } from "lucide-react";

export function CourseExplorerLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
              Explore Courses
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Discover your learning path with our interactive course explorer
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <div className="relative mx-auto max-w-2xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by course name, code, or topic..."
                  className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-4 shadow-lg ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:ring-gray-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- CourseExplorerLanding.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx src/components/course-explorer/__tests__/CourseExplorerLanding.test.tsx
git commit -m "feat: add course explorer landing component with hero section"
```

---

### Task 3: Add TanStack Query Integration for Course Data

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx:1-10`

**Step 1: Add useQuery hook for fetching courses**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

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

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["courses", searchQuery],
    queryFn: async (): Promise<CoursesResponse> => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/course-explorer/courses?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      return response.json();
    },
  });

  const courses = coursesData?.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="font-bold text-4xl tracking-tight sm:text-5xl">
              Explore Courses
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Discover your learning path with our interactive course explorer
            </p>

            {/* Search Bar */}
            <div className="mt-8">
              <div className="relative mx-auto max-w-2xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by course name, code, or topic..."
                  className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-4 shadow-lg ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:ring-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Count */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-muted-foreground text-sm">
          {isLoading ? "Loading..." : `Found ${courses.length} courses`}
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Verify search input works**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Expected: Search bar accepts input, shows loading state

**Step 3: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add course data fetching with TanStack Query"
```

---

### Task 4: Create Course Card Component with Progressive Disclosure

**Files:**
- Create: `src/components/course-explorer/CourseCard.tsx`
- Create: `src/components/course-explorer/__tests__/CourseCard.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/components/course-explorer/__tests__/CourseCard.test.tsx
import { render, screen } from "@testing-library/react";
import { CourseCard } from "../CourseCard";

describe("CourseCard", () => {
  const mockCourse = {
    id: "1",
    name: "Data Structures",
    slug: "data-structures",
    code: "BCT-301",
    description: "Learn data structures",
    credits: "3",
    units: [{ id: "u1", name: "Module 1" }],
  };

  it("renders course name and code", () => {
    render(<CourseCard course={mockCourse} />);
    expect(screen.getByText("Data Structures")).toBeInTheDocument();
    expect(screen.getByText("BCT-301")).toBeInTheDocument();
  });

  it("shows expanded details on click", () => {
    render(<CourseCard course={mockCourse} />);
    const card = screen.getByTestId("course-card-1");
    card.click();
    expect(screen.getByText("Learn data structures")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- CourseCard.test.tsx`
Expected: FAIL with "CourseCard not found"

**Step 3: Write CourseCard component**

```typescript
// src/components/course-explorer/CourseCard.tsx
"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

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

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      data-testid={`course-card-${course.id}`}
      onClick={() => setIsExpanded(!isExpanded)}
      className="group cursor-pointer rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
    >
      {/* Essential Info - Always Visible */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">
              {course.name}
            </h3>
            {course.code && (
              <p className="text-muted-foreground text-sm">{course.code}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {course.credits && (
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {course.credits} credits
              </span>
            )}
            <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium">
              {course.units.length} units
            </span>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex items-center justify-center text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Progressive Disclosure - Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {course.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {course.description}
            </p>
          )}

          {course.units.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium text-sm">Course Units:</h4>
              <div className="flex flex-wrap gap-2">
                {course.units.map((unit) => (
                  <span
                    key={unit.id}
                    className="rounded-md border bg-muted px-2 py-1 text-xs"
                  >
                    {unit.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <a
            href={`/course-explorer/${course.slug}`}
            className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <BookOpen className="h-4 w-4" />
            View Full Course
          </a>
        </div>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- CourseCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/course-explorer/CourseCard.tsx src/components/course-explorer/__tests__/CourseCard.test.tsx
git commit -m "feat: add course card component with progressive disclosure"
```

---

### Task 5: Add Course Grid to Landing Page

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx:60-80`

**Step 1: Import and use CourseCard component**

Add import at top:
```typescript
import { CourseCard } from "./CourseCard";
```

Add course grid section before closing div:
```typescript
      {/* Course Count */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-muted-foreground text-sm">
          {isLoading ? "Loading..." : `Found ${courses.length} courses`}
        </p>
      </div>

      {/* Course Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-lg">No courses found</h3>
            <p className="mt-2 text-muted-foreground text-sm">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
```

**Step 2: Verify grid displays courses**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Expected: See course cards in responsive grid

**Step 3: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add responsive course grid with loading states"
```

---

### Task 6: Add Smart Filter Chips

**Files:**
- Create: `src/components/course-explorer/FilterChips.tsx`
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Create FilterChips component**

```typescript
// src/components/course-explorer/FilterChips.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface FilterChipsProps {
  courses: Array<{
    units: Array<{ name: string }>;
    credits: string | null;
  }>;
}

export function FilterChips({ courses }: FilterChipsProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Extract unique departments from unit names
  const departments = Array.from(
    new Set(
      courses.flatMap((c) =>
        c.units.map((u) => u.name.split(" ")[0]).filter(Boolean)
      )
    )
  ).slice(0, 5);

  const chips = [
    { id: "all", label: "All Courses" },
    { id: "core", label: "Core Topics" },
    ...departments.map((d) => ({ id: d.toLowerCase(), label: d })),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => setActiveFilter(activeFilter === chip.id ? null : chip.id)}
          className={`
            whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors
            ${
              activeFilter === chip.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }
          `}
        >
          {chip.label}
          {activeFilter === chip.id && (
            <X className="ml-1 inline h-3 w-3" />
          )}
        </button>
      ))}
    </div>
  );
}
```

**Step 2: Add FilterChips to landing page**

Add import in CourseExplorerLanding.tsx:
```typescript
import { FilterChips } from "./FilterChips";
```

Add filter chips section after search bar:
```typescript
          </div>

          {/* Filter Chips */}
          <div className="mt-6">
            <FilterChips courses={courses} />
          </div>
        </div>
      </section>
```

**Step 3: Verify filter chips appear**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Expected: See filter chips below search bar

**Step 4: Commit**

```bash
git add src/components/course-explorer/FilterChips.tsx src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add smart filter chips"
```

---

### Task 7: Add Debounced Search

**Files:**
- Create: `src/hooks/use-debounce.ts`
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Create useDebounce hook**

```typescript
// src/hooks/use-debounce.ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Step 2: Use debounce hook in landing page**

Add import:
```typescript
import { useDebounce } from "@/hooks/use-debounce";
```

Update component:
```typescript
export function CourseExplorerLanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["courses", debouncedSearch],
    queryFn: async (): Promise<CoursesResponse> => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/course-explorer/courses?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      return response.json();
    },
  });

  const courses = coursesData?.data || [];
```

**Step 3: Test debounce behavior**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Type quickly in search box
Expected: API calls happen 300ms after you stop typing

**Step 4: Commit**

```bash
git add src/hooks/use-debounce.ts src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add debounced search to reduce API calls"
```

---

### Task 8: Add Error Handling

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Add error state to component**

```typescript
import { AlertCircle, BookOpen, Search } from "lucide-react";

// In component:
  const { data: coursesData, isLoading, error, refetch } = useQuery({
    // ... existing query
  });

  const courses = coursesData?.data || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {/* ... existing hero code ... */}

      {/* Error State */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 rounded-lg border border-destructive bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <h3 className="font-medium text-sm">Failed to load courses</h3>
              <p className="text-muted-foreground text-xs">
                {error instanceof Error ? error.message : "Please try again"}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {/* ... existing grid code ... */}
    </div>
  );
```

**Step 2: Test error state**

Run: `npm run dev`
Temporarily break API endpoint or go offline
Navigate to: `http://localhost:3000/course-explorer`
Expected: See error message with retry button

**Step 3: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add error handling with retry button"
```

---

### Task 9: Add Empty State for No Results

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Enhance empty state in course grid**

Replace the empty state div with:
```typescript
        ) : courses.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-lg">No courses found</h3>
            <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
              {searchQuery
                ? `No courses match "${searchQuery}". Try a different search term or clear the filters.`
                : "No courses available yet. Check back soon!"
              }
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Clear Search
              </button>
            )}
          </div>
```

**Step 2: Test empty state**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Type a search term that won't match anything (e.g., "xyz123")
Expected: See helpful empty state with clear search button

**Step 3: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: improve empty state with contextual message"
```

---

### Task 10: Add Responsive Design Improvements

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Update hero section for mobile**

```typescript
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24">
          <div className="text-center">
            <h1 className="font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight">
              Explore Courses
            </h1>
            <p className="mt-4 text-muted-foreground text-base sm:text-lg">
              Discover your learning path with our interactive course explorer
            </p>

            {/* Search Bar */}
            <div className="mt-6 sm:mt-8">
              <div className="relative mx-auto max-w-2xl">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by course name, code, or topic..."
                  className="h-12 sm:h-14 w-full rounded-full border-0 bg-white pl-12 pr-4 text-sm shadow-lg ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:ring-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="mt-4 sm:mt-6">
              <FilterChips courses={courses} />
            </div>
          </div>
        </div>
      </section>
```

**Step 2: Update course grid for responsive layout**

```typescript
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
```

**Step 3: Test responsive design**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Resize browser window (mobile, tablet, desktop)
Expected: Layout adapts smoothly at each breakpoint

**Step 4: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: improve responsive design for mobile devices"
```

---

### Task 11: Add Course Statistics Summary

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Add stats section below hero**

```typescript
import { BookOpen, GraduationCap, Layers } from "lucide-react";

// After hero section, before course count:
      {/* Course Statistics */}
      {courses.length > 0 && !isLoading && (
        <div className="border-b bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-2xl">{courses.length}</p>
                  <p className="text-muted-foreground text-sm">Total Courses</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Layers className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-2xl">
                    {courses.reduce((sum, c) => sum + c.units.length, 0)}
                  </p>
                  <p className="text-muted-foreground text-sm">Course Units</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                  <GraduationCap className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="font-semibold text-2xl">
                    {courses.filter((c) => c.credits && parseInt(c.credits) >= 3).length}
                  </p>
                  <p className="text-muted-foreground text-sm">Core Courses (3+ cr)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
```

**Step 2: Verify stats display correctly**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Expected: See three stat cards showing totals

**Step 3: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add course statistics summary section"
```

---

### Task 12: Add Skeleton Loading States

**Files:**
- Create: `src/components/course-explorer/CourseCardSkeleton.tsx`
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Create skeleton loader component**

```typescript
// src/components/course-explorer/CourseCardSkeleton.tsx
export function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Use skeleton in landing page**

Add import:
```typescript
import { CourseCardSkeleton } from "./CourseCardSkeleton";
```

Replace loading state:
```typescript
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
```

**Step 3: Test skeleton loaders**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Expected: See skeleton cards that match real card layout while loading

**Step 4: Commit**

```bash
git add src/components/course-explorer/CourseCardSkeleton.tsx src/components/course-explorer/CourseExplorerLanding.tsx
git commit -m "feat: add skeleton loading states for better UX"
```

---

### Task 13: Add Keyboard Navigation

**Files:**
- Modify: `src/components/course-explorer/CourseExplorerLanding.tsx`

**Step 1: Make search input keyboard accessible**

```typescript
          {/* Search Bar */}
          <div className="mt-6 sm:mt-8">
            <div className="relative mx-auto max-w-2xl">
              <label htmlFor="course-search" className="sr-only">
                Search courses
              </label>
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="course-search"
                type="text"
                placeholder="Search by course name, code, or topic..."
                className="h-12 sm:h-14 w-full rounded-full border-0 bg-white pl-12 pr-4 text-sm shadow-lg ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-primary focus:outline-none dark:bg-gray-800 dark:ring-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    (e.target as HTMLInputElement).blur();
                  }
                }}
              />
            </div>
          </div>
```

**Step 2: Make course cards keyboard accessible**

Update CourseCard.tsx:
```typescript
  return (
    <a
      href={`/course-explorer/${course.slug}`}
      data-testid={`course-card-${course.id}`}
      className="group block rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Card content */}
    </a>
  );
```

**Step 3: Test keyboard navigation**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
Press Tab to navigate to search
Type and press Escape to clear
Press Tab to navigate to course cards
Press Enter on a card to navigate

**Step 4: Commit**

```bash
git add src/components/course-explorer/CourseExplorerLanding.tsx src/components/course-explorer/CourseCard.tsx
git commit -m "feat: add keyboard navigation and accessibility"
```

---

### Task 14: Add Meta Tags and SEO

**Files:**
- Create: `src/app/course-explorer/layout.tsx`

**Step 1: Create layout with metadata**

```typescript
// src/app/course-explorer/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Explorer | IOE Student Utils",
  description:
    "Discover and explore IOE courses with our interactive course explorer. Browse by department, search by topic, and visualize learning paths.",
  keywords: ["IOE courses", "course explorer", "learning paths", "curriculum"],
  openGraph: {
    title: "Course Explorer | IOE Student Utils",
    description:
      "Discover and explore IOE courses with our interactive course explorer.",
    type: "website",
  },
};

export default function CourseExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

**Step 2: Verify metadata appears**

Run: `npm run dev`
Navigate to: `http://localhost:3000/course-explorer`
View page source (Ctrl+U)
Search for "Course Explorer | IOE Student Utils"

**Step 3: Commit**

```bash
git add src/app/course-explorer/layout.tsx
git commit -m "feat: add SEO metadata for course explorer"
```

---

### Task 15: Final Integration Testing

**Files:**
- None (testing task)

**Step 1: Test complete user flow**

Run: `npm run dev`

Test checklist:
- [ ] Page loads at `/course-explorer`
- [ ] Hero section displays correctly on mobile, tablet, desktop
- [ ] Search bar accepts input and shows results
- [ ] Debounce works (no API calls while typing)
- [ ] Filter chips display and toggle active state
- [ ] Course cards show essential info
- [ ] Course cards expand on click to show details
- [ ] "View Full Course" link navigates correctly
- [ ] Loading skeleton shows during fetch
- [ ] Error state displays with retry button
- [ ] Empty state shows helpful message
- [ ] Stats summary calculates correctly
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Responsive design works at all breakpoints

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Check console for errors**

Open browser DevTools Console
Look for errors, warnings, or accessibility issues

**Step 4: Create documentation**

Create `docs/features/course-explorer-base-page.md`:
```markdown
# Course Explorer Base Page

## Overview
Discovery-focused landing page at `/course-explorer` for browsing all courses.

## Features
- Interactive search with 300ms debounce
- Smart filter chips (adapt to available data)
- Progressive disclosure course cards
- Responsive grid layout
- Course statistics summary
- Keyboard navigation
- SEO optimized

## Usage
Navigate to `/course-explorer` to browse all available courses.

## Components
- `CourseExplorerLanding` - Main page component
- `CourseCard` - Individual course card with expand/collapse
- `FilterChips` - Smart filter system
- `CourseCardSkeleton` - Loading state
```

**Step 5: Final commit**

```bash
git add docs/features/course-explorer-base-page.md
git commit -m "docs: add course explorer base page documentation"
```

---

## Testing Strategy

### Unit Tests
- `CourseCard.test.tsx` - Test card rendering, expand/collapse, navigation
- `CourseExplorerLanding.test.tsx` - Test hero, search bar, filter chips

### Integration Tests
- Test search functionality with mock API
- Test filter chip state management
- Test error handling and retry logic

### E2E Tests
- Navigate to `/course-explorer`
- Search for courses
- Click filter chips
- Expand/collapse course cards
- Navigate to course detail page

### Accessibility Tests
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader compatibility
- Focus indicators
- ARIA labels

---

## Completion Checklist

- [ ] Base page route created at `/course-explorer`
- [ ] Hero section with gradient background
- [ ] Interactive search bar with debounce
- [ ] Smart filter chips
- [ ] Course cards with progressive disclosure
- [ ] Responsive grid layout
- [ ] Loading states (skeleton)
- [ ] Error handling
- [ ] Empty states
- [ ] Course statistics
- [ ] Keyboard navigation
- [ ] SEO metadata
- [ ] Documentation
- [ ] All tests passing

---

## Next Steps (Optional Enhancements)

1. **Advanced Filters**: Add department, credit range, difficulty filters
2. **Saved Searches**: Allow users to save search/filter combinations
3. **Course Comparison**: Compare multiple courses side-by-side
4. **Learning Paths**: Suggest course sequences based on prerequisites
5. **Course Bookmarks**: Allow students to bookmark favorite courses
6. **Recent Courses**: Show recently viewed courses
7. **Analytics**: Track popular courses and search terms
8. **Export**: Export course list as PDF/CSV
