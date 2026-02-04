"use client";

import { BookOpen, ChevronDown, ChevronUp, GraduationCap, Layers } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 opacity-0 blur group-hover:opacity-100 transition duration-500" />
      
      <div className="relative h-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-slate-700/50 hover:bg-slate-900/60 flex flex-col">
        {/* Header Section */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Link
                href={`/course-explorer/${course.slug}`}
                className="line-clamp-2 block font-bold text-xl tracking-tight text-slate-100 transition-colors group-hover:text-indigo-400"
              >
                {course.name}
              </Link>
              {course.code && (
                <p className="mt-1 font-mono text-xs uppercase tracking-widest text-slate-500">
                  {course.code}
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2 border border-slate-700/30">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[11px] font-medium text-slate-300">
                {course.credits ? `${course.credits} Credits` : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2 border border-slate-700/30">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] font-medium text-slate-300">
                {course.units.length} Units
              </span>
            </div>
          </div>

          {/* Description Snippet */}
          {course.description && (
            <p className="line-clamp-3 text-sm text-slate-400 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* Footer / Expand Button */}
        <div className="mt-6 pt-4 border-t border-slate-800/50 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-800/20 px-4 py-2 text-slate-400 transition-all hover:bg-slate-800/40 hover:text-slate-200"
            aria-expanded={isExpanded}
          >
            <span className="text-xs font-semibold tracking-wide uppercase">
              {isExpanded ? "Hide Details" : "Scan Modules"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="slide-in-from-top-2 animate-in fade-in space-y-4 duration-300 py-2">
              {course.units.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {course.units.slice(0, 8).map((unit) => (
                      <span
                        key={unit.id}
                        className="rounded-md border border-slate-700/50 bg-slate-800/50 px-2 py-1 text-[10px] font-medium text-slate-400 whitespace-nowrap"
                      >
                        {unit.name}
                      </span>
                    ))}
                    {course.units.length > 8 && (
                      <span className="rounded-md border border-slate-700/50 bg-slate-800/30 px-2 py-1 text-[10px] text-slate-500">
                        +{course.units.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link
            href={`/course-explorer/${course.slug}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-bold text-sm text-white shadow-lg shadow-indigo-500/10 transition-all hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 group-hover:shadow-indigo-500/20"
          >
            <BookOpen className="h-4 w-4" />
            Launch Explorer
          </Link>
        </div>
      </div>
    </div>
  );
}
