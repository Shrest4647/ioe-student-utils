"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type {
  StudyPlanRebalancePreview,
  StudyPlanWorkspace as StudyPlanWorkspaceData,
  StudyWorkspaceTask,
} from "@/types/study-planner";
import { OfflineNotice } from "./OfflineNotice";

export function StudyPlanWorkspace({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("today");
  const [rebalancePreview, setRebalancePreview] =
    useState<StudyPlanRebalancePreview | null>(null);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);
  const queryKey = ["study-plan-workspace", slug];
  const workspaceQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(
        `/api/study-plans/slug/${encodeURIComponent(slug)}/workspace`,
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: StudyPlanWorkspaceData;
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not load this study plan");
      }
      return payload.data;
    },
  });

  const taskMutation = useMutation({
    mutationFn: async ({
      task,
      update,
    }: {
      task: StudyWorkspaceTask;
      update: { completed?: boolean; scheduledDate?: string; notes?: string };
    }) => {
      const response = task.slug
        ? await fetch(
            `/api/study-plans/slug/${encodeURIComponent(slug)}/tasks/${encodeURIComponent(task.slug)}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(update),
            },
          )
        : update.completed !== undefined
          ? await fetch(
              `/api/study-tasks/${encodeURIComponent(task.id)}/${update.completed ? "complete" : "uncomplete"}`,
              { method: "PATCH" },
            )
          : null;
      if (!response?.ok) throw new Error("The task could not be updated");
    },
    onMutate: async ({ task, update }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<StudyPlanWorkspaceData>(queryKey);
      if (previous) {
        const nextTasks = previous.tasks.map((candidate) =>
          candidate.id === task.id ? { ...candidate, ...update } : candidate,
        );
        queryClient.setQueryData<StudyPlanWorkspaceData>(queryKey, {
          ...previous,
          tasks: nextTasks,
          today: nextTasks.filter(
            (candidate) => candidate.scheduledDate === todayInKathmandu(),
          ),
          overdue: nextTasks.filter(
            (candidate) =>
              !candidate.completed &&
              candidate.scheduledDate !== null &&
              candidate.scheduledDate < todayInKathmandu(),
          ),
          upcoming: nextTasks.filter(
            (candidate) =>
              !candidate.completed &&
              candidate.scheduledDate !== null &&
              candidate.scheduledDate > todayInKathmandu(),
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["today-study-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-study-tasks"] });
    },
  });

  if (workspaceQuery.isLoading) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  if (workspaceQuery.error || !workspaceQuery.data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Alert variant="destructive">
          <AlertTitle>Study plan unavailable</AlertTitle>
          <AlertDescription>
            {workspaceQuery.error instanceof Error
              ? workspaceQuery.error.message
              : "This plan does not exist or you do not have access."}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/study-planner">
            <ArrowLeft className="size-4" />
            Back to planner
          </Link>
        </Button>
      </main>
    );
  }

  const plan = workspaceQuery.data;
  const readOnly = plan.status !== "active";
  const progress = Number(plan.progressPercentage ?? 0);
  const completed = plan.tasks.filter((task) => task.completed).length;
  const focusTasks = [...plan.overdue, ...plan.today].filter(
    (task, index, all) =>
      all.findIndex((item) => item.id === task.id) === index,
  );
  const grouped = groupTasksByDate(plan.tasks);
  const resourceTopics = Array.from(
    new Map(
      plan.tasks.flatMap((task) =>
        task.topic ? [[task.topic.slug, task.topic] as const] : [],
      ),
    ).values(),
  );

  const previewRebalance = async () => {
    setRebalanceLoading(true);
    try {
      const response = await fetch(
        `/api/study-plans/slug/${encodeURIComponent(slug)}/rebalance/preview`,
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        success: boolean;
        data?: StudyPlanRebalancePreview;
      };
      if (response.ok && payload.data) setRebalancePreview(payload.data);
    } finally {
      setRebalanceLoading(false);
    }
  };

  const applyRebalance = async () => {
    setRebalanceLoading(true);
    try {
      const response = await fetch(
        `/api/study-plans/slug/${encodeURIComponent(slug)}/rebalance`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("Could not rebalance tasks");
      setRebalancePreview(null);
      await queryClient.invalidateQueries({ queryKey });
    } finally {
      setRebalanceLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/study-planner">
          <ArrowLeft className="size-4" />
          All study plans
        </Link>
      </Button>

      <header className="mt-5 grid gap-7 border-b pb-8 lg:grid-cols-[1fr_20rem] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {plan.course && <Badge variant="outline">{plan.course.code}</Badge>}
            <Badge variant="secondary" className="capitalize">
              {(plan.goal ?? "manual").replace("-", " ")}
            </Badge>
            {(plan.overdueTasks ?? 0) > 0 && (
              <Badge variant="outline">{plan.overdueTasks} overdue</Badge>
            )}
          </div>
          <h1 className="mt-4 font-semibold text-3xl tracking-tight sm:text-4xl">
            {plan.subjectName}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Exam {formatDate(plan.examDate)}. {completed} of {plan.tasks.length}{" "}
            tasks complete.
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mt-2 h-2" />
        </div>
      </header>

      <OfflineNotice />

      {readOnly && (
        <Alert className="mt-6">
          <AlertTitle>This plan is archived</AlertTitle>
          <AlertDescription>
            Its schedule, notes, and progress remain available as a read-only
            record.
          </AlertDescription>
        </Alert>
      )}

      {taskMutation.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Task update failed</AlertTitle>
          <AlertDescription>
            Your previous task state was restored. Try again.
          </AlertDescription>
        </Alert>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {taskMutation.isSuccess ? "Task update saved." : ""}
      </p>

      {!readOnly && plan.overdue.length > 0 && (
        <div className="mt-6 space-y-3">
          <Alert>
            <CalendarDays className="size-4" />
            <AlertTitle>
              {plan.overdue.length} overdue task
              {plan.overdue.length === 1 ? "" : "s"}
            </AlertTitle>
            <AlertDescription>
              Spread missed work across the remaining available days, or move
              tasks individually below.
            </AlertDescription>
          </Alert>
          {!rebalancePreview ? (
            <Button
              variant="outline"
              onClick={previewRebalance}
              disabled={rebalanceLoading}
            >
              {rebalanceLoading ? "Checking capacity..." : "Preview rebalance"}
            </Button>
          ) : (
            <div className="rounded-lg border p-4 sm:p-5">
              <p className="font-medium">{rebalancePreview.message}</p>
              {rebalancePreview.changes.length > 0 && (
                <ul className="mt-3 space-y-2 text-sm">
                  {rebalancePreview.changes.map((change) => (
                    <li key={change.taskId} className="flex flex-wrap gap-2">
                      <span>{change.title}</span>
                      <span className="text-muted-foreground">
                        {formatDate(change.fromDate)} to{" "}
                        {formatDate(change.toDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={applyRebalance}
                  disabled={
                    rebalanceLoading || rebalancePreview.changes.length === 0
                  }
                >
                  {rebalanceLoading ? "Applying..." : "Apply these changes"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setRebalancePreview(null)}
                >
                  Keep current dates
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto"
        >
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="pt-7">
          <SectionHeading
            title="Next tasks"
            description={
              focusTasks.length > 0
                ? "Overdue work appears before tasks scheduled for today."
                : "There is no unfinished work scheduled for today."
            }
          />
          {focusTasks.length > 0 ? (
            <TaskList
              tasks={focusTasks}
              readOnly={readOnly}
              onUpdate={(task, update) => taskMutation.mutate({ task, update })}
            />
          ) : (
            <EmptySection
              title="Today's work is clear"
              description="Open the Plan tab to review upcoming tasks or move one into today."
            />
          )}
        </TabsContent>

        <TabsContent value="plan" className="pt-7">
          <SectionHeading
            title="Dated plan"
            description="Future weeks stay readable because tasks are grouped by their actual study date."
          />
          <div className="mt-5 space-y-8">
            {grouped.map(([date, tasks]) => (
              <section key={date}>
                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <h3 className="font-semibold">{formatDate(date)}</h3>
                  <span className="text-muted-foreground text-sm">
                    {tasks.reduce(
                      (sum, task) => sum + (task.estimatedMinutes ?? 0),
                      0,
                    )}{" "}
                    min
                  </span>
                </div>
                <TaskList
                  tasks={tasks}
                  readOnly={readOnly}
                  onUpdate={(task, update) =>
                    taskMutation.mutate({ task, update })
                  }
                />
              </section>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="pt-7">
          <SectionHeading
            title="Progress"
            description="Progress reflects persisted task completion, not an estimated mastery score."
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <ProgressFact
              label="Completed"
              value={`${completed}/${plan.tasks.length}`}
            />
            <ProgressFact label="Overdue" value={String(plan.overdue.length)} />
            <ProgressFact
              label="Time logged"
              value={`${plan.tasks.reduce(
                (sum, task) => sum + (task.actualMinutesSpent ?? 0),
                0,
              )} min`}
            />
          </div>
          <div className="mt-8 max-w-2xl">
            <Progress value={progress} className="h-2" />
            <p className="mt-3 text-muted-foreground text-sm">
              {Math.round(progress)}% of scheduled tasks are complete.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="pt-7">
          <SectionHeading
            title="Course resources"
            description="Open the course topic to access its curated primary, supplementary, and practice materials."
          />
          {plan.course && resourceTopics.length > 0 ? (
            <div className="mt-5 divide-y rounded-lg border">
              {resourceTopics.map((topic) => (
                <Link
                  key={topic.slug}
                  href={`/course-explorer/${plan.course?.slug}?topic=${topic.slug}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <FileText className="size-4 text-primary" />
                    <span>
                      <span className="block font-medium text-sm">
                        {topic.name}
                      </span>
                      <span className="mt-1 block text-muted-foreground text-xs">
                        {topic.resourceCount} linked resource
                        {topic.resourceCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </span>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptySection
              title="No linked course resources"
              description="Manual plans remain useful, but course-backed plans can connect each task to syllabus resources."
            />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}

function TaskList({
  tasks,
  readOnly,
  onUpdate,
}: {
  tasks: StudyWorkspaceTask[];
  readOnly: boolean;
  onUpdate: (
    task: StudyWorkspaceTask,
    update: { completed?: boolean; scheduledDate?: string; notes?: string },
  ) => void;
}) {
  return (
    <div className="mt-4 divide-y rounded-lg border">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          readOnly={readOnly}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

function TaskRow({
  task,
  readOnly,
  onUpdate,
}: {
  task: StudyWorkspaceTask;
  readOnly: boolean;
  onUpdate: (
    task: StudyWorkspaceTask,
    update: { completed?: boolean; scheduledDate?: string; notes?: string },
  ) => void;
}) {
  const [notes, setNotes] = useState(task.notes ?? "");
  const [date, setDate] = useState(task.scheduledDate ?? "");
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <Checkbox
          className="mt-0.5"
          checked={Boolean(task.completed)}
          disabled={readOnly}
          onCheckedChange={(value) =>
            onUpdate(task, { completed: value === true })
          }
          aria-label={`Mark ${task.title} ${task.completed ? "incomplete" : "complete"}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                task.completed
                  ? "text-muted-foreground line-through"
                  : "font-medium"
              }
            >
              {task.title}
            </span>
            <Badge variant="outline" className="capitalize">
              {task.taskType}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                {task.estimatedMinutes} min
              </span>
            )}
            {task.topic && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {task.topic.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <details className="mt-3 pl-9">
        <summary className="cursor-pointer text-muted-foreground text-sm hover:text-foreground">
          Notes and schedule
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-[12rem_1fr]">
          <div>
            <label className="font-medium text-xs" htmlFor={`date-${task.id}`}>
              Study date
            </label>
            <Input
              id={`date-${task.id}`}
              type="date"
              value={date}
              disabled={readOnly}
              onChange={(event) => setDate(event.target.value)}
              onBlur={() => {
                if (date && date !== task.scheduledDate) {
                  onUpdate(task, { scheduledDate: date });
                }
              }}
              className="mt-2"
            />
          </div>
          <div>
            <label className="font-medium text-xs" htmlFor={`notes-${task.id}`}>
              Notes
            </label>
            <Textarea
              id={`notes-${task.id}`}
              value={notes}
              disabled={readOnly}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Record what to revisit or what you learned."
              maxLength={4000}
              className="mt-2 min-h-20"
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={readOnly || notes === (task.notes ?? "")}
              onClick={() => onUpdate(task, { notes })}
            >
              Save notes
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-semibold text-xl">{title}</h2>
      <p className="mt-1 max-w-2xl text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-lg border bg-muted/20 p-8 text-center">
      <CheckCircle2 className="mx-auto size-6 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}

function ProgressFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t pt-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 font-semibold text-2xl">{value}</p>
    </div>
  );
}

function groupTasksByDate(
  tasks: StudyWorkspaceTask[],
): Array<[string, StudyWorkspaceTask[]]> {
  const groups = new Map<string, StudyWorkspaceTask[]>();
  for (const task of tasks) {
    const key = task.scheduledDate ?? "Unscheduled";
    groups.set(key, [...(groups.get(key) ?? []), task]);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatDate(value: string): string {
  if (value === "Unscheduled") return value;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function todayInKathmandu(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
