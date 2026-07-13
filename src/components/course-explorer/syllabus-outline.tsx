"use client";

import { BookOpen, ChevronDown, Clock3, Link2, Search } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CourseFocusMode,
  CourseLearningTopic,
  CourseLearningUnit,
  TopicFocusReason,
} from "@/types/course-learning";

interface SyllabusOutlineProps {
  units: CourseLearningUnit[];
  selectedTopicSlug?: string;
  focusMode: CourseFocusMode;
  focusReasons: Map<string, TopicFocusReason>;
  search: string;
  onSearchChange: (search: string) => void;
  onSelectTopic: (slug: string) => void;
  renderSelectedTopicDetail?: (topic: CourseLearningTopic) => ReactNode;
}

export function SyllabusOutline({
  units,
  selectedTopicSlug,
  focusMode,
  focusReasons,
  search,
  onSearchChange,
  onSelectTopic,
  renderSelectedTopicDetail,
}: SyllabusOutlineProps) {
  const normalizedSearch = search.trim().toLowerCase();
  const visibleUnits = units
    .map((unit) => ({
      ...unit,
      topics: filterTopicTree(unit.topics, normalizedSearch),
    }))
    .filter(
      (unit) =>
        unit.topics.length > 0 ||
        unit.name.toLowerCase().includes(normalizedSearch),
    );

  return (
    <section aria-labelledby="syllabus-heading">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="syllabus-heading" className="font-semibold text-xl">
            Syllabus outline
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Topics follow their academic unit and parent-topic structure.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Find a topic in this course"
            aria-label="Find a topic in this course"
            className="pl-9"
          />
        </div>
      </div>

      {visibleUnits.length > 0 ? (
        <div className="divide-y">
          {visibleUnits.map((unit, index) => (
            <UnitDisclosure
              key={unit.id}
              unit={unit}
              initiallyOpen={index < 2}
              forceOpen={!!normalizedSearch}
              selectedTopicSlug={selectedTopicSlug}
              focusMode={focusMode}
              focusReasons={focusReasons}
              onSelectTopic={onSelectTopic}
              renderSelectedTopicDetail={renderSelectedTopicDetail}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 font-medium">No topics match this search</p>
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="mt-2 text-primary text-sm hover:underline"
          >
            Clear topic search
          </button>
        </div>
      )}
    </section>
  );
}

function UnitDisclosure({
  unit,
  initiallyOpen,
  forceOpen,
  selectedTopicSlug,
  focusMode,
  focusReasons,
  onSelectTopic,
  renderSelectedTopicDetail,
}: {
  unit: CourseLearningUnit;
  initiallyOpen: boolean;
  forceOpen: boolean;
  selectedTopicSlug?: string;
  focusMode: CourseFocusMode;
  focusReasons: Map<string, TopicFocusReason>;
  onSelectTopic: (slug: string) => void;
  renderSelectedTopicDetail?: (topic: CourseLearningTopic) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen || forceOpen);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="group flex cursor-pointer list-none items-start justify-between gap-4 py-5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{unit.name}</span>
            <Badge variant="outline">
              {unit.topicCount} topic{unit.topicCount === 1 ? "" : "s"}
            </Badge>
          </div>
          {unit.description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-muted-foreground text-sm">
              {unit.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-muted-foreground text-xs">
          {unit.estimatedHours > 0 && (
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <Clock3 className="size-3.5" />
              {unit.estimatedHours}h
            </span>
          )}
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </div>
      </summary>

      <div className="pb-5">
        <div className="overflow-hidden rounded-lg border">
          {unit.topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              depth={0}
              selectedTopicSlug={selectedTopicSlug}
              focusMode={focusMode}
              focusReasons={focusReasons}
              onSelectTopic={onSelectTopic}
              renderSelectedTopicDetail={renderSelectedTopicDetail}
            />
          ))}
        </div>
      </div>
    </details>
  );
}

function TopicRow({
  topic,
  depth,
  selectedTopicSlug,
  focusMode,
  focusReasons,
  onSelectTopic,
  renderSelectedTopicDetail,
}: {
  topic: CourseLearningTopic;
  depth: number;
  selectedTopicSlug?: string;
  focusMode: CourseFocusMode;
  focusReasons: Map<string, TopicFocusReason>;
  onSelectTopic: (slug: string) => void;
  renderSelectedTopicDetail?: (topic: CourseLearningTopic) => ReactNode;
}) {
  const focusReason = focusReasons.get(topic.slug);
  const focusActive = focusMode === "exam" || focusMode === "essentials";
  const isSelected = selectedTopicSlug === topic.slug;

  return (
    <div className={cn("not-last:border-b", depth > 0 && "bg-muted/20")}>
      <button
        type="button"
        onClick={() => onSelectTopic(topic.slug)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60",
          isSelected && "bg-primary/8 ring-1 ring-primary/30 ring-inset",
          focusActive && !focusReason && "text-muted-foreground",
        )}
        style={{ paddingLeft: `${1 + depth * 1.25}rem` }}
        aria-current={isSelected ? "true" : undefined}
      >
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/40",
            topic.priority === "core" && "bg-primary",
            topic.priority === "important" && "bg-foreground/60",
          )}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-sm">{topic.name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
            <span className="capitalize">{topic.priority}</span>
            {topic.hours > 0 && <span>{topic.hours}h estimate</span>}
            {topic.weightage !== null && <span>{topic.weightage}% weight</span>}
            {topic.prerequisites.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Link2 className="size-3" />
                {topic.prerequisites.length} prerequisite
                {topic.prerequisites.length === 1 ? "" : "s"}
              </span>
            )}
          </span>
          {focusReason && (
            <span className="mt-1.5 block font-medium text-primary text-xs">
              {focusReason.reason}
            </span>
          )}
        </span>
        {topic.resourceCount > 0 && (
          <Badge variant="outline" className="mt-0.5">
            {topic.resourceCount} resource{topic.resourceCount === 1 ? "" : "s"}
          </Badge>
        )}
      </button>
      {isSelected && renderSelectedTopicDetail && (
        <div className="px-4 lg:hidden">{renderSelectedTopicDetail(topic)}</div>
      )}
      {topic.children.map((child) => (
        <TopicRow
          key={child.id}
          topic={child}
          depth={depth + 1}
          selectedTopicSlug={selectedTopicSlug}
          focusMode={focusMode}
          focusReasons={focusReasons}
          onSelectTopic={onSelectTopic}
          renderSelectedTopicDetail={renderSelectedTopicDetail}
        />
      ))}
    </div>
  );
}

function filterTopicTree(
  topics: CourseLearningTopic[],
  search: string,
): CourseLearningTopic[] {
  if (!search) return topics;

  return topics.flatMap((topic) => {
    const children = filterTopicTree(topic.children, search);
    const matches =
      topic.name.toLowerCase().includes(search) ||
      topic.description?.toLowerCase().includes(search);
    return matches || children.length > 0 ? [{ ...topic, children }] : [];
  });
}
