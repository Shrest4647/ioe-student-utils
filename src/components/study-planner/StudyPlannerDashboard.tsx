"use client";

import { motion } from "framer-motion";
import { BookOpen, ListTodo, Plus, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { DailyTaskView } from "./DailyTaskView";
import { StudyPlanCreator } from "./StudyPlanCreator";

interface StudyPlan {
  id: string;
  subjectName: string;
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

// Stats card component with animation
function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  delay,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="group cursor-default transition-shadow duration-300 hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="font-medium text-sm">{title}</CardTitle>
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="size-4 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            className="font-bold text-2xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
          >
            {value}
          </motion.div>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading skeleton for stats cards
function StatsCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mb-2 h-8 w-16" />
          <Skeleton className="h-3 w-32" />
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
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/study-plans?userId=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        setError("Failed to load study plans. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching study plans:", err);
      setError("Failed to load study plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user, fetchPlans]);

  // Calculate stats
  const activePlansCount = plans.filter((p) => p.status === "active").length;

  const todaysTasksCount = plans.reduce((sum, plan) => {
    const progress = parseFloat(plan.progressPercentage || "0");
    return sum + Math.floor(progress / 10);
  }, 0);

  const overallProgress =
    plans.length > 0
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

  // Loading state with skeletons
  if (loading) {
    return (
      <motion.div
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="mb-2 h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-11 w-full sm:h-10 sm:w-32" />
        </div>

        {/* Stats Skeletons */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <StatsCardSkeleton delay={0} />
          <StatsCardSkeleton delay={0.1} />
          <StatsCardSkeleton delay={0.2} />
        </div>

        {/* Plans Section Skeleton */}
        <div>
          <Skeleton className="mb-4 h-7 w-40" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <PlanCardSkeleton delay={0.3} />
            <PlanCardSkeleton delay={0.4} />
            <PlanCardSkeleton delay={0.5} />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <Card className="border-destructive">
            <CardContent className="px-4 py-6 text-center sm:px-6 sm:py-8">
              <p className="mb-4 text-destructive text-sm sm:text-base">
                {error}
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={fetchPlans}
                  variant="outline"
                  className="h-11 sm:h-10"
                >
                  Try Again
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Header */}
      <motion.div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        variants={itemVariants}
      >
        <div>
          <motion.h1
            className="font-bold text-2xl tracking-tight sm:text-3xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            Study Planner
          </motion.h1>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Track your exam preparation progress
          </motion.p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-full sm:w-auto"
        >
          <Button
            onClick={() => setShowCreator(true)}
            className="h-11 w-full sm:h-10 sm:w-auto"
          >
            <Plus className="mr-2 size-4" />
            Create Plan
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatsCard
          title="Active Plans"
          value={activePlansCount}
          subtitle={`${activePlansCount === 1 ? "plan" : "plans"} in progress`}
          icon={BookOpen}
          delay={0}
        />
        <StatsCard
          title="Today's Tasks"
          value={todaysTasksCount}
          subtitle="tasks scheduled"
          icon={ListTodo}
          delay={0.1}
        />
        <StatsCard
          title="Overall Progress"
          value={`${overallProgress}%`}
          subtitle="average completion"
          icon={TrendingUp}
          delay={0.2}
        />
      </div>

      {/* Study Plans Section */}
      <motion.div variants={itemVariants}>
        <h2 className="mb-3 font-semibold text-lg sm:mb-4 sm:text-xl">
          Active Study Plans
        </h2>
        {plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card>
              <CardContent className="px-4 py-8 text-center sm:px-6 sm:py-12">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.5 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <BookOpen className="mx-auto size-10 text-muted-foreground sm:size-12" />
                </motion.div>
                <h3 className="mt-4 font-semibold text-base sm:text-lg">
                  No study plans yet
                </h3>
                <p className="mb-6 px-2 text-muted-foreground text-sm sm:px-0 sm:text-base">
                  Create your first study plan to start tracking your exam
                  preparation
                </p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setShowCreator(true)}
                    className="h-11 sm:h-10"
                  >
                    <Plus className="mr-2 size-4" />
                    Create Your First Plan
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {plans
              .filter((p) => p.status === "active")
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
                  >
                    <motion.div variants={cardHoverVariants}>
                      <Card className="group cursor-pointer transition-shadow duration-300 hover:shadow-lg">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base transition-colors duration-300 group-hover:text-primary sm:text-lg">
                            {plan.subjectName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                              >
                                {Math.round(progress)}%
                              </motion.span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                variants={progressBarVariants}
                                initial="hidden"
                                animate="visible"
                                custom={progress}
                              />
                            </div>
                            <div className="flex flex-col gap-1 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:text-sm">
                              <span>
                                Exam:{" "}
                                {new Date(plan.examDate).toLocaleDateString()}
                              </span>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge
                                  variant={
                                    progress >= 80 ? "default" : "secondary"
                                  }
                                  className="text-xs transition-all duration-300"
                                >
                                  {progress >= 80 ? "On Track" : "In Progress"}
                                </Badge>
                              </motion.div>
                            </div>
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
      <motion.div
        variants={itemVariants}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="mb-3 font-semibold text-lg sm:mb-4 sm:text-xl">
          Today's Tasks
        </h2>
        <DailyTaskView />
      </motion.div>
    </motion.div>
  );
}
