"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers,
} from "lucide-react";
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
      className="group relative h-full transition-all duration-300"
    >
      {/* Glow Effect on Hover */}
      <div className="absolute -inset-0.5 rounded-2xl bg-linear-to-r from-primary/15 to-transparent opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card/70 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-md hover:shadow-primary/10 active:scale-[0.99]">
        {/* Header Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/course-explorer/${course.slug}`}
                className="line-clamp-2 block font-bold text-foreground text-lg tracking-tight transition-colors group-hover:text-primary"
              >
                {course.name}
              </Link>
              {course.code && (
                <p className="mt-1 font-mono text-muted-foreground text-xs uppercase tracking-widest">
                  {course.code}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary/80" />
              <span className="font-medium text-[11px] text-foreground/80">
                {course.credits ? `${course.credits} Credits` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-2.5 py-1.5">
              <Layers className="h-3.5 w-3.5 text-primary/80" />
              <span className="font-medium text-[11px] text-foreground/80">
                {course.units.length} Units
              </span>
            </div>
          </div>

          {/* Description Snippet */}
          {course.description && (
            <p className="line-clamp-3 text-muted-foreground text-xs leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* Footer / Expand Button */}
        <div className="mt-5 flex flex-col gap-2.5 border-border/50 border-t pt-3.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-secondary/20 px-3 py-1.5 text-secondary-foreground transition-all hover:bg-secondary/40"
            aria-expanded={isExpanded}
          >
            <span className="font-bold text-xs uppercase tracking-wide">
              {isExpanded ? "Hide Details" : "Scan Modules"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-4 overflow-hidden py-2"
            >
              {course.units.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {course.units.slice(0, 8).map((unit) => (
                      <span
                        key={unit.id}
                        className="whitespace-nowrap rounded-md border border-border/50 bg-muted/50 px-2 py-1 font-medium text-[10px] text-muted-foreground"
                      >
                        {unit.name}
                      </span>
                    ))}
                    {course.units.length > 8 && (
                      <span className="rounded-md border border-border/50 bg-muted/30 px-2 py-1 text-[10px] text-muted-foreground/60">
                        +{course.units.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <Link
            href={`/course-explorer/${course.slug}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 font-bold text-secondary-foreground text-xs shadow-sm transition-all hover:scale-[1.02] hover:bg-secondary/80 active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            Launch Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}
