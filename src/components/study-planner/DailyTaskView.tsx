"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";
import { cn } from "@/lib/utils";

interface StudyTask {
  id: string;
  title: string;
  description: string;
  type: "learn" | "practice" | "review" | "prepare";
  estimatedMinutes: number;
  completed: boolean;
  date: string;
}

const taskTypeColors = {
  learn: "bg-blue-500",
  practice: "bg-orange-500",
  review: "bg-purple-500",
  prepare: "bg-green-500",
  default: "bg-gray-500",
};

const taskTypeLabels = {
  learn: "Learn",
  practice: "Practice",
  review: "Review",
  prepare: "Prepare",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
    },
  },
};

const progressBarVariants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const checkVariants = {
  unchecked: { scale: 1 },
  checked: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const,
    },
  },
};

const streakVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.3, 1],
    rotate: [0, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut" as const,
    },
  },
};

// Streak counter component with animation
function StreakCounter({
  streak,
  className,
}: {
  streak: number;
  className?: string;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (streak > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  return (
    <motion.div
      className={cn(
        "flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1.5 text-orange-600 sm:px-3 dark:text-orange-400",
        className,
      )}
      variants={streakVariants}
      initial="initial"
      animate={isAnimating ? "animate" : "initial"}
    >
      <Flame className="size-4" />
      <span className="font-semibold text-xs sm:text-sm">
        {streak} day streak
      </span>
    </motion.div>
  );
}

// Task completion celebration
function CompletionCelebration({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute size-2 rounded-full bg-primary"
              initial={{
                opacity: 1,
                scale: 0,
                x: 0,
                y: 0,
              }}
              animate={{
                opacity: 0,
                scale: 1.5,
                x: Math.cos((i * 60 * Math.PI) / 180) * 40,
                y: Math.sin((i * 60 * Math.PI) / 180) * 40,
              }}
              transition={{
                duration: 0.6,
                delay: i * 0.05,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Loading skeleton for tasks rewritten for glassmorphism
function TaskSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="px-4 py-4 sm:px-6">
          <div className="flex items-start gap-4">
            <Skeleton className="mt-1 size-5 shrink-0 rounded-md bg-muted/50" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full bg-muted/40" />
                <Skeleton className="h-5 w-14 rounded-full bg-muted/40" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md bg-muted/60" />
              <Skeleton className="h-4 w-1/2 rounded-md bg-muted/40" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DailyTaskView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(
    null,
  );

  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["today-tasks", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error: apiError } = await apiClient.api[
        "study-plans"
      ].today.get({
        query: { userId: user.id },
      });

      if (apiError || !data?.success) {
        throw new Error(
          (apiError?.value as any)?.error ||
            data?.error ||
            "Failed to load today's tasks",
        );
      }

      // Transform the response data to match the StudyTask interface
      const rawData = data.data || [];
      return rawData.map((item: any) => ({
        id: item.task.id,
        title: item.task.title,
        description: item.task.description,
        type: (item.task.taskType as any) || "learn",
        estimatedMinutes: item.task.estimatedMinutes,
        completed: item.task.completed ?? false,
        date: new Date().toISOString(),
      })) as StudyTask[];
    },
    enabled: !!user?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      taskId,
      completed,
    }: {
      taskId: string;
      completed: boolean;
    }) => {
      const endpoint = completed ? "complete" : "uncomplete";
      const { error } = await (apiClient.api["study-tasks"] as any)({
        id: taskId,
      })[endpoint].patch();

      if (error) {
        throw new Error("Failed to update task");
      }
    },
    onMutate: async ({ taskId, completed }) => {
      // Show celebration animation
      if (completed) {
        setCelebratingTaskId(taskId);
        setTimeout(() => setCelebratingTaskId(null), 600);
      }

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<StudyTask[]>([
        "today-tasks",
        user?.id,
      ]);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<StudyTask[]>(
          ["today-tasks", user?.id],
          previousTasks.map((task) =>
            task.id === taskId ? { ...task, completed } : task,
          ),
        );
      }

      return { previousTasks };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ["today-tasks", user?.id],
          context.previousTasks,
        );
      }
      console.error("Error updating task:", err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["today-tasks", user?.id] });
    },
  });

  const toggleTaskComplete = (taskId: string, completed: boolean) => {
    toggleMutation.mutate({ taskId, completed });
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const streak = 3; // Mock streak - would come from API

  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const totalEstimatedMinutes = tasks.reduce(
    (sum, task) => sum + task.estimatedMinutes,
    0,
  );

  if (isLoading) {
    return (
      <motion.div
        className="space-y-2 sm:space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <TaskSkeleton delay={0} />
        <TaskSkeleton delay={0.1} />
        <TaskSkeleton delay={0.2} />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="px-4 py-6 text-center sm:py-8">
            <p className="text-destructive text-sm sm:text-base">
              {error instanceof Error ? error.message : "Failed to load tasks"}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Progress Section */}
      <AnimatePresence>
        {tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-md">
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full bg-primary/10 blur-3xl" />
              <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
                <CardTitle className="flex flex-col gap-3 font-bold text-lg sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Power Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {completedCount === tasks.length && tasks.length > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="rounded-full bg-yellow-500/20 p-1"
                      >
                        <Trophy className="size-5 text-yellow-500" />
                      </motion.div>
                    )}
                    <Badge
                      variant="secondary"
                      className="rounded-lg bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20"
                    >
                      <motion.span
                        key={completedCount}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold"
                      >
                        {completedCount}/{tasks.length}
                      </motion.span>
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 sm:px-6">
                {/* Enhanced Progress Bar */}
                <div className="group relative h-3 w-full overflow-hidden rounded-full bg-secondary ring-1 ring-border/50">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-primary via-primary/80 to-primary/90 shadow-[0_0_15px_-3px_rgba(var(--primary),0.5)]"
                    variants={progressBarVariants}
                    initial="hidden"
                    animate="visible"
                    custom={progressPercentage}
                  />
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <motion.div
                    className="flex items-center gap-3 text-muted-foreground text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="rounded-md bg-muted/50 p-1.5">
                      <Clock className="size-4 shrink-0" />
                    </div>
                    <span className="font-medium">
                      {totalEstimatedMinutes} mins total{" "}
                      {completedCount > 0 && (
                        <span className="ml-1 font-bold text-primary italic">
                          ({Math.round((completedCount / tasks.length) * 100)}%
                          complete)
                        </span>
                      )}
                    </span>
                  </motion.div>

                  {/* Streak Counter */}
                  <div className="group relative ring-offset-background transition-transform hover:scale-105 active:scale-95">
                    <StreakCounter streak={streak} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tasks List */}
      <motion.div
        className="space-y-2 sm:space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <CardContent className="px-4 py-6 text-center sm:py-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.5 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="mx-auto size-10 text-muted-foreground sm:size-12" />
                  </motion.div>
                  <p className="mt-4 text-muted-foreground text-sm sm:text-base">
                    No tasks scheduled for today. Enjoy your free time!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            tasks.map((task, index) => {
              const badgeColor =
                taskTypeColors[task.type] || taskTypeColors.default;
              const taskLabel = taskTypeLabels[task.type];
              const isCelebrating = celebratingTaskId === task.id;

              return (
                <motion.div
                  key={task.id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, x: -100 }}
                  custom={index}
                >
                  <motion.div
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      className={cn(
                        "group relative overflow-hidden transition-all duration-300",
                        "border-border/40 bg-card/40 backdrop-blur-sm",
                        task.completed && "opacity-60",
                        "hover:border-primary/40 hover:bg-card/60 hover:shadow-primary/5 hover:shadow-xl",
                      )}
                    >
                      <CompletionCelebration show={isCelebrating} />

                      {/* Side Accents */}
                      <div
                        className={cn(
                          "absolute top-0 bottom-0 left-0 w-1.5 transition-colors",
                          !task.completed ? badgeColor : "bg-muted",
                        )}
                      />

                      <CardContent className="px-4 py-4 sm:px-6">
                        <div className="flex items-start gap-4">
                          {/* Modern Checkbox Control */}
                          <motion.div
                            variants={checkVariants}
                            animate={task.completed ? "checked" : "unchecked"}
                            className="relative mt-1 shrink-0"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) =>
                                toggleTaskComplete(task.id, checked === true)
                              }
                              className={cn(
                                "size-6 rounded-lg border-2 transition-all duration-300",
                                task.completed
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/30 ring-offset-background hover:border-primary/50",
                              )}
                            />
                          </motion.div>

                          {/* Task Content */}
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Task Type Badge */}
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge
                                  className={cn(
                                    "rounded-md border-none px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider",
                                    !task.completed
                                      ? `${badgeColor} text-white`
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {taskLabel}
                                </Badge>
                              </motion.div>

                              {/* Time Badge */}
                              <Badge
                                variant="outline"
                                className="h-5 gap-1 border-border/50 bg-background/50 font-medium text-[10px]"
                              >
                                <Clock className="size-2.5" />
                                {task.estimatedMinutes}m
                              </Badge>

                              {/* Completed Status */}
                              <AnimatePresence>
                                {task.completed && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="h-5 border-emerald-500/30 bg-emerald-500/10 font-bold text-[10px] text-emerald-600 dark:text-emerald-400"
                                    >
                                      Done
                                    </Badge>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Task Title */}
                            <motion.h4
                              className={cn(
                                "font-bold text-base tracking-tight transition-all duration-300",
                                task.completed
                                  ? "text-muted-foreground italic"
                                  : "text-foreground ring-offset-background",
                              )}
                              animate={{
                                x: task.completed ? 8 : 0,
                              }}
                            >
                              {task.title}
                            </motion.h4>

                            {/* Task Description */}
                            {task.description && (
                              <motion.p
                                className={cn(
                                  "text-sm leading-relaxed transition-all duration-300",
                                  task.completed
                                    ? "text-muted-foreground/50 line-through"
                                    : "text-muted-foreground",
                                )}
                              >
                                {task.description}
                              </motion.p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* Completion Message */}
      <AnimatePresence>
        {completedCount === tasks.length && tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="flex flex-col items-center gap-3 px-3 py-4 sm:flex-row sm:px-6">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                >
                  <Trophy className="size-8 shrink-0 text-yellow-500 sm:size-8" />
                </motion.div>
                <div className="text-center sm:text-left">
                  <motion.h4
                    className="font-semibold text-green-700 text-sm sm:text-base dark:text-green-400"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    All tasks completed!
                  </motion.h4>
                  <motion.p
                    className="text-green-600/80 text-xs sm:text-sm dark:text-green-400/80"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Great job! You're on fire with your {streak} day streak!
                  </motion.p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
