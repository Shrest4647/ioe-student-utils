"use client";

import { useQuery } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import { AlertCircle, BookOpen, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/eden";
import type { MindmapNodeData, StudyPath } from "@/types/course-explorer";
import { MindmapView } from "./mindmap-view";
import { SourcesPanel } from "./sources-panel";

interface CourseExplorerProps {
  courseSlug: string;
}

export function CourseExplorer({ courseSlug }: CourseExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<StudyPath>();
  const [selectedNode, setSelectedNode] = useState<Node<MindmapNodeData>>();

  const {
    data: mindmapData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["mindmap", courseSlug, selectedPath],
    queryFn: async () => {
      const response = await apiClient.api["course-explorer"].courses
        .slug({ slug: courseSlug })
        .mindmap.get({
          query: {
            path: selectedPath,
          },
        });
      return response.data?.data;
    },
  });

  // Keep node/edge references stable across sidebar-only state updates
  const nodes: Node<MindmapNodeData>[] = useMemo(
    () =>
      (mindmapData?.nodes ?? []).map((node) => ({
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
        position: { x: 0, y: 0 }, // Position will be calculated by MindmapView
      })),
    [mindmapData],
  );

  const edges: Edge[] = useMemo(
    () =>
      (mindmapData?.edges ?? []).map((e) => ({
        id: `${e.from}-${e.to}`,
        source: e.from,
        target: e.to,
      })),
    [mindmapData],
  );

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center">
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
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">Failed to load course</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button asChild variant="default">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data
  if (!mindmapData || !mindmapData.nodes || mindmapData.nodes.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold text-lg">No topics found</h3>
          <p className="mt-2 text-muted-foreground text-sm">
            This course doesn't have any topics yet, or it may not exist.
          </p>
          <Button asChild className="mt-6" variant="default">
            <Link href="/">Browse All Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] bg-background">
      {/* Study Path Selector */}
      <div className="w-64 border-border border-r bg-muted p-4">
        <h2 className="mb-4 font-semibold text-foreground">Study Paths</h2>
        <div className="space-y-2">
          <Button
            variant={!selectedPath ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSelectedPath(undefined)}
          >
            All Topics
          </Button>
          <Button
            variant={selectedPath === "exam-prep" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSelectedPath("exam-prep")}
          >
            Exam Prep
          </Button>
          <Button
            variant={selectedPath === "minimum" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSelectedPath("minimum")}
          >
            Minimum Passing
          </Button>
        </div>

        <div className="mt-8">
          <Button asChild className="w-full" variant="default">
            <Link href={`/study-planner?course=${courseSlug}`}>
              Create Study Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* Mindmap */}
      <div className="flex-1">
        <MindmapView
          nodes={nodes}
          edges={edges}
          path={selectedPath}
          courseName={mindmapData.course.name}
          onNodeClick={(node) => setSelectedNode(node)}
        />
      </div>

      {/* Sources Panel */}
      <div className="w-96 border-border border-l">
        <SourcesPanel selectedNode={selectedNode} isLoading={isFetching} />
      </div>
    </div>
  );
}
