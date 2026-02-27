"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Play,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";
import { cn } from "@/lib/utils";

interface StudyTask {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  taskType: string;
  estimatedMinutes: number | null;
  completed: boolean | null;
  completedAt: Date | null;
  actualMinutesSpent: number | null;
  notes: string | null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

function TaskCardSkeleton() {
  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4 bg-muted/50" />
            <Skeleton className="h-4 w-full bg-muted/50" />
            <Skeleton className="h-4 w-2/3 bg-muted/50" />
          </div>
          <Skeleton className="size-10 shrink-0 rounded-full bg-muted/50" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudyPlanDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();

  const {
    data: plan,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["study-plan-detail", slug],
    queryFn: async () => {
      const { data, error } = await apiClient.api["study-plans"]
        .slug({
          slug,
        })
        .get();
      if (error) {
        throw new Error(
          typeof error.value === "string"
            ? error.value
            : "Failed to load study plan",
        );
      }
      return data?.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full bg-muted/50" />
          <Skeleton className="h-10 w-48 bg-muted/50" />
        </div>
        <Skeleton className="h-32 w-full rounded-3xl bg-muted/50" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center gap-4 px-4 py-12 text-center sm:px-6">
            <div className="rounded-full bg-destructive/10 p-3">
              <TrendingUp className="size-6 rotate-180 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold text-destructive text-lg">
                Study Plan Not Found
              </h3>
              <p className="mt-1 max-w-md text-muted-foreground text-sm">
                {error?.message ||
                  "This study plan doesn't exist or you don't have access to it."}
              </p>
            </div>
            <Button
              onClick={() => router.push("/study-planner")}
              variant="destructive"
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Planner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = parseFloat(plan.progressPercentage || "0");
  const totalTasks = plan.tasks?.length || 0;
  const completedTasks = plan.tasks?.filter((t) => t.completed).length || 0;

  // Group tasks by day number
  const tasksByDay: Record<number, StudyTask[]> = {};
  plan.tasks?.forEach((task) => {
    if (!tasksByDay[task.dayNumber]) {
      tasksByDay[task.dayNumber] = [];
    }
    tasksByDay[task.dayNumber].push(task);
  });

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "learn":
        return <Play className="size-4" />;
      case "practice":
        return <CheckCircle2 className="size-4" />;
      case "review":
        return <TrendingUp className="size-4" />;
      default:
        return <ListTodo className="size-4" />;
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case "learn":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "practice":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "review":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-muted-foreground bg-muted/10 border-border/20";
    }
  };

  return (
    <motion.div
      className="container mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <motion.div whileHover={{ x: -4 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/study-planner")}
            className="rounded-full"
          >
            <ArrowLeft className="size-5" />
          </Button>
        </motion.div>
        <div className="flex-1">
          <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">
            {plan.subjectName}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Your personalized study journey
          </p>
        </div>
        <Badge
          variant={progress >= 80 ? "default" : "secondary"}
          className={cn(
            "rounded-lg px-4 py-2 font-semibold text-sm transition-all duration-300",
            progress >= 80
              ? "bg-emerald-500 hover:bg-emerald-600"
              : "bg-primary/10 text-primary hover:bg-primary/20",
          )}
        >
          {progress >= 80 ? "On Track" : "In Progress"}
        </Badge>
      </motion.div>

      {/* Overview Card */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-border/40 bg-card/50 backdrop-blur-md">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full bg-primary/5 blur-3xl" />
          <CardHeader className="pb-4">
            <CardTitle className="font-semibold text-lg">
              Plan Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-bold text-muted-foreground/80 text-xs uppercase tracking-wider">
                <span>Overall Progress</span>
                <span className="text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary ring-1 ring-border/50">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-primary to-primary/80 shadow-[0_0_12px_-2px_rgba(var(--primary),0.4)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
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

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Calendar className="size-3" />
                  <span>Start Date</span>
                </div>
                <p className="font-semibold text-sm">
                  {new Date(plan.startDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <TrendingUp className="size-3" />
                  <span>Exam Date</span>
                </div>
                <p className="font-semibold text-sm">
                  {new Date(plan.examDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <ListTodo className="size-3" />
                  <span>Total Tasks</span>
                </div>
                <p className="font-semibold text-sm">{totalTasks}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CheckCircle2 className="size-3" />
                  <span>Completed</span>
                </div>
                <p className="font-semibold text-sm">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tasks by Day */}
      <motion.div variants={itemVariants} className="space-y-6">
        <h2 className="font-bold text-2xl tracking-tight">Daily Tasks</h2>
        <div className="space-y-4">
          {Object.entries(tasksByDay)
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
            .map(([dayNumber, tasks]) => (
              <motion.div
                key={dayNumber}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: parseInt(dayNumber, 10) * 0.05 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Calendar className="size-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Day {dayNumber}</h3>
                    <p className="text-muted-foreground text-xs">
                      {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pl-14">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card
                        className={cn(
                          "group border-border/40 bg-card/50 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-lg",
                          task.completed && "opacity-60",
                        )}
                      >
                        <CardContent className="flex items-start gap-4 p-4">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                              getTaskTypeColor(task.taskType),
                            )}
                          >
                            {getTaskIcon(task.taskType)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-sm sm:text-base">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-muted-foreground text-xs sm:text-sm">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-muted-foreground text-xs">
                              {task.estimatedMinutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {task.estimatedMinutes} min
                                </span>
                              )}
                              {task.actualMinutesSpent && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="size-3" />
                                  {task.actualMinutesSpent} min spent
                                </span>
                              )}
                            </div>
                          </div>
                          {task.completed && (
                            <CheckCircle2 className="size-5 text-emerald-500" />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
