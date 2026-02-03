"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, GraduationCap, Layers } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { MindmapView } from "@/components/course-explorer/mindmap-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StudyPath } from "@/types/course-explorer";

// ============================================================================
// Types
// ============================================================================

interface CourseDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  code: string | null;
  credits: number | null;
  units: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    unitType: "module" | "chapter";
    sortOrder: number;
  }>;
}

interface CourseResponse {
  success: boolean;
  data: CourseDetail;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchCourseDetail(slug: string): Promise<CourseResponse> {
  const response = await fetch(`/api/course-explorer/courses/slug/${slug}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch course details");
  }

  return response.json();
}

// ============================================================================
// Components
// ============================================================================

function CourseHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  );
}

function CourseHeader({
  course,
  topicCount,
}: {
  course: CourseDetail;
  topicCount: number;
}) {
  return (
    <div className="space-y-4">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/courses">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Courses
        </Link>
      </Button>

      {/* Title section */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-bold text-3xl tracking-tight">{course.name}</h1>
          {course.code && (
            <Badge variant="secondary" className="text-sm">
              {course.code}
            </Badge>
          )}
        </div>
        {course.description && (
          <p className="max-w-3xl text-lg text-muted-foreground">
            {course.description}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
        {course.credits && (
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            <span>{course.credits} credits</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Layers className="h-4 w-4" />
          <span>{course.units.length} units</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" />
          <span>{topicCount} topics</span>
        </div>
      </div>

      {/* Units list */}
      {course.units.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {course.units.map((unit) => (
            <Badge key={unit.id} variant="outline" className="text-xs">
              {unit.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <Layers className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">Failed to load course</h3>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm">
        {error.message || "Something went wrong while fetching the course."}
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
        <Button asChild variant="default">
          <Link href="/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">Course not found</h3>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm">
        The course you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/courses">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
      </Button>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function CourseExplorerPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;

  const [selectedPath, setSelectedPath] = useState<StudyPath>(undefined);
  const [topicCount] = useState(0);

  const {
    data: courseData,
    isLoading: isCourseLoading,
    error: courseError,
    refetch,
  } = useQuery({
    queryKey: ["course-detail", slug],
    queryFn: () => fetchCourseDetail(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const course = courseData?.data;

  // Handle loading state
  if (isCourseLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CourseHeaderSkeleton />
        <div className="mt-8">
          <Skeleton className="h-125 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Handle error state
  if (courseError) {
    return <ErrorState error={courseError} onRetry={() => refetch()} />;
  }

  // Handle not found
  if (!course) {
    return <NotFoundState />;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="container mx-auto border-border border-b px-4 py-6">
        <CourseHeader course={course} topicCount={topicCount} />
      </div>

      {/* Mindmap View */}
      <div className="flex-1 overflow-hidden">
        <MindmapView
          courseSlug={slug}
          path={selectedPath}
          onPathChange={setSelectedPath}
          onNodeClick={(node) => {
            // Node click is handled internally by MindmapView
            // This callback can be used for additional analytics or side effects
            console.log("Selected topic:", node.data.label);
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
