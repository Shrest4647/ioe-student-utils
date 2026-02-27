"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Layers,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";
import type { Course, PaginationMetadata } from "@/types/course-explorer";

// ============================================================================
// Types
// ============================================================================

interface CoursesResponse {
  success: boolean;
  data: Course[];
  metadata: PaginationMetadata;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchCourses(
  search?: string,
  page = 1,
): Promise<CoursesResponse> {
  const { data, error } = await apiClient.api["course-explorer"].courses.get({
    query: {
      search,
      page: String(page),
      limit: "12",
    },
  });

  if (error || !data?.success) {
    throw new Error((error?.value as any)?.error || "Failed to fetch courses");
  }

  return data as any;
}

// ============================================================================
// Components
// ============================================================================

function CourseCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-16 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">{course.name}</CardTitle>
          {course.code && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {course.code}
            </Badge>
          )}
        </div>
        {course.credits && (
          <CardDescription>{course.credits} credits</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        {course.description ? (
          <p className="line-clamp-3 text-muted-foreground text-sm">
            {course.description}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            No description available
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/courses/${course.slug}`}>
            <BookOpen className="mr-2 h-4 w-4" />
            Explore Course
            <ChevronRight className="ml-auto h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <GraduationCap className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">No courses found</h3>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm">
        Try adjusting your search or check back later for new course additions.
      </p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <Layers className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">Failed to load courses</h3>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm">
        {error.message || "Something went wrong while fetching courses."}
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Try Again
      </Button>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["courses", searchQuery],
    queryFn: () => fetchCourses(searchQuery || undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const courses = data?.data ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Courses</h1>
            <p className="mt-2 text-muted-foreground">
              Explore available courses and their topic structures
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton loader uses static array
            <CourseCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : courses.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {/* Pagination info */}
          {data?.metadata && (
            <div className="mt-8 text-center text-muted-foreground text-sm">
              Showing {courses.length} of {data.metadata.totalCount} courses
            </div>
          )}
        </>
      )}
    </div>
  );
}
