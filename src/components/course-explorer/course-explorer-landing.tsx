"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Layers,
  Search,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { CourseCard } from "./course-card";
import { CourseCardSkeleton } from "./course-card-skeleton";
import { FilterChips } from "./filter-chips";

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

function StarField() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-muted-foreground/30 dark:bg-foreground/50"
          initial={{
            opacity: Math.random() * 0.3 + 0.1,
            scale: Math.random() * 0.5 + 0.5,
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0.1, 0.6, 0.1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
          }}
        />
      ))}
    </div>
  );
}

export function CourseExplorerLanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground transition-colors duration-500"
    >
      {/* Hero Section */}
      <section className="relative flex h-[70vh] items-center justify-center overflow-hidden border-border/10 border-b">
        <StarField />

        {/* Animated Background Orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.15, 0.05],
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -right-[5%] h-[600px] w-[600px] rounded-full bg-linear-to-br from-primary/20 to-primary/10 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.05, 0.1, 0.05],
              x: [0, -60, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -left-[5%] h-[600px] w-[600px] rounded-full bg-linear-to-br from-primary/10 to-primary/20 blur-[120px]"
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="mb-6 font-black text-5xl tracking-tight sm:text-7xl">
              <span className="bg-linear-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Navigate Your
              </span>
              <br />
              <span className="bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Academic Universe
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground leading-relaxed sm:text-xl">
              Explore your degree like never before. From prerequisite maps to
              exam focus paths, discover the connections that define your
              learning.
            </p>

            {/* Futuristic Search Bar */}
            <div className="relative mx-auto max-w-3xl">
              <div className="group relative flex items-center">
                <div className="absolute -inset-1 rounded-full bg-linear-to-r from-primary via-primary/50 to-primary/30 opacity-20 blur transition duration-500 group-focus-within:opacity-40 dark:opacity-30" />
                <div className="relative flex w-full items-center rounded-full border border-border bg-card/80 p-1 shadow-xl backdrop-blur-xl transition-colors">
                  <div className="pointer-events-none pl-6">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by course name, code, or topic..."
                    className="h-14 w-full bg-transparent pr-12 pl-4 text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-lg"
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
                      className="mr-6 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Filter Chips */}
              <div className="mt-8">
                <FilterChips courses={courses} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      {stats && !isLoading && stats.totalCourses > 0 && (
        <section className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                label: "Total Courses",
                value: stats.totalCourses,
                icon: BookOpen,
              },
              { label: "Course Units", value: stats.totalUnits, icon: Layers },
              {
                label: "Core Courses",
                value: stats.coreCourses,
                icon: GraduationCap,
              },
            ].map((stat, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={stat.label}
                className="group relative"
              >
                <div className="absolute -inset-0.5 rounded-2xl bg-primary/20 opacity-0 blur-sm transition duration-300 group-hover:opacity-100" />
                <div className="relative flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-6 shadow-lg backdrop-blur-xl transition-colors hover:border-primary/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="bg-linear-to-br from-foreground to-foreground/50 bg-clip-text font-bold text-3xl text-transparent">
                      {stat.value}
                    </p>
                    <p className="font-medium text-muted-foreground text-sm">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {/* Error Handling */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12 flex items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 backdrop-blur-sm"
          >
            <AlertCircle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive text-lg">
                System Error
              </h3>
              <p className="text-destructive/60 text-sm">
                {error instanceof Error
                  ? error.message
                  : "Failed to sync with the academic database."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-destructive/30 px-4 py-2 text-destructive text-sm transition-colors hover:bg-destructive/10"
            >
              Retry Sync
            </button>
          </motion.div>
        )}

        {/* Result Header */}
        <div className="mb-12 flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-bold text-3xl text-foreground tracking-tight">
              Available Courses
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLoading
                ? "Decrypting academic records..."
                : `${courses.length} courses identified in this sector.`}
            </p>
          </div>
          <div className="mx-8 h-px flex-1 bg-linear-to-r from-border to-transparent" />
        </div>

        {/* Loading / Results / Empty Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-32 text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card shadow-xl">
              <Search className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="font-bold text-2xl text-foreground">
              No signals found
            </h3>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground leading-relaxed">
              {searchQuery
                ? `The coordinates "${searchQuery}" yielded no results. Try adjusting your search query.`
                : "This sector appears to be uncharted. Check back soon for new course data."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-8 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
              >
                Clear Sensors
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                key={course.id}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
