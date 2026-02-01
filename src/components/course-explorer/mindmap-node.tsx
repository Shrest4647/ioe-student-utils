"use client";

import { Handle, type NodeProps, Position } from "@xyflow/react";
import { AlertCircle, BookOpen, Clock, Star } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { MindmapNodeData, PriorityLevel } from "@/types/course-explorer";

/**
 * Priority configuration with colors and icons
 */
const priorityConfig: Record<
  PriorityLevel,
  {
    color: string;
    borderColor: string;
    bgColor: string;
    icon: typeof Star;
    label: string;
  }
> = {
  core: {
    color: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500 dark:border-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    icon: Star,
    label: "Core",
  },
  important: {
    color: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-500 dark:border-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    icon: AlertCircle,
    label: "Important",
  },
  optional: {
    color: "text-slate-600 dark:text-slate-400",
    borderColor: "border-slate-400 dark:border-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-900/50",
    icon: BookOpen,
    label: "Optional",
  },
};

/**
 * Custom node component for React Flow mindmap
 *
 * Displays course topics with:
 * - Priority-based styling (core, important, optional)
 * - Hours and weightage information
 * - Resource count indicator
 * - Hover and selection states
 */
export const MindmapNode = memo(function MindmapNode(props: NodeProps) {
  const data = props.data as MindmapNodeData;
  const selected = props.selected;
  const config = priorityConfig[data.priority];
  const Icon = config.icon;

  const hasWeightage = data.weightage && parseFloat(data.weightage) > 0;
  const weightageValue = hasWeightage
    ? parseFloat(data.weightage as string)
    : 0;

  return (
    <div
      className={cn(
        "group relative min-w-45 max-w-60 rounded-lg border-2 bg-card p-3 shadow-sm transition-all duration-200",
        "hover:scale-[1.02] hover:shadow-md",
        config.borderColor,
        config.bgColor,
        selected && "scale-[1.02] shadow-lg ring-2 ring-primary ring-offset-2",
      )}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="h-3! w-3! border-2! bg-background!"
      />

      {/* Header with icon and priority */}
      <div className="mb-2 flex items-start gap-2">
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            config.bgColor,
            config.color,
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-foreground text-sm leading-tight">
            {data.label}
          </h3>
          <span className={cn("text-xs", config.color)}>{config.label}</span>
        </div>
      </div>

      {/* Description (if available) */}
      {data.description && (
        <p className="mb-2 line-clamp-2 text-muted-foreground text-xs">
          {data.description}
        </p>
      )}

      {/* Unit name */}
      <p className="mb-2 truncate text-muted-foreground/70 text-xs">
        {data.unitName}
      </p>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-muted-foreground text-xs">
        {/* Hours */}
        {data.hours > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{data.hours}h</span>
          </div>
        )}

        {/* Weightage */}
        {hasWeightage && (
          <div className="flex items-center gap-1">
            <span className="font-medium">{weightageValue}%</span>
          </div>
        )}

        {/* Resource count */}
        {data.resourceCount > 0 && (
          <div className="ml-auto flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>{data.resourceCount}</span>
          </div>
        )}
      </div>

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3! w-3! border-2! bg-background!"
      />
    </div>
  );
});

/**
 * Compact node variant for dense mindmaps
 */
export const MindmapNodeCompact = memo(function MindmapNodeCompact(
  props: NodeProps,
) {
  const data = props.data as MindmapNodeData;
  const selected = props.selected;
  const config = priorityConfig[data.priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2 rounded-full border-2 bg-card px-3 py-1.5 shadow-sm transition-all duration-200",
        "hover:shadow-md",
        config.borderColor,
        config.bgColor,
        selected && "shadow-lg ring-2 ring-primary ring-offset-2",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-2.5! w-2.5! border-2! bg-background!"
      />

      <Icon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />

      <span className="whitespace-nowrap font-medium text-foreground text-xs">
        {data.label}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2.5! w-2.5! border-2! bg-background!"
      />
    </div>
  );
});

/**
 * Unit group node for clustering topics by unit
 */
export const MindmapUnitNode = memo(function MindmapUnitNode(props: NodeProps) {
  const data = props.data as MindmapNodeData;
  const selected = props.selected;

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-border border-dashed bg-muted/30 p-4",
        selected && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="h-3! w-3! border-2! bg-background!"
      />

      <div className="text-center">
        <h3 className="font-bold text-foreground text-sm">{data.label}</h3>
        <p className="mt-1 text-muted-foreground text-xs">{data.unitName}</p>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3! w-3! border-2! bg-background!"
      />
    </div>
  );
});
