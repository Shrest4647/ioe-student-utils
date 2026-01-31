"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export function DailyTaskView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const fetchTodayTasks = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTodayTasks();
    }
  }, [user, fetchTodayTasks]);

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      const endpoint = completed ? "/complete" : "/uncomplete";
      await fetch(`/api/study-tasks/${taskId}${endpoint}`, {
        method: "PATCH",
      });

      // Optimistic update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed } : task,
        ),
      );
      setCompletedCount((prev) => (completed ? prev + 1 : prev - 1));
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
  };

  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;
  const totalEstimatedMinutes = tasks.reduce(
    (sum, task) => sum + task.estimatedMinutes,
    0,
  );

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading today's tasks...
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Section */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today's Progress</span>
              <Badge variant="secondary">
                {completedCount}/{tasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Total Time */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="size-4" />
              <span>
                {totalEstimatedMinutes} minutes total{" "}
                {completedCount > 0 && (
                  <>
                    • {Math.round((completedCount / tasks.length) * 100)}% done
                  </>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No tasks scheduled for today. Enjoy your free time!
              </p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task, index) => {
            const badgeColor =
              taskTypeColors[task.type] || taskTypeColors.default;
            const taskLabel = taskTypeLabels[task.type];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    "transition-all",
                    task.completed && "opacity-60",
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) =>
                          toggleTaskComplete(task.id, checked === true)
                        }
                        className="mt-0.5"
                      />

                      {/* Task Content */}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Task Type Badge */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "gap-1",
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

                          {/* Time Badge */}
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-2.5" />
                            {task.estimatedMinutes}m
                          </Badge>

                          {/* Completed Badge */}
                          {task.completed && (
                            <Badge
                              variant="secondary"
                              className="bg-green-500/10 text-green-700 dark:text-green-400"
                            >
                              <CheckCircle2 className="size-2.5" />
                              Done
                            </Badge>
                          )}
                        </div>

                        {/* Task Title */}
                        <h4
                          className={cn(
                            "font-medium text-sm",
                            task.completed &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {task.title}
                        </h4>

                        {/* Task Description */}
                        {task.description && (
                          <p
                            className={cn(
                              "text-muted-foreground text-xs",
                              task.completed && "line-through",
                            )}
                          >
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
