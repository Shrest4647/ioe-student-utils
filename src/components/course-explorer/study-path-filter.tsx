"use client";

import { BookOpen, Clock, RotateCcw, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatStudyTime,
  STUDY_PATH_OPTIONS,
  type StudyPathOption,
} from "@/hooks/use-study-path";
import { cn } from "@/lib/utils";
import type { MindmapNode, StudyPath } from "@/types/course-explorer";

// ============================================================================
// Icon Mapping
// ============================================================================

const ICON_MAP = {
  BookOpen: BookOpen,
  Target: Target,
  Zap: Zap,
};

// ============================================================================
// Types
// ============================================================================

interface StudyPathFilterProps {
  /** Current selected path */
  value: StudyPath;
  /** Callback when path changes */
  onChange: (path: StudyPath) => void;
  /** Mindmap nodes for time calculation */
  nodes?: MindmapNode[];
  /** Additional CSS classes */
  className?: string;
  /** Variant - select dropdown or button group */
  variant?: "select" | "buttons" | "compact";
  /** Whether to show the reset button */
  showReset?: boolean;
  /** Callback when reset is clicked */
  onReset?: () => void;
}

interface StudyPathBadgeProps {
  option: StudyPathOption;
  hours: number;
  topicCount: number;
  isSelected: boolean;
  onClick: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate study time for a given path
 */
function calculatePathStats(
  nodes: MindmapNode[],
  path: StudyPath,
): { hours: number; topicCount: number } {
  if (!nodes.length) {
    return { hours: 0, topicCount: 0 };
  }

  let filteredNodes = nodes;

  switch (path) {
    case "exam-prep":
      filteredNodes = nodes.filter(
        (n) => n.weightage && parseFloat(n.weightage) > 0,
      );
      break;
    case "minimum":
      filteredNodes = nodes.filter((n) => n.priority === "core");
      break;
    default:
      filteredNodes = nodes;
      break;
  }

  const hours = filteredNodes.reduce((sum, node) => sum + (node.hours || 0), 0);

  return {
    hours,
    topicCount: filteredNodes.length,
  };
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Individual study path badge/button
 */
function StudyPathBadge({
  option,
  hours,
  topicCount,
  isSelected,
  onClick,
}: StudyPathBadgeProps) {
  const Icon = ICON_MAP[option.icon as keyof typeof ICON_MAP];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
            "hover:border-primary/50 hover:bg-primary/5",
            isSelected
              ? "border-primary bg-primary/10 ring-1 ring-primary"
              : "border-border bg-card",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              option.color,
              "text-white",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium text-sm">
                {option.label}
              </span>
              {isSelected && (
                <Badge variant="default" className="h-4 px-1 text-[10px]">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatStudyTime(hours)}
              </span>
              <span>•</span>
              <span>{topicCount} topics</span>
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-medium">{option.label}</p>
        <p className="text-muted-foreground text-xs">{option.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Compact badge display for minimal UI
 */
function StudyPathCompact({
  value,
  onChange,
  nodes = [],
}: {
  value: StudyPath;
  onChange: (path: StudyPath) => void;
  nodes?: MindmapNode[];
}) {
  const currentOption =
    STUDY_PATH_OPTIONS.find((opt) => opt.value === value) ??
    STUDY_PATH_OPTIONS[0];
  const Icon = ICON_MAP[currentOption.icon as keyof typeof ICON_MAP];
  const stats = calculatePathStats(nodes, value);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value ?? "all"}
        onValueChange={(v) => onChange(v as StudyPath)}
      >
        <SelectTrigger className="w-auto gap-2">
          <Icon className="h-4 w-4" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STUDY_PATH_OPTIONS.map((option) => {
            const OptionIcon = ICON_MAP[option.icon as keyof typeof ICON_MAP];
            const optionStats = calculatePathStats(nodes, option.value);

            return (
              <SelectItem
                key={option.value}
                value={option.value ?? "all"}
                className="gap-2"
              >
                <div className="flex items-center gap-2">
                  <OptionIcon className="h-4 w-4" />
                  <span>{option.label}</span>
                  <span className="text-muted-foreground text-xs">
                    ({formatStudyTime(optionStats.hours)})
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Badge variant="secondary" className="h-6 gap-1">
        <Clock className="h-3 w-3" />
        {formatStudyTime(stats.hours)}
      </Badge>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * StudyPathFilter Component
 *
 * Provides a UI for selecting study path filters with time estimates.
 * Supports three variants: select dropdown, button group, or compact.
 *
 * Features:
 * - Displays filter options with icons and descriptions
 * - Shows estimated study time for each path
 * - Persists selection (via parent hook)
 * - Responsive design with dark mode support
 * - Accessible with keyboard navigation
 *
 * @example
 * ```tsx
 * // Select dropdown variant
 * <StudyPathFilter
 *   value={path}
 *   onChange={setPath}
 *   nodes={mindmapNodes}
 *   variant="select"
 * />
 *
 * // Button group variant
 * <StudyPathFilter
 *   value={path}
 *   onChange={setPath}
 *   nodes={mindmapNodes}
 *   variant="buttons"
 *   showReset
 *   onReset={() => setPath("all")}
 * />
 * ```
 */
export function StudyPathFilter({
  value,
  onChange,
  nodes = [],
  className,
  variant = "buttons",
  showReset = false,
  onReset,
}: StudyPathFilterProps) {
  // Compact variant
  if (variant === "compact") {
    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-2", className)}>
          <StudyPathCompact value={value} onChange={onChange} nodes={nodes} />
        </div>
      </TooltipProvider>
    );
  }

  // Select dropdown variant
  if (variant === "select") {
    const currentOption =
      STUDY_PATH_OPTIONS.find((opt) => opt.value === value) ??
      STUDY_PATH_OPTIONS[0];
    const Icon = ICON_MAP[currentOption.icon as keyof typeof ICON_MAP];

    return (
      <TooltipProvider>
        <div className={cn("flex items-center gap-2", className)}>
          <Select
            value={value ?? "all"}
            onValueChange={(v) => onChange(v as StudyPath)}
          >
            <SelectTrigger className="w-50">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <SelectValue placeholder="Select study path" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {STUDY_PATH_OPTIONS.map((option) => {
                const OptionIcon =
                  ICON_MAP[option.icon as keyof typeof ICON_MAP];
                const stats = calculatePathStats(nodes, option.value);

                return (
                  <SelectItem key={option.value} value={option.value ?? "all"}>
                    <div className="flex flex-col gap-1 py-1">
                      <div className="flex items-center gap-2">
                        <OptionIcon className="h-4 w-4" />
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {option.description} • {formatStudyTime(stats.hours)} •{" "}
                        {stats.topicCount} topics
                      </p>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {showReset && value !== "all" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onReset}
                  className="h-8 w-8"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to complete course</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Button group variant (default)
  return (
    <TooltipProvider>
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Study Path</h3>
          {showReset && value !== "all" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-7 gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset to complete course</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="grid gap-2">
          {STUDY_PATH_OPTIONS.map((option) => {
            const stats = calculatePathStats(nodes, option.value);

            return (
              <StudyPathBadge
                key={option.value}
                option={option}
                hours={stats.hours}
                topicCount={stats.topicCount}
                isSelected={value === option.value}
                onClick={() => onChange(option.value)}
              />
            );
          })}
        </div>

        <p className="text-muted-foreground text-xs">
          Select a path to filter topics based on your study goals.
        </p>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Export Types
// ============================================================================

export type { StudyPathFilterProps };
