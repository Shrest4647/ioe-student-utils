"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "@xyflow/react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import type { DependencyType, MindmapEdgeData } from "@/types/course-explorer";

/**
 * Edge type configuration
 */
const edgeConfig: Record<
  DependencyType,
  {
    color: string;
    strokeWidth: number;
    label: string;
    dashArray?: string;
  }
> = {
  strong: {
    color: "stroke-red-500 dark:stroke-red-400",
    strokeWidth: 3,
    label: "Required",
  },
  weak: {
    color: "stroke-slate-400 dark:stroke-slate-500",
    strokeWidth: 2,
    label: "Recommended",
    dashArray: "5,5",
  },
};

/**
 * Custom edge component for prerequisite relationships
 *
 * Features:
 * - Different styles for strong vs weak dependencies
 * - Animated flow effect for strong dependencies
 * - Hover states and labels
 */
export const MindmapEdge = memo(function MindmapEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  } = props;

  const edgeData = data as MindmapEdgeData | undefined;
  const dependencyType = edgeData?.type || "weak";
  const config = edgeConfig[dependencyType];

  // Use smooth step path for better routing
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          "transition-all duration-200",
          config.color,
          selected && "stroke-primary",
        )}
        style={{
          strokeWidth: config.strokeWidth,
          strokeDasharray: config.dashArray,
        }}
      />

      {/* Animated flow effect for strong dependencies */}
      {dependencyType === "strong" && (
        <BaseEdge
          id={`${id}-animated`}
          path={edgePath}
          className={cn("opacity-50", config.color)}
          style={{
            strokeWidth: config.strokeWidth - 1,
            strokeDasharray: "10,10",
            animation: "flow 1s linear infinite",
          }}
        />
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          className={cn(
            "nodrag nopan pointer-events-auto absolute rounded-full px-2 py-0.5 font-medium text-xs",
            "border border-border bg-background shadow-sm",
            "opacity-0 transition-opacity duration-200 hover:opacity-100",
            selected && "opacity-100",
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          {config.label}
        </div>
      </EdgeLabelRenderer>

      {/* CSS animation for flow effect */}
      <style jsx>{`
        @keyframes flow {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </>
  );
});

/**
 * Simple straight edge variant
 */
export const MindmapEdgeStraight = memo(function MindmapEdgeStraight(
  props: EdgeProps,
) {
  const { id, sourceX, sourceY, targetX, targetY, data, selected } = props;

  const edgeData = data as MindmapEdgeData | undefined;
  const dependencyType = edgeData?.type || "weak";
  const config = edgeConfig[dependencyType];

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={cn(
        "transition-all duration-200",
        config.color,
        selected && "stroke-primary",
      )}
      style={{
        strokeWidth: config.strokeWidth,
        strokeDasharray: config.dashArray,
      }}
    />
  );
});

/**
 * Bezier curve edge variant
 */
export const MindmapEdgeBezier = memo(function MindmapEdgeBezier(
  props: EdgeProps,
) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  } = props;

  const edgeData = data as MindmapEdgeData | undefined;
  const dependencyType = edgeData?.type || "weak";
  const config = edgeConfig[dependencyType];

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.5,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={cn(
        "transition-all duration-200",
        config.color,
        selected && "stroke-primary",
      )}
      style={{
        strokeWidth: config.strokeWidth,
        strokeDasharray: config.dashArray,
      }}
    />
  );
});
