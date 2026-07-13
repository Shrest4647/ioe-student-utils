"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type {
  StudyPlanGoal,
  StudyPlanSeed,
  StudyPlanSummary,
} from "@/types/study-planner";
import { OfflineNotice } from "./OfflineNotice";
import { StudyPlanCreator } from "./StudyPlanCreator";

interface TodayTaskItem {
  planId: string;
  planSlug: string;
  subjectName: string;
  examDate: string;
  dayNumber: number;
  task: {
    id: string;
    slug: string | null;
    title: string;
    description: string;
    taskType: string;
    estimatedMinutes: number;
    completed: boolean;
    scheduledDate: string;
  };
}

export function StudyPlannerDashboard({
  initialSeed,
}: {
  initialSeed?: StudyPlanSeed;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creatorSeed, setCreatorSeed] = useState<StudyPlanSeed | null>(
    initialSeed ?? null,
  );

  const plansQuery = useQuery({
    queryKey: ["study-plans", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/study-plans");
      if (!response.ok) throw new Error("Could not load study plans");
      const payload = (await response.json()) as {
        success: boolean;
        data: StudyPlanSummary[];
      };
      return payload.data;
    },
    enabled: Boolean(user),
  });

  const todayQuery = useQuery({
    queryKey: ["today-study-tasks", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/study-plans/today");
      if (!response.ok) throw new Error("Could not load today's tasks");
      const payload = (await response.json()) as {
        success: boolean;
        data: TodayTaskItem[];
      };
      return payload.data;
    },
    enabled: Boolean(user),
  });

  const upcomingQuery = useQuery({
    queryKey: ["upcoming-study-tasks", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/study-plans/upcoming");
      if (!response.ok) throw new Error("Could not load upcoming tasks");
      const payload = (await response.json()) as {
        success: boolean;
        data: TodayTaskItem[];
      };
      return payload.data;
    },
    enabled: Boolean(user),
  });

  const completionMutation = useMutation({
    mutationFn: async ({
      item,
      completed,
    }: {
      item: TodayTaskItem;
      completed: boolean;
    }) => {
      const response = item.task.slug
        ? await fetch(
            `/api/study-plans/slug/${encodeURIComponent(item.planSlug)}/tasks/${encodeURIComponent(item.task.slug)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ completed }),
            },
          )
        : await fetch(
            `/api/study-tasks/${encodeURIComponent(item.task.id)}/${completed ? "complete" : "uncomplete"}`,
            { method: "PATCH" },
          );
      if (!response.ok) throw new Error("The task could not be updated");
    },
    onMutate: async ({ item, completed }) => {
      await queryClient.cancelQueries({
        queryKey: ["today-study-tasks", user?.id],
      });
      const previous = queryClient.getQueryData<TodayTaskItem[]>([
        "today-study-tasks",
        user?.id,
      ]);
      queryClient.setQueryData<TodayTaskItem[]>(
        ["today-study-tasks", user?.id],
        (current = []) =>
          current.map((candidate) =>
            candidate.task.id === item.task.id
              ? {
                  ...candidate,
                  task: { ...candidate.task, completed },
                }
              : candidate,
          ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["today-study-tasks", user?.id],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["today-study-tasks", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["upcoming-study-tasks", user?.id],
      });
    },
  });

  if (creatorSeed) {
    return (
      <StudyPlanCreator
        initialCourseSlug={creatorSeed.courseSlug}
        initialTopicSlugs={creatorSeed.topicSlugs}
        initialMode={creatorSeed.mode}
        initialGoal={focusModeToGoal(creatorSeed.focusMode)}
        initialExamDate={creatorSeed.targetDate}
        onCancel={() => {
          setCreatorSeed(null);
          router.replace("/study-planner");
        }}
      />
    );
  }

  const plans = plansQuery.data ?? [];
  const activePlans = plans.filter((plan) => plan.status === "active");
  const todayTasks = todayQuery.data ?? [];
  const upcomingTasks = upcomingQuery.data ?? [];
  const completedToday = todayTasks.filter(
    (item) => item.task.completed,
  ).length;
  const loading =
    plansQuery.isLoading || todayQuery.isLoading || upcomingQuery.isLoading;
  const error = plansQuery.error ?? todayQuery.error ?? upcomingQuery.error;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-medium text-primary text-sm">Study planner</p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight">
            What are you studying today?
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Follow today's tasks, recover missed work, or turn an IOE syllabus
            into a plan that fits your available time.
          </p>
        </div>
        <Button onClick={() => setCreatorSeed({})}>
          <Plus className="size-4" />
          Plan a course
        </Button>
      </header>

      <OfflineNotice />

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertCircle className="size-4" />
          <AlertTitle>Planner unavailable</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Try again shortly."}
          </AlertDescription>
        </Alert>
      )}

      {completionMutation.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Task update failed</AlertTitle>
          <AlertDescription>
            The previous state was restored. Check your connection and try
            again.
          </AlertDescription>
        </Alert>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {completionMutation.isSuccess ? "Task update saved." : ""}
      </p>

      <section className="py-9" aria-labelledby="today-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="today-heading" className="font-semibold text-2xl">
              Today
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {todayTasks.length > 0
                ? `${completedToday} of ${todayTasks.length} tasks complete`
                : "Your next useful task will appear here."}
            </p>
          </div>
          {todayTasks.length > 0 && (
            <span className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock3 className="size-4" />
              {todayTasks.reduce(
                (sum, item) => sum + item.task.estimatedMinutes,
                0,
              )}{" "}
              min scheduled
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-18 w-full" />
            <Skeleton className="h-18 w-full" />
          </div>
        ) : todayTasks.length > 0 ? (
          <div className="mt-5 divide-y rounded-lg border">
            {todayTasks.map((item) => (
              <div
                key={item.task.id}
                className="flex items-start gap-4 p-4 sm:p-5"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={item.task.completed}
                  onCheckedChange={(value) =>
                    completionMutation.mutate({
                      item,
                      completed: value === true,
                    })
                  }
                  aria-label={`Mark ${item.task.title} ${item.task.completed ? "incomplete" : "complete"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/study-planner/${item.planSlug}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {item.task.title}
                    </Link>
                    <Badge variant="outline" className="capitalize">
                      {item.task.taskType}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {item.subjectName} · {item.task.estimatedMinutes} min
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon">
                  <Link href={`/study-planner/${item.planSlug}`}>
                    <ArrowRight className="size-4" />
                    <span className="sr-only">Open {item.subjectName}</span>
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border bg-muted/20 p-6 sm:p-8">
            <CheckCircle2 className="size-6 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">
              {activePlans.length > 0
                ? "No tasks scheduled today"
                : "Turn a course syllabus into a daily plan"}
            </h3>
            <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
              {activePlans.length > 0
                ? "Open a plan to review upcoming work or move a task into today."
                : "Choose a course, set your exam date and available minutes, then review the schedule before starting."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {activePlans.length > 0 ? (
                <Button asChild variant="outline">
                  <Link href={`/study-planner/${activePlans[0].slug}`}>
                    Open active plan
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() =>
                      setCreatorSeed({
                        courseSlug: "data-structures-algorithms",
                      })
                    }
                  >
                    <BookOpen className="size-4" />
                    Try the Data Structures example
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/course-explorer">Browse courses</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCreatorSeed({ mode: "manual" })}
                  >
                    Enter topics manually
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="border-t py-9" aria-labelledby="upcoming-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="upcoming-heading" className="font-semibold text-2xl">
              Upcoming
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Unfinished work scheduled for the next seven days.
            </p>
          </div>
          {upcomingTasks.length > 5 && (
            <span className="text-muted-foreground text-sm">
              Showing 5 of {upcomingTasks.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : upcomingTasks.length > 0 ? (
          <div className="mt-5 divide-y rounded-lg border">
            {upcomingTasks.slice(0, 5).map((item) => (
              <Link
                key={item.task.id}
                href={`/study-planner/${item.planSlug}`}
                className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-sm">
                    {item.task.title}
                  </span>
                  <span className="mt-1 block text-muted-foreground text-xs">
                    {item.subjectName} · {item.task.estimatedMinutes} min
                  </span>
                </span>
                <span className="shrink-0 text-muted-foreground text-sm">
                  {formatShortDate(item.task.scheduledDate)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-muted-foreground text-sm">
            No unfinished tasks are scheduled for the next seven days.
          </p>
        )}
      </section>

      <section className="border-t pt-9" aria-labelledby="plans-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="plans-heading" className="font-semibold text-2xl">
              Your plans
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Active plans first, with honest progress from completed tasks.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/course-explorer">
              Browse courses
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : plans.length > 0 ? (
          <div className="mt-5 divide-y rounded-lg border">
            {plans.map((plan) => {
              const progress = Number(plan.progressPercentage ?? 0);
              return (
                <Link
                  key={plan.id}
                  href={`/study-planner/${plan.slug}`}
                  className="group block p-4 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold group-hover:text-primary">
                          {plan.subjectName}
                        </h3>
                        <Badge variant="outline" className="capitalize">
                          {plan.status}
                        </Badge>
                        {(plan.overdueTasks ?? 0) > 0 && (
                          <Badge variant="secondary">
                            {plan.overdueTasks} overdue
                          </Badge>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={progress} className="max-w-60" />
                        <span className="text-muted-foreground text-xs">
                          {plan.completedTasks ?? 0}/{plan.totalTasks ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-5 text-muted-foreground text-sm">
                      {(plan.todayTasks ?? 0) > 0 && (
                        <span>{plan.todayTasks} today</span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="size-4" />
                        {formatExamDate(plan.examDate)}
                      </span>
                      <ArrowRight className="size-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 text-muted-foreground text-sm">
            No plans yet. Start with the example above or browse a course.
          </p>
        )}
      </section>
    </main>
  );
}

function focusModeToGoal(focusMode: StudyPlanSeed["focusMode"]): StudyPlanGoal {
  if (focusMode === "essentials") return "minimum";
  if (focusMode === "full") return "full-coverage";
  return "exam-prep";
}

function formatExamDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
