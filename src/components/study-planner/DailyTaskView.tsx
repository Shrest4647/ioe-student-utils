"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Flame, Trophy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
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

interface TodayTasksResponse {
  tasks: StudyTask[];
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

// Loading skeleton for tasks
function TaskSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card>
        <CardContent className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex items-start gap-3">
            <Skeleton className="mt-0.5 size-5 flex-shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full max-w-[200px]" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DailyTaskView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [streak] = useState(3); // Mock streak - would come from API
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(
    null,
  );

  const fetchTodayTasks = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/study-plans/today?userId=${user.id}`);

      if (response.ok) {
        const data: TodayTasksResponse = await response.json();
        setTasks(data.tasks || []);

        // Calculate completed count
        const completed = (data.tasks || []).filter(
          (task) => task.completed,
        ).length;
        setCompletedCount(completed);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to load today's tasks. Please try again.",
        );
      }
    } catch (err) {
      console.error("Error fetching today's tasks:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchTodayTasks();
    }
  }, [user, fetchTodayTasks]);

  const toggleTaskComplete = useCallback(
    async (taskId: string, completed: boolean) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed } : task,
        ),
      );
      setCompletedCount((prev) => (completed ? prev + 1 : prev - 1));

      // Show celebration animation
      if (completed) {
        setCelebratingTaskId(taskId);
        setTimeout(() => setCelebratingTaskId(null), 600);
      }

      try {
        const endpoint = completed ? "/complete" : "/uncomplete";
        const response = await fetch(`/api/study-tasks/${taskId}${endpoint}`, {
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }
      } catch (error) {
        console.error("Error updating task:", error);
        // Revert on error
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, completed: !completed } : task,
          ),
        );
        setCompletedCount((prev) => (completed ? prev - 1 : prev + 1));
      }
    },
    [],
  );

  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const totalEstimatedMinutes = tasks.reduce(
    (sum, task) => sum + task.estimatedMinutes,
    0,
  );

  if (loading) {
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
            <p className="text-destructive text-sm sm:text-base">{error}</p>
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
            <Card>
              <CardHeader className="px-3 pb-3 sm:px-6 sm:pb-4">
                <CardTitle className="flex flex-col gap-2 text-base sm:flex-row sm:items-center sm:justify-between sm:text-lg">
                  <span>Today's Progress</span>
                  <div className="flex items-center gap-2">
                    {completedCount === tasks.length && tasks.length > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                      >
                        <Trophy className="size-5 text-yellow-500" />
                      </motion.div>
                    )}
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      <motion.span
                        key={completedCount}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {completedCount}/{tasks.length}
                      </motion.span>
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-3 sm:space-y-4 sm:px-6">
                {/* Progress Bar */}
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary sm:h-3">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
                    variants={progressBarVariants}
                    initial="hidden"
                    animate="visible"
                    custom={progressPercentage}
                  />
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </div>

                {/* Stats Row */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <motion.div
                    className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Clock className="size-3.5 flex-shrink-0 sm:size-4" />
                    <span>
                      {totalEstimatedMinutes} minutes total{" "}
                      {completedCount > 0 && (
                        <>
                          • {Math.round((completedCount / tasks.length) * 100)}%
                          done
                        </>
                      )}
                    </span>
                  </motion.div>

                  {/* Streak Counter */}
                  <StreakCounter streak={streak} />
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
                        "relative overflow-hidden transition-all duration-300",
                        task.completed && "opacity-60",
                        "hover:shadow-md",
                      )}
                    >
                      <CompletionCelebration show={isCelebrating} />

                      {/* Completion indicator line */}
                      <motion.div
                        className="absolute top-0 bottom-0 left-0 w-1 bg-primary"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: task.completed ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ originY: 0 }}
                      />

                      <CardContent className="px-3 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-start gap-3">
                          {/* Checkbox with animation */}
                          <motion.div
                            variants={checkVariants}
                            animate={task.completed ? "checked" : "unchecked"}
                            className="relative mt-0.5 flex-shrink-0"
                          >
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={(checked) =>
                                toggleTaskComplete(task.id, checked === true)
                              }
                              className={cn(
                                "size-5 transition-all duration-300 sm:size-4",
                                task.completed &&
                                  "border-primary bg-primary text-primary-foreground",
                              )}
                            />
                          </motion.div>

                          {/* Task Content */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              {/* Task Type Badge */}
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "gap-1 py-0.5 text-xs transition-all duration-300 sm:py-1 sm:text-xs",
                                    !task.completed && badgeColor,
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      !task.completed && "bg-current",
                                    )}
                                  />
                                  {taskLabel}
                                </Badge>
                              </motion.div>

                              {/* Time Badge */}
                              <Badge
                                variant="outline"
                                className="gap-1 py-0.5 text-xs sm:py-1"
                              >
                                <Clock className="size-2.5" />
                                {task.estimatedMinutes}m
                              </Badge>

                              {/* Completed Badge */}
                              <AnimatePresence>
                                {task.completed && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-500/10 py-0.5 text-green-700 text-xs sm:py-1 dark:text-green-400"
                                    >
                                      <CheckCircle2 className="mr-1 size-2.5" />
                                      Done
                                    </Badge>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Task Title */}
                            <motion.h4
                              className={cn(
                                "font-medium text-sm transition-all duration-300 sm:text-base",
                                task.completed &&
                                  "text-muted-foreground line-through",
                              )}
                              animate={{
                                x: task.completed ? 4 : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              {task.title}
                            </motion.h4>

                            {/* Task Description */}
                            {task.description && (
                              <motion.p
                                className={cn(
                                  "text-muted-foreground text-xs transition-all duration-300 sm:text-sm",
                                  task.completed && "line-through",
                                )}
                                animate={{
                                  opacity: task.completed ? 0.6 : 1,
                                }}
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
                  <Trophy className="size-8 flex-shrink-0 text-yellow-500 sm:size-8" />
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
