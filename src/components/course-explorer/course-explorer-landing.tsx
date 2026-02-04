"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  GraduationCap,
  Layers,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { CourseCard } from "./course-card";
import { CourseCardSkeleton } from "./course-card-skeleton";
import { FilterChips } from "./filter-chips";
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
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          initial={{
            opacity: Math.random() * 0.5 + 0.1,
            scale: Math.random() * 0.5 + 0.5,
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
          }}
          animate={{
            opacity: [0.1, 0.8, 0.1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: Math.random() * 2 + 1 + "px",
            height: Math.random() * 2 + 1 + "px",
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
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-slate-100">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden border-b border-slate-800/50">
        <StarField />
        
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -right-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 blur-[120px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
              x: [0, -60, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-[10%] -left-[5%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-600/30 blur-[120px]" 
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
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 mb-8 backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-300">New: Interactive Mindmaps</span>
            </div>
            
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl mb-6">
              <span className="bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
                Navigate Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent animate-gradient-x">
                Academic Universe
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-slate-400 sm:text-xl mb-12 leading-relaxed">
              Explore your degree like never before. From prerequisite maps to exam focus paths,
              discover the connections that define your learning.
            </p>

            {/* Futuristic Search Bar */}
            <div className="relative mx-auto max-w-3xl">
              <div className="group relative flex items-center">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-purple-500 opacity-20 blur transition duration-500 group-focus-within:opacity-50"></div>
                <div className="relative flex w-full items-center rounded-full bg-slate-900/80 p-1 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
                  <div className="pl-6 pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by course name, code, or topic..."
                    className="h-14 w-full bg-transparent pr-12 pl-4 text-slate-100 placeholder:text-slate-500 focus:outline-none sm:text-lg"
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
                      className="mr-6 text-slate-500 hover:text-white transition-colors"
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

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="h-10 w-6 rounded-full border-2 border-slate-700 flex justify-center p-1">
            <div className="h-2 w-1.5 rounded-full bg-slate-500" />
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      {stats && !isLoading && (
        <section className="relative z-20 -mt-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "indigo" },
              { label: "Course Units", value: stats.totalUnits, icon: Layers, color: "cyan" },
              { label: "Core Courses", value: stats.coreCourses, icon: GraduationCap, color: "purple" },
            ].map((stat, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={stat.label}
                className="group relative"
              >
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-10 blur group-hover:opacity-30 transition duration-300"></div>
                <div className="relative flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-lg hover:border-slate-700 transition-colors">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl",
                    stat.color === "indigo" ? "bg-indigo-500/10 text-indigo-400" :
                    stat.color === "cyan" ? "bg-cyan-500/10 text-cyan-400" :
                    "bg-purple-500/10 text-purple-400"
                  )}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
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
            className="mb-12 flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-sm"
          >
            <AlertCircle className="h-6 w-6 text-red-500" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-red-400">System Error</h3>
              <p className="text-red-300/60 text-sm">
                {error instanceof Error ? error.message : "Failed to sync with the galactic database."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Retry Sync
            </button>
          </motion.div>
        )}

        {/* Result Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Available Courses</h2>
            <p className="text-slate-500 text-sm">
              {isLoading
                ? "Decrypting galactic records..."
                : `${courses.length} courses identified in this sector.`}
            </p>
          </div>
          <div className="h-px flex-1 mx-8 bg-gradient-to-r from-slate-800 to-transparent"></div>
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
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 mb-6 shadow-2xl">
              <Search className="h-10 w-10 text-slate-700" />
            </div>
            <h3 className="text-2xl font-bold text-slate-300">No signals found</h3>
            <p className="mx-auto mt-3 max-w-md text-slate-500">
              {searchQuery
                ? `The coordinates "${searchQuery}" yielded no results. Try adjusting your sensor frequency.`
                : "This sector appears to be uncharted. Check back soon for new mission data."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-8 rounded-full bg-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
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
