"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MindmapView } from "./MindmapView";
import { SourcesPanel } from "./SourcesPanel";
import { Loader2 } from "lucide-react";
import type { Node, Edge } from "@xyflow/react";

interface CourseExplorerProps {
  courseSlug: string;
}

export function CourseExplorer({ courseSlug }: CourseExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | undefined>();
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { data: mindmapData, isLoading } = useQuery({
    queryKey: ["mindmap", courseSlug, selectedPath],
    queryFn: async () => {
      const path = selectedPath ? `?path=${selectedPath}` : "";
      const res = await fetch(
        `/api/course-explorer/courses/slug/${courseSlug}/mindmap${path}`
      );
      const json = await res.json();
      return json.data;
    },
  });

  const { data: topicData } = useQuery({
    queryKey: ["topic", selectedNode?.id],
    queryFn: async () => {
      if (!selectedNode) return null;
      const res = await fetch(`/api/course-explorer/topics/slug/${selectedNode.slug}`);
      const json = await res.json();
      return json.data;
    },
    enabled: !!selectedNode,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const nodes: Node[] = (mindmapData?.nodes || []).map((n: any) => ({
    id: n.id,
    data: n,
    position: { x: n.x || 0, y: n.y || 0 },
  }));

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
            onClick={() => setSelectedPath(undefined)}
            className={`w-full text-left rounded px-3 py-2 ${
              !selectedPath
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            }`}
          >
            All Topics
          </button>
          <button
            onClick={() => setSelectedPath("exam-prep")}
            className={`w-full text-left rounded px-3 py-2 ${
              selectedPath === "exam-prep"
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Exam Prep
          </button>
          <button
            onClick={() => setSelectedPath("minimum")}
            className={`w-full text-left rounded px-3 py-2 ${
              selectedPath === "minimum"
                ? "bg-primary text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Minimum Passing
          </button>
          <button
            onClick={() => setSelectedPath("mastery")}
            className={`w-full text-left rounded px-3 py-2 ${
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
          onNodeClick={setSelectedNode}
        />
      </div>

      {/* Sources Panel */}
      <div className="w-96 border-l">
        <SourcesPanel
          topic={topicData}
          isLoading={!topicData && !!selectedNode}
        />
      </div>
    </div>
  );
}
