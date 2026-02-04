"use client";

import { useQuery } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import { AlertCircle, BookOpen, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/eden";
import type { MindmapNodeData } from "@/types/course-explorer";
import { MindmapView } from "./MindmapView";
import { SourcesPanel } from "./SourcesPanel";

interface CourseExplorerProps {
  courseSlug: string;
}

export function CourseExplorer({ courseSlug }: CourseExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [selectedNode, setSelectedNode] = useState<Node<MindmapNodeData>>();

  const {
    data: mindmapData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mindmap", courseSlug, selectedPath],
    queryFn: async () => {
      const response = await apiClient.api["course-explorer"].courses
        .slug({ slug: courseSlug })
        .mindmap.get({
          query: {
            path: selectedPath as "minimum" | "exam-prep" | "all",
          },
        });
      return response.data?.data;
    },
  });

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground text-sm">
            Loading course...
          </p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">Failed to load course</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!mindmapData || !mindmapData.nodes || mindmapData.nodes.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">No topics found</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            This course doesn't have any topics yet, or it may not exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
          >
            Browse All Courses
          </Link>
        </div>
      </div>
    );
  }

  // Group nodes by unit for better layout
  const nodesByUnit = new Map<string, typeof mindmapData.nodes>();
  (mindmapData?.nodes || []).forEach((node) => {
    const unitName = node.unitName || "Other";
    if (!nodesByUnit.has(unitName)) {
      nodesByUnit.set(unitName, []);
    }
    nodesByUnit.get(unitName)?.push(node);
  });

  // Create hierarchical layout with units as columns
  const nodes: Node<MindmapNodeData>[] = [];
  const unitNames = Array.from(nodesByUnit.keys()).sort();
  const columnWidth = 280;
  const rowHeight = 100;

  unitNames.forEach((unitName, unitIndex) => {
    const unitNodes = nodesByUnit.get(unitName)!;
    unitNodes.forEach((node, nodeIndex) => {
      nodes.push({
        id: node.id,
        data: {
          id: node.id,
          label: node.label,
          slug: node.slug,
          priority: node.priority as "core" | "important" | "optional",
          hours: node.hours,
          weightage: node.weightage,
          description: node.description,
          unitName: node.unitName,
          resourceCount: node.resources?.length ?? 0,
          level: node.level,
        } as MindmapNodeData,
        position: {
          x: unitIndex * columnWidth + 50,
          y: nodeIndex * rowHeight + 100,
        },
      });
    });
  });

  const edges: Edge[] = (mindmapData?.edges || []).map((e: any) => ({
    id: `${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
    type: e.type === "strong" ? "smoothstep" : "default",
    animated: e.type === "strong",
    style: { stroke: e.type === "strong" ? "#ef4444" : "#94a3b8" },
  }));

  return (
    <div className="flex h-screen">
      {/* Study Path Selector */}
      <div className="w-64 border-r p-4">
        <h2 className="mb-4 font-semibold">Study Paths</h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSelectedPath(undefined)}
            className={`w-full rounded px-3 py-2 text-left ${
              !selectedPath ? "bg-primary text-white" : "hover:bg-gray-100"
            }`}
          >
            All Topics
          </button>
          <button
            type="button"
            onClick={() => setSelectedPath("exam-prep")}
            className={`w-full rounded px-3 py-2 text-left ${
              selectedPath === "exam-prep"
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Exam Prep
          </button>
          <button
            type="button"
            onClick={() => setSelectedPath("minimum")}
            className={`w-full rounded px-3 py-2 text-left ${
              selectedPath === "minimum"
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Minimum Passing
          </button>
          <button
            type="button"
            onClick={() => setSelectedPath("mastery")}
            className={`w-full rounded px-3 py-2 text-left ${
              selectedPath === "mastery"
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Concept Mastery
          </button>
        </div>

        <div className="mt-8">
          <a
            href={`/study-planner?course=${courseSlug}`}
            className="block w-full rounded bg-primary px-4 py-2 text-center text-white hover:bg-primary/90"
          >
            Create Study Plan
          </a>
        </div>
      </div>

      {/* Mindmap */}
      <div className="flex-1">
        <MindmapView
          nodes={nodes}
          edges={edges}
          path={selectedPath}
          onNodeClick={(node) => setSelectedNode(node)}
        />
      </div>

      {/* Sources Panel */}
      <div className="w-96 border-l">
        <SourcesPanel selectedNode={selectedNode} isLoading={isLoading} />
      </div>
    </div>
  );
}
