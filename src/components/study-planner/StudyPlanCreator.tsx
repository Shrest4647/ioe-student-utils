"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CourseCatalogResult } from "@/types/course-learning";
import {
  DEFAULT_STUDY_AVAILABILITY,
  type PlanningTopic,
  type StudyAvailability,
  type StudyPlanGoal,
  type StudyPlanningContext,
  type StudyPlanPreview,
  type StudyPlanPreviewInput,
  type WeekdayKey,
} from "@/types/study-planner";
import { OfflineNotice } from "./OfflineNotice";

interface StudyPlanCreatorProps {
  initialCourseSlug?: string;
  initialTopicSlugs?: string[];
  initialMode?: "course" | "manual";
  initialGoal?: StudyPlanGoal;
  initialExamDate?: string;
  onCancel?: () => void;
  onSuccess?: (slug: string) => void;
}

const WEEKDAYS: Array<{ key: WeekdayKey; label: string }> = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

const GOALS: Array<{
  value: StudyPlanGoal;
  title: string;
  description: string;
}> = [
  {
    value: "minimum",
    title: "Pass essentials",
    description: "Core topics and their required foundations.",
  },
  {
    value: "exam-prep",
    title: "Exam preparation",
    description: "Core and important topics, weighted toward practice.",
  },
  {
    value: "full-coverage",
    title: "Full syllabus",
    description: "Broad coverage when you have enough time.",
  },
];

export function StudyPlanCreator({
  initialCourseSlug,
  initialTopicSlugs = [],
  initialMode = initialCourseSlug ? "course" : "course",
  initialGoal = "exam-prep",
  initialExamDate,
  onCancel,
  onSuccess,
}: StudyPlanCreatorProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"course" | "manual">(initialMode);
  const [courseSearch, setCourseSearch] = useState("");
  const [courseSlug, setCourseSlug] = useState(initialCourseSlug ?? "");
  const [selectedTopics, setSelectedTopics] =
    useState<string[]>(initialTopicSlugs);
  const [knownTopics, setKnownTopics] = useState<string[]>([]);
  const [manualSubject, setManualSubject] = useState("");
  const [manualTopics, setManualTopics] = useState<string[]>([]);
  const [manualTopic, setManualTopic] = useState("");
  const [goal, setGoal] = useState<StudyPlanGoal>(initialGoal);
  const [startDate, setStartDate] = useState(todayInKathmandu());
  const [examDate, setExamDate] = useState(
    initialExamDate || shiftDate(todayInKathmandu(), 14),
  );
  const [availability, setAvailability] = useState<StudyAvailability>(
    DEFAULT_STUDY_AVAILABILITY,
  );
  const [preview, setPreview] = useState<StudyPlanPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["study-planner-course-search", courseSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        readiness: "ready",
        limit: "12",
      });
      if (courseSearch.trim()) params.set("search", courseSearch.trim());
      const response = await fetch(`/api/course-explorer/catalog?${params}`);
      if (!response.ok) throw new Error("Could not load courses");
      return (await response.json()) as CourseCatalogResult & {
        success: boolean;
      };
    },
    enabled: mode === "course" && !courseSlug,
    staleTime: 60_000,
  });

  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: ["study-planning-context", courseSlug],
    queryFn: async () => {
      const response = await fetch(
        `/api/course-explorer/courses/slug/${encodeURIComponent(courseSlug)}/planning-context`,
      );
      if (!response.ok) throw new Error("Could not load the course syllabus");
      const payload = (await response.json()) as {
        success: boolean;
        data: StudyPlanningContext;
      };
      return payload.data;
    },
    enabled: mode === "course" && Boolean(courseSlug),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!context || selectedTopics.length > 0) return;
    const recommended = context.topics
      .filter(
        (topic) => topic.priority === "core" || topic.priority === "important",
      )
      .map((topic) => topic.slug);
    setSelectedTopics(
      recommended.length > 0
        ? recommended
        : context.topics.map((topic) => topic.slug),
    );
  }, [context, selectedTopics.length]);

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, PlanningTopic[]>();
    for (const topic of context?.topics ?? []) {
      const key = topic.unitName ?? "Course topics";
      groups.set(key, [...(groups.get(key) ?? []), topic]);
    }
    return Array.from(groups.entries());
  }, [context]);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;
  const canContinueFromSelection =
    mode === "course"
      ? Boolean(courseSlug && selectedTopics.length > 0)
      : Boolean(manualSubject.trim() && manualTopics.length > 0);

  const buildInput = (): StudyPlanPreviewInput => ({
    courseSlug: mode === "course" ? courseSlug : undefined,
    subjectName: mode === "manual" ? manualSubject.trim() : undefined,
    topics: mode === "manual" ? buildManualTopics(manualTopics) : undefined,
    topicSlugs: mode === "course" ? selectedTopics : undefined,
    knownTopicSlugs: mode === "course" ? knownTopics : undefined,
    goal,
    startDate,
    examDate,
    availability,
    preferredSessionMinutes: 45,
  });

  const requestPreview = async () => {
    setIsPreviewing(true);
    setError(null);
    try {
      const response = await fetch("/api/study-plans/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildInput()),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: StudyPlanPreview;
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not preview this plan");
      }
      setPreview(payload.data);
      setStep(3);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Could not preview this plan",
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const activatePlan = async () => {
    setIsActivating(true);
    setError(null);
    try {
      const response = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: buildInput() }),
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: { slug: string };
        error?: string;
      };
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "Could not create this plan");
      }
      onSuccess?.(payload.data.slug);
      router.push(`/study-planner/${payload.data.slug}`);
    } catch (activationError) {
      setError(
        activationError instanceof Error
          ? activationError.message
          : "Could not create this plan",
      );
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border-b pb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-muted-foreground text-sm">
              Step {step} of 3
            </p>
            <h1 className="mt-1 font-semibold text-2xl tracking-tight sm:text-3xl">
              {step === 1
                ? "Choose what to study"
                : step === 2
                  ? "Set your study time"
                  : "Review the schedule"}
            </h1>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="size-4" />
              <span className="sr-only">Close plan creator</span>
            </Button>
          )}
        </div>
        <Progress value={progress} className="mt-5 max-w-sm" />
      </div>

      <OfflineNotice />

      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTitle>Plan could not be updated</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <div className="py-8">
          <div className="inline-flex rounded-lg bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "course" ? "default" : "ghost"}
              onClick={() => setMode("course")}
            >
              Use an IOE course
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "manual" ? "default" : "ghost"}
              onClick={() => setMode("manual")}
            >
              Enter topics manually
            </Button>
          </div>

          {mode === "course" ? (
            <div className="mt-8">
              {!courseSlug ? (
                <div>
                  <Label htmlFor="course-search">Find a course</Label>
                  <div className="relative mt-2 max-w-xl">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="course-search"
                      value={courseSearch}
                      onChange={(event) => setCourseSearch(event.target.value)}
                      placeholder="Course name, code, or topic"
                      className="pl-9"
                    />
                  </div>
                  <div className="mt-5 divide-y rounded-lg border">
                    {catalogLoading ? (
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : catalog?.data.length ? (
                      catalog.data.map((course) => (
                        <button
                          type="button"
                          key={course.id}
                          onClick={() => {
                            setCourseSlug(course.slug);
                            setSelectedTopics([]);
                          }}
                          className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                        >
                          <span>
                            <span className="block font-medium">
                              {course.name}
                            </span>
                            <span className="mt-1 block text-muted-foreground text-sm">
                              {course.code} · {course.activeTopicCount} topics
                            </span>
                          </span>
                          <ArrowRight className="size-4 text-muted-foreground" />
                        </button>
                      ))
                    ) : (
                      <p className="p-5 text-muted-foreground text-sm">
                        No ready course outlines match this search.
                      </p>
                    )}
                  </div>
                </div>
              ) : contextLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : context ? (
                <div>
                  <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-primary text-sm">
                        {context.course.code}
                      </p>
                      <h2 className="mt-1 font-semibold text-xl">
                        {context.course.name}
                      </h2>
                      <p className="mt-1 text-muted-foreground text-sm">
                        {selectedTopics.length} of {context.topics.length}{" "}
                        topics selected
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCourseSlug("");
                        setSelectedTopics([]);
                        setKnownTopics([]);
                      }}
                    >
                      Change course
                    </Button>
                  </div>

                  <div className="mt-6 space-y-7">
                    {groupedTopics.map(([unitName, topics]) => (
                      <section key={unitName}>
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="font-semibold">{unitName}</h3>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const unitSlugs = topics.map(
                                (topic) => topic.slug,
                              );
                              const allSelected = unitSlugs.every((slug) =>
                                selectedTopics.includes(slug),
                              );
                              setSelectedTopics((current) =>
                                allSelected
                                  ? current.filter(
                                      (slug) => !unitSlugs.includes(slug),
                                    )
                                  : Array.from(
                                      new Set([...current, ...unitSlugs]),
                                    ),
                              );
                            }}
                          >
                            Toggle unit
                          </Button>
                        </div>
                        <div className="mt-3 divide-y rounded-lg border">
                          {topics.map((topic) => {
                            const checked = selectedTopics.includes(topic.slug);
                            const known = knownTopics.includes(topic.slug);
                            return (
                              <div
                                key={topic.slug}
                                className="flex items-start gap-3 p-4"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) =>
                                    setSelectedTopics((current) =>
                                      value
                                        ? [...current, topic.slug]
                                        : current.filter(
                                            (slug) => slug !== topic.slug,
                                          ),
                                    )
                                  }
                                  aria-label={`Include ${topic.name}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {topic.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="capitalize"
                                    >
                                      {topic.priority}
                                    </Badge>
                                    {topic.hours > 0 && (
                                      <span className="text-muted-foreground text-xs">
                                        {topic.hours}h estimate
                                      </span>
                                    )}
                                  </div>
                                  {checked && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setKnownTopics((current) =>
                                          known
                                            ? current.filter(
                                                (slug) => slug !== topic.slug,
                                              )
                                            : [...current, topic.slug],
                                        )
                                      }
                                      className={cn(
                                        "mt-2 text-muted-foreground text-xs hover:text-foreground",
                                        known && "font-medium text-primary",
                                      )}
                                    >
                                      {known
                                        ? "Marked as already known"
                                        : "I already know this"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTitle>Course outline unavailable</AlertTitle>
                  <AlertDescription>
                    Choose another course or enter topics manually.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="mt-8 max-w-2xl space-y-6">
              <div>
                <Label htmlFor="manual-subject">Subject name</Label>
                <Input
                  id="manual-subject"
                  value={manualSubject}
                  onChange={(event) => setManualSubject(event.target.value)}
                  placeholder="For example, Engineering Mathematics"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="manual-topic">Topics</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="manual-topic"
                    value={manualTopic}
                    onChange={(event) => setManualTopic(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addManualTopic(
                          manualTopic,
                          manualTopics,
                          setManualTopics,
                          setManualTopic,
                        );
                      }
                    }}
                    placeholder="Add one topic at a time"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      addManualTopic(
                        manualTopic,
                        manualTopics,
                        setManualTopics,
                        setManualTopic,
                      )
                    }
                  >
                    Add
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {manualTopics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="gap-1.5">
                      {topic}
                      <button
                        type="button"
                        onClick={() =>
                          setManualTopics((current) =>
                            current.filter((item) => item !== topic),
                          )
                        }
                        aria-label={`Remove ${topic}`}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-9 py-8">
          <section>
            <h2 className="font-semibold text-lg">Goal</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {GOALS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setGoal(option.value)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    goal === option.value &&
                      "border-primary bg-primary/5 ring-1 ring-primary/20",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{option.title}</span>
                    {goal === option.value && (
                      <Check className="size-4 text-primary" />
                    )}
                  </span>
                  <span className="mt-2 block text-muted-foreground text-sm">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="exam-date">Exam or target date</Label>
              <Input
                id="exam-date"
                type="date"
                value={examDate}
                min={shiftDate(startDate, 1)}
                onChange={(event) => setExamDate(event.target.value)}
                className="mt-2"
              />
            </div>
          </section>

          <section>
            <div>
              <h2 className="font-semibold text-lg">Minutes available</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Set zero for rest days. The exam eve is kept light.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((day) => (
                <div key={day.key}>
                  <Label htmlFor={`availability-${day.key}`}>{day.label}</Label>
                  <Input
                    id={`availability-${day.key}`}
                    type="number"
                    min={0}
                    max={720}
                    step={15}
                    value={availability[day.key]}
                    onChange={(event) =>
                      setAvailability((current) => ({
                        ...current,
                        [day.key]: Math.max(0, Number(event.target.value)),
                      }))
                    }
                    className="mt-2"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {step === 3 && preview && (
        <div className="py-8">
          <div className="grid gap-6 border-b pb-7 sm:grid-cols-3">
            <Summary
              label="Scheduled"
              value={formatMinutes(preview.scheduledMinutes)}
            />
            <Summary
              label="Available"
              value={formatMinutes(preview.availableMinutes)}
            />
            <Summary
              label="Topics"
              value={String(preview.selectedTopicSlugs.length)}
            />
          </div>

          {preview.warnings.length > 0 && (
            <div className="mt-6 space-y-3">
              {preview.warnings.map((warning) => (
                <Alert
                  key={`${warning.code}-${warning.message}`}
                  variant={warning.blocking ? "destructive" : "default"}
                >
                  <AlertTitle>
                    {warning.blocking
                      ? "Schedule needs attention"
                      : "Review note"}
                  </AlertTitle>
                  <AlertDescription>{warning.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <section className="mt-8" aria-labelledby="preview-days-heading">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="preview-days-heading" className="font-semibold text-xl">
                  First study days
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Tasks stay within the time you assigned to each day.
                </p>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {preview.goal.replace("-", " ")}
              </Badge>
            </div>
            <div className="mt-5 divide-y rounded-lg border">
              {preview.days
                .filter((day) => day.tasks.length > 0)
                .slice(0, 7)
                .map((day) => (
                  <div key={day.date} className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-primary" />
                        <h3 className="font-semibold">
                          {formatStudyDate(day.date)}
                        </h3>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {day.scheduledMinutes} of {day.capacityMinutes} min
                      </span>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {day.tasks.map((task) => (
                        <li
                          key={task.key}
                          className="flex items-start justify-between gap-4 text-sm"
                        >
                          <span>{task.title}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {task.estimatedMinutes} min
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </section>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (step > 1) {
              setStep(step - 1);
              setPreview(null);
            } else {
              onCancel?.();
            }
          }}
        >
          <ArrowLeft className="size-4" />
          {step === 1 ? "Back to planner" : "Previous"}
        </Button>
        {step === 1 ? (
          <Button
            disabled={!canContinueFromSelection}
            onClick={() => setStep(2)}
          >
            Set study time
            <ArrowRight className="size-4" />
          </Button>
        ) : step === 2 ? (
          <Button
            disabled={isPreviewing || !startDate || !examDate}
            onClick={requestPreview}
          >
            {isPreviewing ? "Building preview..." : "Preview schedule"}
            <Sparkles className="size-4" />
          </Button>
        ) : (
          <Button
            disabled={
              isActivating ||
              !preview ||
              preview.warnings.some((warning) => warning.blocking)
            }
            onClick={activatePlan}
          >
            {isActivating ? "Creating plan..." : "Start this plan"}
            <BookOpen className="size-4" />
          </Button>
        )}
      </div>
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 font-semibold text-xl">{value}</p>
    </div>
  );
}

function addManualTopic(
  topic: string,
  current: string[],
  setTopics: (topics: string[]) => void,
  setTopic: (topic: string) => void,
) {
  const value = topic.trim();
  if (!value || current.includes(value)) return;
  setTopics([...current, value]);
  setTopic("");
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "topic"
  );
}

function buildManualTopics(names: string[]): PlanningTopic[] {
  const slugCounts = new Map<string, number>();
  return names.map((name) => {
    const baseSlug = slugify(name);
    const count = (slugCounts.get(baseSlug) ?? 0) + 1;
    slugCounts.set(baseSlug, count);
    return {
      slug: count === 1 ? baseSlug : `${baseSlug}-${count}`,
      name,
      hours: 1,
      weightage: null,
      priority: "core",
      prerequisites: [],
    };
  });
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

function shiftDate(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatStudyDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
