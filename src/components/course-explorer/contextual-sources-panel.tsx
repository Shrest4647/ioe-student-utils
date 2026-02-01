"use client";

import {
  BookOpen,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  Layers,
  Lightbulb,
  Link2,
  ListTodo,
  Target,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatHours,
  formatWeightage,
  getPriorityBadgeVariant,
  getRelevanceBadgeVariant,
  groupResourcesByRelevance,
  type TopicDetails,
} from "@/hooks/use-topic-details";
import { cn } from "@/lib/utils";
import type { ResourceRelevance } from "@/types/course-explorer";

// ============================================================================
// Types
// ============================================================================

/**
 * Props for the ContextualSourcesPanel component
 */
export interface ContextualSourcesPanelProps {
  /** Topic details data */
  topic: TopicDetails | null;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Callback when panel is closed */
  onClose?: () => void;
  /** Whether the panel is open (for mobile drawer) */
  isOpen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Resource Icon Component
// ============================================================================

/**
 * Get the appropriate icon for a resource based on its type
 */
function ResourceIcon({ className }: { className?: string }) {
  // For now, use a generic file icon since resource type isn't in the schema
  return <FileText className={cn("h-4 w-4", className)} />;
}

// ============================================================================
// Resource Card Component
// ============================================================================

/**
 * Individual resource card showing title, description, and relevance
 */
function ResourceCard({
  title,
  description,
  s3Url,
  relevance,
  viewCount,
}: {
  title: string;
  description: string | null;
  s3Url: string | null;
  relevance: ResourceRelevance;
  viewCount: number;
}) {
  const relevanceLabels: Record<ResourceRelevance, string> = {
    primary: "Primary",
    supplementary: "Supplementary",
    practice: "Practice",
  };

  const cardContent = (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <ResourceIcon className="text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-medium text-sm">{title}</h4>
          <Badge
            variant={getRelevanceBadgeVariant(relevance)}
            className="text-[10px]"
          >
            {relevanceLabels[relevance]}
          </Badge>
        </div>
        {description && (
          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
            {description}
          </p>
        )}
        {viewCount > 0 && (
          <p className="mt-1 text-muted-foreground text-xs">
            {viewCount} view{viewCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );

  if (s3Url) {
    return (
      <a
        href={s3Url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <div className="block rounded-lg border border-border bg-card p-3 opacity-70">
      {cardContent}
    </div>
  );
}

// ============================================================================
// Resource Section Component
// ============================================================================

/**
 * Section displaying resources grouped by relevance
 */
function ResourceSection({
  title,
  icon: Icon,
  resources,
  emptyMessage,
}: {
  title: string;
  icon: React.ElementType;
  resources: Array<{
    resource: {
      id: string;
      title: string;
      description: string | null;
      s3Url: string | null;
      viewCount: number;
    };
    relevance: ResourceRelevance;
  }>;
  emptyMessage?: string;
}) {
  if (resources.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 font-medium text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h4>
        <p className="text-muted-foreground text-xs">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-medium text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
        <span className="text-muted-foreground text-xs">
          ({resources.length})
        </span>
      </h4>
      <div className="space-y-2">
        {resources.map(({ resource, relevance }) => (
          <ResourceCard
            key={resource.id}
            title={resource.title}
            description={resource.description}
            s3Url={resource.s3Url}
            relevance={relevance}
            viewCount={resource.viewCount}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Prerequisites Section Component
// ============================================================================

/**
 * Section displaying prerequisite topics
 */
function PrerequisitesSection({
  prerequisites,
}: {
  prerequisites: Array<{
    prerequisiteTopic: {
      id: string;
      slug: string;
      name: string;
      priorityLevel: "core" | "important" | "optional";
    };
    dependencyType: "strong" | "weak";
  }>;
}) {
  if (prerequisites.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-medium text-sm">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        Prerequisites
        <span className="text-muted-foreground text-xs">
          ({prerequisites.length})
        </span>
      </h4>
      <div className="space-y-2">
        {prerequisites.map(({ prerequisiteTopic }) => (
          <Link
            key={prerequisiteTopic.id}
            href={`/course-explorer/topic/${prerequisiteTopic.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-sm">
                  {prerequisiteTopic.name}
                </span>
                <Badge
                  variant={getPriorityBadgeVariant(
                    prerequisiteTopic.priorityLevel,
                  )}
                  className="text-[10px]"
                >
                  {prerequisiteTopic.priorityLevel}
                </Badge>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Related Topics Section Component
// ============================================================================

/**
 * Section displaying child/related topics
 */
function RelatedTopicsSection({
  children,
  parentTopic,
}: {
  children: Array<{
    id: string;
    slug: string;
    name: string;
    priorityLevel: "core" | "important" | "optional";
  }>;
  parentTopic: { id: string; slug: string; name: string } | null;
}) {
  if (children.length === 0 && !parentTopic) return null;

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 font-medium text-sm">
        <Layers className="h-4 w-4 text-muted-foreground" />
        Related Topics
      </h4>
      <div className="space-y-2">
        {parentTopic && (
          <Link
            href={`/course-explorer/topic/${parentTopic.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-muted-foreground text-xs">
                Parent Topic
              </span>
              <p className="truncate font-medium text-sm">{parentTopic.name}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
        {children.map((child) => (
          <Link
            key={child.id}
            href={`/course-explorer/topic/${child.slug}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-sm">
                  {child.name}
                </span>
                <Badge
                  variant={getPriorityBadgeVariant(child.priorityLevel)}
                  className="text-[10px]"
                >
                  {child.priorityLevel}
                </Badge>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Topic Header Component
// ============================================================================

/**
 * Header section showing topic title, description, and metadata
 */
function TopicHeader({ topic }: { topic: TopicDetails }) {
  const weightageDisplay = formatWeightage(topic.weightage);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-xl leading-tight">{topic.name}</h2>
          <Badge variant={getPriorityBadgeVariant(topic.priorityLevel)}>
            {topic.priorityLevel}
          </Badge>
        </div>
        {topic.description && (
          <p className="mt-2 text-muted-foreground text-sm">
            {topic.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatHours(topic.hours)}</span>
        </div>
        {weightageDisplay && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Target className="h-3.5 w-3.5" />
            <span>{weightageDisplay} weightage</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{topic.unit.name}</span>
        </div>
      </div>

      <Separator />
    </div>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

/**
 * Skeleton loader for the panel
 */
function PanelSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>

      <Separator />

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

/**
 * Empty state when no topic is selected
 */
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-medium text-lg">Select a Topic</h3>
      <p className="mt-2 max-w-xs text-muted-foreground text-sm">
        Click on any topic in the mindmap to view its details, resources, and
        prerequisites.
      </p>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ContextualSourcesPanel Component
 *
 * A slide-out panel that displays detailed information about a selected topic,
 * including its description, resources grouped by relevance, prerequisites,
 * and related topics.
 *
 * Features:
 * - Displays topic details (title, description, hours, weightage)
 * - Groups resources by relevance (primary, supplementary, practice)
 * - Shows prerequisites with links
 * - Shows related/child topics
 * - Responsive design with scrollable content
 * - Loading and empty states
 * - Dark mode support via Tailwind semantic classes
 *
 * @example
 * ```tsx
 * <ContextualSourcesPanel
 *   topic={topicData}
 *   isLoading={isLoading}
 *   onClose={() => setSelectedTopic(null)}
 * />
 * ```
 */
export function ContextualSourcesPanel({
  topic,
  isLoading,
  onClose,
  className,
}: ContextualSourcesPanelProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "h-full w-full border-border border-l bg-background",
          className,
        )}
      >
        <ScrollArea className="h-full">
          <PanelSkeleton />
        </ScrollArea>
      </div>
    );
  }

  if (!topic) {
    return (
      <div
        className={cn(
          "h-full w-full border-border border-l bg-background",
          className,
        )}
      >
        <EmptyState />
      </div>
    );
  }

  const groupedResources = groupResourcesByRelevance(topic.resources);

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col border-border border-l bg-background",
        className,
      )}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <span className="font-medium text-sm">Topic Details</span>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close panel</span>
          </Button>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 p-6"
          >
            <TopicHeader topic={topic} />

            {/* Resources Section */}
            <div className="space-y-6">
              <ResourceSection
                title="Primary Resources"
                icon={BookOpen}
                resources={groupedResources.primary}
                emptyMessage="No primary resources available for this topic."
              />

              {groupedResources.supplementary.length > 0 && (
                <ResourceSection
                  title="Supplementary Materials"
                  icon={ExternalLink}
                  resources={groupedResources.supplementary}
                />
              )}

              {groupedResources.practice.length > 0 && (
                <ResourceSection
                  title="Practice Materials"
                  icon={Target}
                  resources={groupedResources.practice}
                />
              )}
            </div>

            {/* Prerequisites Section */}
            {topic.prerequisites.length > 0 && (
              <>
                <Separator />
                <PrerequisitesSection prerequisites={topic.prerequisites} />
              </>
            )}

            {/* Related Topics Section */}
            {(topic.children.length > 0 || topic.parentTopic) && (
              <>
                <Separator />
                <RelatedTopicsSection parentTopic={topic.parentTopic}>
                  {topic.children}
                </RelatedTopicsSection>
              </>
            )}

            {/* Course Context */}
            <Separator />
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="mb-2 font-medium text-sm">Course Context</h4>
              <div className="space-y-1 text-muted-foreground text-xs">
                <p>
                  <span className="font-medium">Course:</span>{" "}
                  <Link
                    href={`/course-explorer/${topic.unit.course.slug}`}
                    className="text-primary hover:underline"
                  >
                    {topic.unit.course.name}
                  </Link>
                </p>
                <p>
                  <span className="font-medium">Unit:</span> {topic.unit.name}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// Mobile Drawer Variant
// ============================================================================

/**
 * Mobile drawer version of the panel using Dialog
 */
export function ContextualSourcesDrawer({
  topic,
  isLoading,
  isOpen,
  onClose,
}: ContextualSourcesPanelProps & { isOpen: boolean }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg rounded-t-xl bg-background shadow-xl sm:rounded-xl"
        style={{ maxHeight: "85vh" }}
      >
        {/* Handle bar for mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-muted" />
        </div>

        <ContextualSourcesPanel
          topic={topic}
          isLoading={isLoading}
          onClose={onClose}
          className="rounded-t-xl border-l-0 sm:rounded-xl"
        />
      </motion.div>
    </div>
  );
}
