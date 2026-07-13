"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  CalendarPlus,
  FileText,
  Layers3,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  CourseFocusMode,
  CourseLearningTopic,
  TopicDetailResource,
} from "@/types/course-learning";

interface TopicResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    description: string | null;
    resources: Array<{
      relevance: "primary" | "supplementary" | "practice";
      resource: Omit<TopicDetailResource, "relevance"> | null;
    }>;
  };
}

export function TopicDetail({
  topic,
  courseSlug,
  focusMode,
  onSelectTopic,
}: {
  topic?: CourseLearningTopic;
  courseSlug: string;
  focusMode: CourseFocusMode;
  onSelectTopic?: (slug: string) => void;
}) {
  const detailId = useId();
  const { data, isLoading, error } = useQuery({
    queryKey: ["course-topic-detail", topic?.slug],
    queryFn: async () => {
      if (!topic) return null;
      const response = await fetch(
        `/api/course-explorer/topics/slug/${encodeURIComponent(topic.slug)}`,
      );
      if (!response.ok) throw new Error("Failed to load topic resources");
      return (await response.json()) as TopicResponse;
    },
    enabled: !!topic,
    staleTime: 5 * 60 * 1000,
  });

  if (!topic) {
    return (
      <div className="border-y py-8 lg:border lg:p-6">
        <BookOpen className="size-6 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">Choose a topic</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Select a topic to review its prerequisites and open study resources.
        </p>
      </div>
    );
  }

  const resources =
    data?.data.resources.flatMap((item) =>
      item.resource
        ? [
            {
              ...item.resource,
              relevance: item.relevance,
            } satisfies TopicDetailResource,
          ]
        : [],
    ) ?? [];
  const plannerParams = new URLSearchParams({
    course: courseSlug,
    topics: topic.slug,
    focus: focusMode,
  });

  return (
    <article className="border-y py-6 lg:rounded-lg lg:border lg:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {topic.priority}
        </Badge>
        {topic.weightage !== null && (
          <Badge variant="secondary">{topic.weightage}% exam weight</Badge>
        )}
      </div>
      <h2 className="mt-4 font-semibold text-2xl tracking-tight">
        {topic.name}
      </h2>
      {topic.description ? (
        <p className="mt-3 text-muted-foreground text-sm leading-6">
          {topic.description}
        </p>
      ) : (
        <p className="mt-3 text-muted-foreground text-sm">
          No topic description has been published yet.
        </p>
      )}

      {topic.prerequisites.length > 0 && (
        <section
          className="mt-6"
          aria-labelledby={`${detailId}-prerequisites-heading`}
        >
          <h3
            id={`${detailId}-prerequisites-heading`}
            className="flex items-center gap-2 font-semibold text-sm"
          >
            <Link2 className="size-4 text-primary" />
            Prerequisites
          </h3>
          <ul className="mt-3 space-y-2">
            {topic.prerequisites.map((prerequisite) => (
              <li key={prerequisite.id} className="text-sm">
                {onSelectTopic ? (
                  <button
                    type="button"
                    onClick={() => onSelectTopic(prerequisite.slug)}
                    className="group text-left outline-none hover:text-primary focus-visible:text-primary"
                  >
                    <span className="font-medium group-hover:underline">
                      {prerequisite.name}
                    </span>
                    <span className="ml-2 text-muted-foreground capitalize">
                      {prerequisite.dependencyType}
                    </span>
                  </button>
                ) : (
                  <>
                    <span className="font-medium">{prerequisite.name}</span>
                    <span className="ml-2 text-muted-foreground capitalize">
                      {prerequisite.dependencyType}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        className="mt-7 border-t pt-6"
        aria-labelledby={`${detailId}-resources-heading`}
      >
        <div className="flex items-center justify-between gap-4">
          <h3
            id={`${detailId}-resources-heading`}
            className="font-semibold text-sm"
          >
            Resources
          </h3>
          <span className="text-muted-foreground text-xs">
            {topic.resourceCount} linked
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : error ? (
          <p className="mt-4 text-destructive text-sm">
            Resources could not be loaded. Try selecting the topic again.
          </p>
        ) : resources.length > 0 ? (
          <ul className="mt-4 divide-y border-y">
            {resources.map((resource) => (
              <li key={resource.id}>
                <a
                  href={resource.s3Url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 py-4 outline-none hover:text-primary focus-visible:text-primary"
                >
                  <FileText className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-sm">
                      {resource.title}
                    </span>
                    <span className="mt-1 block text-muted-foreground text-xs capitalize">
                      {resource.relevance}
                    </span>
                  </span>
                  <ArrowUpRight className="size-4 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-muted-foreground text-sm">
            No resources are linked to this topic yet.
          </p>
        )}
      </section>

      <Button asChild className="mt-6 w-full">
        <Link href={`/study-planner?${plannerParams}`}>
          <CalendarPlus className="size-4" />
          Add topic to study plan
        </Link>
      </Button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/quiz?q=${encodeURIComponent(topic.name)}`}>
            <Brain className="size-4" />
            Find a quiz
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/flashcards?q=${encodeURIComponent(topic.name)}`}>
            <Layers3 className="size-4" />
            Find flashcards
          </Link>
        </Button>
      </div>
    </article>
  );
}
