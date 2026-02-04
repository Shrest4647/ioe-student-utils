"use client";

import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
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

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      data-testid={`course-card-${course.id}`}
      className="group rounded-xl border bg-card p-6 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary hover:border-primary/50 hover:shadow-md"
    >
      {/* Essential Info - Always Visible */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link
              href={`/course-explorer/${course.slug}`}
              className="line-clamp-2 block font-semibold text-xl transition-colors group-hover:text-primary"
            >
              {course.name}
            </Link>
            {course.code && (
              <p className="mt-1 text-muted-foreground text-sm">
                {course.code}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {course.credits && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs">
                {course.credits} credits
              </span>
            )}
            <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-xs">
              {course.units.length} units
            </span>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Show less details" : "Show more details"}
        >
          <span className="font-medium text-xs">
            {isExpanded ? "Show less" : "Show more"}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Progressive Disclosure - Details */}
      {isExpanded && (
        <div className="slide-in-from-top-2 mt-4 animate-in space-y-4 border-t pt-4 duration-200">
          {course.description && (
            <p className="line-clamp-4 text-muted-foreground text-sm leading-relaxed">
              {course.description}
            </p>
          )}

          {course.units.length > 0 && (
            <div>
              <h4 className="mb-2 font-medium text-sm">Course Units:</h4>
              <div className="flex flex-wrap gap-2">
                {course.units.slice(0, 6).map((unit) => (
                  <span
                    key={unit.id}
                    className="rounded-md border bg-muted px-2 py-1 text-xs"
                  >
                    {unit.name}
                  </span>
                ))}
                {course.units.length > 6 && (
                  <span className="rounded-md border bg-muted px-2 py-1 text-muted-foreground text-xs">
                    +{course.units.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          <Link
            href={`/course-explorer/${course.slug}`}
            className="inline-flex items-center gap-2 font-medium text-primary text-sm hover:underline"
          >
            <BookOpen className="h-4 w-4" />
            View Full Course
          </Link>
        </div>
      )}
    </div>
  );
}
