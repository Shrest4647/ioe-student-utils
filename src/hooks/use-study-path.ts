"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { MindmapNode, StudyPath } from "@/types/course-explorer";

/**
 * LocalStorage key for persisting study path preference
 */
const STORAGE_KEY = "course-explorer:study-path";

/**
 * Study path option metadata for UI display
 */
export interface StudyPathOption {
  value: StudyPath;
  label: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Study path configuration with metadata for each option
 */
export const STUDY_PATH_OPTIONS: StudyPathOption[] = [
  {
    value: "all",
    label: "Complete Course",
    description: "All topics including optional content",
    icon: "BookOpen",
    color: "bg-primary",
  },
  {
    value: "exam-prep",
    label: "Exam Prep",
    description: "High-weightage topics for exam preparation",
    icon: "Target",
    color: "bg-destructive",
  },
  {
    value: "minimum",
    label: "Minimum Path",
    description: "Core topics only - fastest completion",
    icon: "Zap",
    color: "bg-warning",
  },
];

/**
 * Calculate estimated study time for a given study path
 *
 * @param nodes - All mindmap nodes
 * @param path - Selected study path
 * @returns Estimated hours and topic count
 */
export function calculateStudyTime(
  nodes: MindmapNode[],
  path: StudyPath,
): { hours: number; topicCount: number } {
  if (!nodes.length) {
    return { hours: 0, topicCount: 0 };
  }

  let filteredNodes = nodes;

  switch (path) {
    case "exam-prep":
      // Include topics with weightage > 0
      filteredNodes = nodes.filter(
        (n) => n.weightage && parseFloat(n.weightage) > 0,
      );
      break;
    case "minimum":
      // Include only core topics
      filteredNodes = nodes.filter((n) => n.priority === "core");
      break;
    default:
      // Include all topics
      filteredNodes = nodes;
      break;
  }

  const hours = filteredNodes.reduce((sum, node) => sum + (node.hours || 0), 0);

  return {
    hours,
    topicCount: filteredNodes.length,
  };
}

/**
 * Format hours into human-readable string
 *
 * @param hours - Number of hours
 * @returns Formatted string (e.g., "15h", "2.5h", "30 min")
 */
export function formatStudyTime(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours % 1 === 0) {
    return `${hours}h`;
  }
  return `${hours.toFixed(1)}h`;
}

/**
 * Hook for managing study path filter state
 *
 * Features:
 * - Manages current study path selection
 * - Persists selection to localStorage
 * - Calculates estimated study time based on nodes and path
 * - Provides methods to change the filter
 *
 * @param initialPath - Initial study path (defaults to "all")
 * @param nodes - Optional mindmap nodes for time calculation
 * @returns Study path state and controls
 *
 * @example
 * ```tsx
 * const { path, setPath, studyTime, options } = useStudyPath("all", nodes);
 *
 * return (
 *   <Select value={path} onValueChange={setPath}>
 *     {options.map(opt => (
 *       <SelectItem key={opt.value} value={opt.value}>
 *         {opt.label} ({formatStudyTime(calculateStudyTime(nodes, opt.value).hours)})
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */
export function useStudyPath(
  initialPath: StudyPath = "all",
  nodes: MindmapNode[] = [],
) {
  // Initialize state from localStorage or default
  const [path, setPathState] = useState<StudyPath>(() => {
    if (typeof window === "undefined") {
      return initialPath;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StudyPath;
        // Validate the stored value
        if (["all", "exam-prep", "minimum", undefined].includes(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage errors (e.g., quota exceeded)
    }

    return initialPath;
  });

  // Persist to localStorage when path changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(path));
    } catch {
      // Ignore localStorage errors
    }
  }, [path]);

  // Calculate study time based on current path and nodes
  const studyTime = useMemo(() => {
    return calculateStudyTime(nodes, path);
  }, [nodes, path]);

  // Calculate study time for all paths (for comparison)
  const allStudyTimes = useMemo(() => {
    const times: Record<string, { hours: number; topicCount: number }> = {};
    for (const option of STUDY_PATH_OPTIONS) {
      times[option.value ?? "all"] = calculateStudyTime(nodes, option.value);
    }
    return times;
  }, [nodes]);

  // Wrapper for setting path with validation
  const setPath = useCallback((newPath: StudyPath | string) => {
    const validPath =
      newPath === "exam-prep" || newPath === "minimum" || newPath === "all"
        ? newPath
        : "all";
    setPathState(validPath);
  }, []);

  // Reset to default
  const resetPath = useCallback(() => {
    setPathState(initialPath);
  }, [initialPath]);

  // Get current path option metadata
  const currentOption = useMemo(() => {
    return (
      STUDY_PATH_OPTIONS.find((opt) => opt.value === path) ??
      STUDY_PATH_OPTIONS[0]
    );
  }, [path]);

  return {
    /** Current study path */
    path,
    /** Set study path (validates input) */
    setPath,
    /** Reset to initial path */
    resetPath,
    /** Study time estimate for current path */
    studyTime,
    /** Study time estimates for all paths */
    allStudyTimes,
    /** All available path options with metadata */
    options: STUDY_PATH_OPTIONS,
    /** Current path option metadata */
    currentOption,
    /** Whether a non-default path is selected */
    isFiltered: path !== "all",
  };
}

/**
 * Hook for study path without node data (lightweight version)
 *
 * Use this when you don't need time calculations, just state management.
 *
 * @param initialPath - Initial study path (defaults to "all")
 * @returns Study path state and controls
 */
export function useStudyPathSimple(initialPath: StudyPath = "all") {
  const [path, setPathState] = useState<StudyPath>(() => {
    if (typeof window === "undefined") {
      return initialPath;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StudyPath;
        if (["all", "exam-prep", "minimum", undefined].includes(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }

    return initialPath;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(path));
    } catch {
      // Ignore errors
    }
  }, [path]);

  const setPath = useCallback((newPath: StudyPath | string) => {
    const validPath =
      newPath === "exam-prep" || newPath === "minimum" || newPath === "all"
        ? newPath
        : "all";
    setPathState(validPath);
  }, []);

  const resetPath = useCallback(() => {
    setPathState(initialPath);
  }, [initialPath]);

  const currentOption = useMemo(() => {
    return (
      STUDY_PATH_OPTIONS.find((opt) => opt.value === path) ??
      STUDY_PATH_OPTIONS[0]
    );
  }, [path]);

  return {
    path,
    setPath,
    resetPath,
    options: STUDY_PATH_OPTIONS,
    currentOption,
    isFiltered: path !== "all",
  };
}
