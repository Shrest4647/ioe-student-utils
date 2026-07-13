"use client";

import { ArrowLeft, BookOpen, Map as MapIcon, Rows3 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  CourseFocusMode,
  CourseLearningTopic,
  CourseLearningView,
  CourseWorkspaceView,
  TopicFocusReason,
} from "@/types/course-learning";
import { SyllabusOutline } from "./syllabus-outline";
import { TopicDetail } from "./topic-detail";

const RelationshipMap = dynamic(
  () => import("./relationship-map").then((module) => module.RelationshipMap),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[68dvh] min-h-125 w-full" />,
  },
);

const focusLabels: Record<CourseFocusMode, string> = {
  overview: "Overview",
  exam: "Exam focus",
  essentials: "Pass essentials",
  full: "Full syllabus",
};

export function CourseWorkspace({
  learningView,
}: {
  learningView: CourseLearningView;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [topicSearch, setTopicSearch] = useState("");

  const focusMode = parseFocusMode(searchParams.get("focus"));
  const workspaceView = parseWorkspaceView(searchParams.get("view"));
  const selectedTopicSlug = searchParams.get("topic") ?? undefined;
  const allTopics = useMemo(
    () => learningView.units.flatMap((unit) => flattenTopics(unit.topics)),
    [learningView.units],
  );
  const selectedTopic = allTopics.find(
    (topic) => topic.slug === selectedTopicSlug,
  );
  const focusReasons = useMemo<Map<string, TopicFocusReason>>(() => {
    if (focusMode === "exam") {
      return new Map(
        learningView.focus.exam.map((reason) => [reason.slug, reason]),
      );
    }
    if (focusMode === "essentials") {
      return new Map(
        learningView.focus.essentials.map((reason) => [reason.slug, reason]),
      );
    }
    return new Map<string, TopicFocusReason>();
  }, [focusMode, learningView.focus]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "ioesu:recent-course",
        JSON.stringify({
          slug: learningView.course.slug,
          name: learningView.course.name,
          code: learningView.course.code,
        }),
      );
    } catch {}
  }, [learningView.course]);

  useEffect(() => {
    if (!selectedTopicSlug || selectedTopic) return;

    const next = new URLSearchParams(searchParams.toString());
    next.delete("topic");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  }, [pathname, router, searchParams, selectedTopic, selectedTopicSlug]);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };

  if (!learningView.readiness.hasExplorerContent) {
    return (
      <main className="mx-auto flex min-h-[65dvh] max-w-xl flex-col justify-center px-4 text-center">
        <BookOpen className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 font-semibold text-2xl">
          This outline is not published yet
        </h1>
        <p className="mt-3 text-muted-foreground">
          {learningView.course.name} is in the academic catalog, but it does not
          have active topics to explore.
        </p>
        <Button asChild variant="outline" className="mx-auto mt-6">
          <Link href="/course-explorer">Browse available outlines</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/course-explorer"
        className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All course outlines
      </Link>

      <header className="mt-6 border-b pb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {learningView.course.code}
              </Badge>
              {learningView.course.credits && (
                <span className="text-muted-foreground text-sm">
                  {learningView.course.credits} credits
                </span>
              )}
            </div>
            <h1 className="mt-3 font-bold text-3xl tracking-tight sm:text-4xl">
              {learningView.course.name}
            </h1>
            {learningView.course.description && (
              <p className="mt-3 max-w-2xl text-muted-foreground leading-6">
                {learningView.course.description}
              </p>
            )}
            <p className="mt-4 text-muted-foreground text-sm">
              {learningView.readiness.activeUnitCount} units ·{" "}
              {learningView.readiness.activeTopicCount} topics ·{" "}
              {learningView.readiness.resourceCount} resources
            </p>
            {learningView.placements.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {learningView.placements.map((placement) => (
                  <Badge key={placement.id} variant="secondary">
                    {placement.program.code}
                    {placement.yearNumber
                      ? ` · Year ${placement.yearNumber}`
                      : ""}
                    {placement.partNumber
                      ? ` · Part ${placement.partNumber}`
                      : ""}
                    {placement.courseType ? ` · ${placement.courseType}` : ""}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Study focus</span>
              <select
                value={focusMode}
                onChange={(event) =>
                  updateParam(
                    "focus",
                    event.target.value === "overview"
                      ? undefined
                      : event.target.value,
                  )
                }
                className="h-9 rounded-md border bg-background px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {Object.entries(focusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div
              className="flex rounded-md border p-1"
              aria-label="Course view"
              role="group"
            >
              <button
                type="button"
                onClick={() => updateParam("view")}
                aria-pressed={workspaceView === "outline"}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded px-3 font-medium text-sm",
                  workspaceView === "outline"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Rows3 className="size-4" />
                Outline
              </button>
              <button
                type="button"
                onClick={() => updateParam("view", "map")}
                aria-pressed={workspaceView === "map"}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded px-3 font-medium text-sm",
                  workspaceView === "map"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <MapIcon className="size-4" />
                Map
              </button>
            </div>
          </div>
        </div>
      </header>

      {workspaceView === "map" ? (
        <div className="mt-8">
          <div className="mb-4 max-w-2xl">
            <h2 className="font-semibold text-xl">Course relationships</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Solid structural lines follow units and parent topics. Labeled
              accent lines show strong or weak prerequisites.
            </p>
          </div>
          <RelationshipMap
            learningView={learningView}
            onSelectTopic={(slug) => updateParam("topic", slug)}
          />
          <div className="mt-8 lg:hidden">
            <TopicDetail
              topic={selectedTopic}
              courseSlug={learningView.course.slug}
              focusMode={focusMode}
              onSelectTopic={(slug) => updateParam("topic", slug)}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div>
            <SyllabusOutline
              units={learningView.units}
              selectedTopicSlug={selectedTopicSlug}
              focusMode={focusMode}
              focusReasons={focusReasons}
              search={topicSearch}
              onSearchChange={setTopicSearch}
              onSelectTopic={(slug) => updateParam("topic", slug)}
              renderSelectedTopicDetail={(topic) => (
                <TopicDetail
                  topic={topic}
                  courseSlug={learningView.course.slug}
                  focusMode={focusMode}
                  onSelectTopic={(slug) => updateParam("topic", slug)}
                />
              )}
            />
          </div>
          <aside className="sticky top-20 hidden lg:block">
            <TopicDetail
              topic={selectedTopic}
              courseSlug={learningView.course.slug}
              focusMode={focusMode}
              onSelectTopic={(slug) => updateParam("topic", slug)}
            />
          </aside>
        </div>
      )}
    </main>
  );
}

function flattenTopics(topics: CourseLearningTopic[]): CourseLearningTopic[] {
  return topics.flatMap((topic) => [topic, ...flattenTopics(topic.children)]);
}

function parseFocusMode(value: string | null): CourseFocusMode {
  return value === "exam" || value === "essentials" || value === "full"
    ? value
    : "overview";
}

function parseWorkspaceView(value: string | null): CourseWorkspaceView {
  return value === "map" ? "map" : "outline";
}
