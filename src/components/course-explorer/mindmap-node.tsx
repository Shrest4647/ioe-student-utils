"use client";

import { Handle, Position } from "@xyflow/react";
import {
  BarChart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MindmapNodeData } from "@/types/course-explorer";

interface MindmapNodeProps {
  data: MindmapNodeData & {
    onToggleExpand?: (id: string) => void;
    isExpanded?: boolean;
    hasChildren?: boolean;
    isRoot?: boolean;
  };
  selected?: boolean;
}

export function MindmapNode({ data, selected }: MindmapNodeProps) {
  const priorityColors = {
    core: "border-emerald-300 bg-linear-to-br from-emerald-50/90 to-emerald-100/60 text-emerald-900 dark:border-emerald-700 dark:from-emerald-500/15 dark:to-emerald-500/5 dark:text-emerald-300",
    important:
      "border-blue-300 bg-linear-to-br from-blue-50/90 to-blue-100/60 text-blue-900 dark:border-blue-700 dark:from-blue-500/15 dark:to-blue-500/5 dark:text-blue-300",
    optional:
      "border-slate-300 bg-linear-to-br from-slate-50/90 to-slate-100/70 text-slate-700 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900/60 dark:text-slate-300",
  };

  const priorityDotColors = {
    core: "bg-emerald-500",
    important: "bg-blue-500",
    optional: "bg-slate-400 dark:bg-slate-500",
  };

  const priority = data.priority ?? "optional";

  return (
    <div
      className={cn(
        "group relative flex min-w-[220px] max-w-[340px] cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:shadow-indigo-500/5",
        priorityColors[priority],
        selected
          ? "scale-105 ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950"
          : "hover:border-primary/40",
      )}
    >
      {/* Inputs/Outputs for React Flow */}
      <Handle
        type="target"
        position={Position.Left}
        className="border-none! bg-muted-foreground! p-0"
        style={{ left: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="border-none! bg-muted-foreground! p-0"
        style={{ right: 0 }}
      />

      <div className="flex flex-1 flex-col gap-1 pr-6">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              priorityDotColors[priority],
            )}
          />
          <span className="text-left font-bold text-sm leading-tight tracking-wide">
            {data.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
          {data.hours > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{data.hours}h</span>
            </div>
          )}
          {data.weightage && (
            <div className="flex items-center gap-1">
              <BarChart className="h-3 w-3" />
              <span>{data.weightage}%</span>
            </div>
          )}
          {data.resourceCount > 0 && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              <span>{data.resourceCount} resources</span>
            </div>
          )}
        </div>

        {/* Hover detail - Description */}
        {data.description && (
          <div className="mt-2 max-h-0 overflow-hidden text-[11px] text-slate-600 leading-relaxed transition-all duration-300 group-hover:max-h-24 dark:text-slate-400">
            <p className="border-slate-200/80 border-t pt-2 italic dark:border-slate-700/60">
              {data.description.length > 100
                ? `${data.description.substring(0, 100)}...`
                : data.description}
            </p>
          </div>
        )}
      </div>

      {/* External Toggle Button */}
      {data.hasChildren && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.(data.id);
          }}
          className={cn(
            "absolute top-1/2 right-5 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm transition-all hover:scale-110",
            "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900",
            "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100",
            data.isExpanded ? "-rotate-180" : "",
          )}
        >
          {data.isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}
