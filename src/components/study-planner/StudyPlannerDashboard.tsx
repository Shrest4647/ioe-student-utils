"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BookOpen, ListTodo, Plus, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";
import { cn } from "@/lib/utils";
import { DailyTaskView } from "./DailyTaskView";
import { StudyPlanCreator } from "./StudyPlanCreator";

interface StudyPlan {
  id: string;
  subjectName: string;
  slug: string;
  examDate: string;
  progressPercentage: string;
  status: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
};

const progressBarVariants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

// Stats card component with enhanced aesthetics
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delay,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  delay: number;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
        <div className="absolute top-0 right-0 h-24 w-24 translate-x-12 -translate-y-12 rounded-full bg-primary/5 blur-3xl" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {title}
          </CardTitle>
          <div className="rounded-xl bg-primary/10 p-2 transition-colors duration-300 group-hover:bg-primary/20">
            <Icon className="size-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <motion.div
              className="font-bold text-3xl tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.2, duration: 0.3 }}
            >
              {value}
            </motion.div>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center font-medium text-xs",
                  trend.positive ? "text-emerald-500" : "text-rose-500",
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          <p className="mt-1 text-muted-foreground text-xs">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading skeleton for stats cards rewritten for glassmorphism
function StatsCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-3 w-20 bg-muted/50" />
          <Skeleton className="size-8 rounded-xl bg-muted/50" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-9 w-24 bg-muted/50" />
          <Skeleton className="h-3 w-32 bg-muted/50" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading skeleton for plan cards
function PlanCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StudyPlannerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [showCreator, setShowCreator] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);

  const {
    data: plans,
    isLoading: loading,
    error: queryError,
    refetch: fetchPlans,
  } = useQuery({
    queryKey: ["study-plans"],
    queryFn: async () => {
      const { data, error } = await apiClient.api["study-plans"].get();
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : "Failed to load study plans",
        );
      }
      return (data?.data as StudyPlan[]) ?? [];
    },
    enabled: !!user,
  });

  const error = queryError
    ? queryError.message || "Failed to load study plans. Please try again."
    : null;

  // Calculate stats
  const activePlansCount =
    plans?.filter((p) => p.status === "active").length ?? 0;

  const todaysTasksCount =
    plans?.reduce((sum, plan) => {
      const progress = parseFloat(plan.progressPercentage || "0");
      return sum + Math.floor(progress / 10);
    }, 0) ?? 0;

  const overallProgress =
    plans && plans.length > 0
      ? Math.round(
          plans.reduce(
            (sum, plan) => sum + parseFloat(plan.progressPercentage || "0"),
            0,
          ) / plans.length,
        )
      : 0;

  // Show creator with animation
  if (showCreator) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            onClick={() => setShowCreator(false)}
            className="mb-4 h-11 px-4 text-sm sm:h-10 sm:px-3"
          >
            ← Back to Dashboard
          </Button>
        </motion.div>
        <StudyPlanCreator
          onSuccess={() => {
            setShowCreator(false);
            fetchPlans();
          }}
        />
      </motion.div>
    );
  }

  // Loading state with enhanced skeletons
  if (loading) {
    return (
      <motion.div
        className="mx-auto max-w-7xl space-y-8 px-4 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48 bg-muted/50" />
            <Skeleton className="h-5 w-64 bg-muted/50" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl bg-primary/20 sm:h-12 sm:w-40" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCardSkeleton delay={0} />
          <StatsCardSkeleton delay={0.1} />
          <StatsCardSkeleton delay={0.2} />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-8 w-40 bg-muted/50" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PlanCardSkeleton delay={0.3} />
            <PlanCardSkeleton delay={0.4} />
            <PlanCardSkeleton delay={0.5} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative min-h-screen bg-linear-to-b from-background via-background/95 to-background/90 text-foreground antialiased transition-colors duration-500">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] h-[40%] w-[40%] animate-pulse rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] h-[35%] w-[35%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <motion.div
        className="relative mx-auto max-w-350 space-y-12 px-4 py-12 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8"
          >
            <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center gap-4 px-4 py-8 text-center sm:px-6">
                <div className="rounded-full bg-destructive/10 p-3">
                  <TrendingUp className="size-6 rotate-180 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-destructive text-lg">
                    Connection Error
                  </h3>
                  <p className="mt-1 max-w-md text-muted-foreground text-sm">
                    {error}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => fetchPlans()}
                    variant="destructive"
                    className="h-10 px-8"
                  >
                    Reconnect
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Modern Glass Header Section */}
        <motion.div
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          variants={itemVariants}
        >
          <div className="space-y-2">
            <h1 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text font-extrabold text-4xl text-transparent tracking-tight sm:text-5xl lg:text-6xl">
              Study <span className="text-primary">Planner</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground/80 leading-relaxed sm:text-xl">
              Your personal assistant for exam preparation mastery
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0"
          >
            <Button
              onClick={() => setShowCreator(true)}
              className="group relative h-12 overflow-hidden rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-[0_8px_20px_-6px_rgba(var(--primary),0.3)] transition-all duration-300 hover:shadow-[0_12px_24px_-4px_rgba(var(--primary),0.4)]"
            >
              <div className="absolute inset-0 bg-linear-to-r from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="mr-2 size-5 transition-transform group-hover:rotate-90" />
              New Study Plan
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Active Journey"
            value={activePlansCount}
            subtitle={`${activePlansCount === 1 ? "plan" : "plans"} in progress`}
            icon={BookOpen}
            delay={0}
            trend={{ value: "+12%", positive: true }}
          />
          <StatsCard
            title="Tasks Today"
            value={todaysTasksCount}
            subtitle="items for review"
            icon={ListTodo}
            delay={0.1}
          />
          <StatsCard
            title="Prep Mastery"
            value={`${overallProgress}%`}
            subtitle="average completion"
            icon={TrendingUp}
            delay={0.2}
            trend={{ value: "+5%", positive: true }}
          />
        </div>

        {/* Study Plans Section */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex items-center justify-between border-border/10 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <BookOpen className="size-6 text-primary" />
              </div>
              <h2 className="font-bold text-2xl tracking-tight">
                Active Journeys
              </h2>
            </div>
            {plans && plans.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="group text-primary hover:bg-primary/5"
                onClick={() => setShowAllPlans(!showAllPlans)}
              >
                {showAllPlans ? "Show Active" : "View All"}
                <span className="ml-1 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Button>
            )}
          </div>

          {!plans || plans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="relative overflow-hidden border-border/40 border-dashed bg-card/40 backdrop-blur-md">
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
                <CardContent className="relative flex flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-32">
                  <div className="group relative mb-8">
                    <div className="absolute inset-0 scale-150 animate-pulse bg-primary/20 blur-3xl transition-all group-hover:bg-primary/30" />
                    <div className="relative rounded-3xl bg-secondary/80 p-6 shadow-2xl ring-1 ring-border/50 backdrop-blur-xl">
                      <BookOpen className="size-16 text-primary/60" />
                    </div>
                  </div>
                  <h3 className="font-bold text-2xl tracking-tight sm:text-3xl">
                    Begin Your Success Story
                  </h3>
                  <p className="mt-4 mb-10 max-w-md text-lg text-muted-foreground/80 leading-relaxed">
                    No active study plans yet. Design a roadmap tailored to your
                    exams and start mastering your curriculum today.
                  </p>
                  <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => setShowCreator(true)}
                      className="h-14 rounded-2xl bg-primary px-10 font-bold text-lg shadow-[0_8px_20px_-6px_rgba(var(--primary),0.3)] transition-all hover:shadow-[0_12px_24px_-4px_rgba(var(--primary),0.4)]"
                    >
                      <Plus className="mr-2 size-6" />
                      Create Your First Journey
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {plans
                ?.filter((p) => showAllPlans || p.status === "active")
                .map((plan, index) => {
                  const progress = parseFloat(plan.progressPercentage || "0");
                  return (
                    <motion.div
                      key={plan.id}
                      variants={itemVariants}
                      initial="rest"
                      whileHover="hover"
                      animate="visible"
                      custom={index}
                      onClick={() =>
                        router.push(`/dashboard/study-plans/${plan.slug}`)
                      }
                      className="cursor-pointer"
                    >
                      <motion.div variants={cardHoverVariants}>
                        <Card className="group relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10">
                          <div className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5 blur-2xl" />
                          <CardHeader className="pb-4">
                            <CardTitle className="font-bold text-foreground text-lg tracking-tight transition-colors group-hover:text-primary sm:text-xl">
                              {plan.subjectName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between font-bold text-muted-foreground/80 text-xs uppercase tracking-wider">
                                <span>Mastery Progress</span>
                                <motion.span
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.5 + index * 0.1 }}
                                  className="text-primary"
                                >
                                  {Math.round(progress)}%
                                </motion.span>
                              </div>
                              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary ring-1 ring-border/50">
                                <motion.div
                                  className="h-full rounded-full bg-linear-to-r from-primary to-primary/80 shadow-[0_0_12px_-2px_rgba(var(--primary),0.4)]"
                                  variants={progressBarVariants}
                                  initial="hidden"
                                  animate="visible"
                                  custom={progress}
                                />
                                <motion.div
                                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-muted-foreground/60 text-xs uppercase tracking-tight">
                                  Exam Date
                                </span>
                                <span className="font-semibold text-sm">
                                  {new Date(plan.examDate).toLocaleDateString(
                                    undefined,
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  progress >= 80 ? "default" : "secondary"
                                }
                                className={cn(
                                  "rounded-lg px-3 py-1 font-bold text-xs transition-all duration-300",
                                  progress >= 80
                                    ? "bg-emerald-500 hover:bg-emerald-600"
                                    : "bg-primary/10 text-primary hover:bg-primary/20",
                                )}
                              >
                                {progress >= 80 ? "On Track" : "In Progress"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </motion.div>
                  );
                })}
            </motion.div>
          )}
        </motion.div>

        {/* Today's Tasks Section */}
        <motion.div variants={itemVariants} className="space-y-8">
          <div className="flex items-center justify-between border-border/10 border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <ListTodo className="size-6 text-primary" />
              </div>
              <h2 className="font-bold text-2xl tracking-tight">
                Target for Today
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="h-7 border-emerald-500/20 bg-emerald-500/5 px-3 font-semibold text-emerald-600 dark:text-emerald-400"
              >
                <div className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Focus Mode: ACTIVE
              </Badge>
            </div>
          </div>
          <div className="rounded-3xl border-border/40 bg-card/40 p-1.5 shadow-2xl ring-1 ring-border/20 backdrop-blur-md">
            <DailyTaskView />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
