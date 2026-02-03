"use client";

import { useQuery } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import { Loader2 } from "lucide-react";
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

  const { data: mindmapData, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const nodes: Node<MindmapNodeData>[] = (mindmapData?.nodes || []).map(
    (n, index) => ({
      id: n.id,
      data: {
        id: n.id,
        label: n.label,
        slug: n.slug,
        priority: n.priority as "core" | "important" | "optional",
        hours: n.hours,
        weightage: n.weightage,
        description: n.description,
        unitName: n.unitName,
        resourceCount: n.resources?.length ?? 0,
        level: n.level,
      } as MindmapNodeData,
      // Simple grid layout since API doesn't provide positions
      position: { x: (index % 5) * 150, y: Math.floor(index / 5) * 100 },
    }),
  );

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
