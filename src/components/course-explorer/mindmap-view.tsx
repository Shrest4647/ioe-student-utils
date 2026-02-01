"use client";

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type EdgeTypes,
  MiniMap,
  type Node,
  type NodeTypes,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { Loader2, Maximize } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMindmapData } from "@/hooks/use-mindmap-data";
import { useTopicDetails } from "@/hooks/use-topic-details";
import { cn } from "@/lib/utils";
import type {
  MindmapEdge as MindmapEdgeType,
  MindmapFlowEdge,
  MindmapFlowNode,
  MindmapNodeData,
  MindmapNode as MindmapNodeType,
  MindmapViewProps,
  StudyPath,
} from "@/types/course-explorer";
import {
  ContextualSourcesDrawer,
  ContextualSourcesPanel,
} from "./contextual-sources-panel";
import {
  MindmapEdge,
  MindmapEdgeBezier,
  MindmapEdgeStraight,
} from "./mindmap-edge";
import {
  MindmapNode,
  MindmapNodeCompact,
  MindmapUnitNode,
} from "./mindmap-node";
import { StudyPathFilter } from "./study-path-filter";

import "@xyflow/react/dist/style.css";

// ============================================================================
// Node and Edge Type Registrations
// ============================================================================

const nodeTypes: NodeTypes = {
  topic: MindmapNode,
  "topic-compact": MindmapNodeCompact,
  unit: MindmapUnitNode,
};

const edgeTypes: EdgeTypes = {
  prerequisite: MindmapEdge,
  "prerequisite-straight": MindmapEdgeStraight,
  "prerequisite-bezier": MindmapEdgeBezier,
};

// ============================================================================
// Layout Utilities
// ============================================================================

/**
 * Calculate node positions using a hierarchical layout
 *
 * Groups nodes by unit and arranges them in a grid pattern
 * with prerequisite edges flowing from top to bottom.
 */
function calculateNodeLayout(
  nodes: MindmapNodeType[],
  _edges: MindmapEdgeType[],
): MindmapFlowNode[] {
  // Group nodes by unit
  const unitGroups = new Map<string, MindmapNodeType[]>();
  for (const node of nodes) {
    const unitNodes = unitGroups.get(node.unitId) || [];
    unitNodes.push(node);
    unitGroups.set(node.unitId, unitNodes);
  }

  // Calculate positions
  const positionedNodes: MindmapFlowNode[] = [];

  let currentX = 0;
  const unitSpacing = 400; // Horizontal space between units
  const nodeSpacingX = 220; // Horizontal space between nodes
  const nodeSpacingY = 150; // Vertical space between nodes
  const nodesPerRow = 3;

  for (const [, unitNodes] of unitGroups) {
    // Sort nodes by level (core first, then important, then optional)
    const sortedNodes = [...unitNodes].sort((a, b) => {
      const levelOrder = { core: 0, important: 1, optional: 2 };
      return levelOrder[a.priority] - levelOrder[b.priority];
    });

    // Position nodes in a grid within each unit
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const row = Math.floor(i / nodesPerRow);
      const col = i % nodesPerRow;

      const x = currentX + col * nodeSpacingX;
      const y = row * nodeSpacingY;

      positionedNodes.push({
        id: node.id,
        type: "topic",
        position: { x, y },
        data: {
          id: node.id,
          label: node.label,
          slug: node.slug,
          priority: node.priority,
          hours: node.hours,
          weightage: node.weightage,
          description: node.description,
          unitName: node.unitName,
          resourceCount: node.resources.length,
        } as MindmapNodeData,
      });
    }

    // Move to next unit position
    const unitWidth = Math.min(sortedNodes.length, nodesPerRow) * nodeSpacingX;
    currentX += Math.max(unitWidth, unitSpacing);
  }

  return positionedNodes;
}

/**
 * Convert API edges to React Flow edges
 */
function convertEdges(edges: MindmapEdgeType[]): MindmapFlowEdge[] {
  return edges.map((edge) => ({
    id: `${edge.from}-${edge.to}`,
    source: edge.from,
    target: edge.to,
    type: "prerequisite",
    data: { type: edge.type },
    animated: edge.type === "strong",
    style: { strokeWidth: edge.type === "strong" ? 3 : 2 },
  }));
}

/**
 * Filter nodes based on study path
 */
function filterNodesByPath(
  nodes: MindmapFlowNode[],
  path: StudyPath,
): MindmapFlowNode[] {
  if (!path || path === "all") return nodes;

  return nodes.map((node) => {
    const data = node.data;
    let opacity = 1;

    switch (path) {
      case "exam-prep":
        // Highlight nodes with weightage > 0
        opacity =
          data.weightage && parseFloat(data.weightage as string) > 0 ? 1 : 0.3;
        break;
      case "minimum":
        // Show only core topics
        opacity = data.priority === "core" ? 1 : 0.2;
        break;
    }

    return {
      ...node,
      style: {
        ...node.style,
        opacity,
      },
    };
  });
}

/**
 * Filter edges based on visible nodes
 */
function filterEdgesByNodes(
  edges: MindmapFlowEdge[],
  nodeIds: Set<string>,
): MindmapFlowEdge[] {
  return edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
}

// ============================================================================
// Fit View Component
// ============================================================================

function FitViewButton() {
  const { fitView } = useReactFlow();

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => fitView({ padding: 0.2, duration: 300 })}
      className="h-8 w-8"
      title="Fit to view"
    >
      <Maximize className="h-4 w-4" />
    </Button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MindmapView Component
 *
 * A React Flow-based mindmap visualization for course topics and prerequisites.
 *
 * Features:
 * - Hierarchical node layout grouped by units
 * - Different node types (core, important, optional)
 * - Prerequisite edges with strong/weak dependencies
 * - Study path filtering (exam-prep, minimum, all)
 * - Zoom, pan, and fit-to-view controls
 * - Responsive design with dark mode support
 * - Click handlers for node selection
 *
 * @example
 * ```tsx
 * <MindmapView
 *   courseSlug="bct-301"
 *   path="exam-prep"
 *   onNodeClick={(node) => console.log("Clicked:", node.data.label)}
 * />
 * ```
 */
export function MindmapView({
  courseSlug,
  path,
  onNodeClick,
  onPathChange,
  className,
}: MindmapViewProps) {
  // Fetch mindmap data
  const { data, isLoading, error } = useMindmapData(courseSlug, path);

  // Track selected node for the contextual sources panel
  const [selectedNodeSlug, setSelectedNodeSlug] = useState<string | undefined>(
    undefined,
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Fetch topic details for the selected node
  const { data: topicDetails, isLoading: isTopicLoading } =
    useTopicDetails(selectedNodeSlug);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>([]);

  // Calculate initial layout when data loads
  const initialNodes = useMemo(() => {
    if (!data?.nodes) return [];
    return calculateNodeLayout(data.nodes, data.edges);
  }, [data]);

  const initialEdges = useMemo(() => {
    if (!data?.edges) return [];
    return convertEdges(data.edges);
  }, [data]);

  // Apply study path filtering
  const filteredNodes = useMemo(() => {
    return filterNodesByPath(initialNodes, path);
  }, [initialNodes, path]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(
      filteredNodes
        .filter((n) => !n.style?.opacity || (n.style.opacity as number) > 0.5)
        .map((n) => n.id),
    );
    return filterEdgesByNodes(initialEdges, visibleNodeIds);
  }, [filteredNodes, initialEdges]);

  // Sync with React Flow state
  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  // Handle edge connections (for interactive editing - future feature)
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  // Handle node clicks
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const flowNode = node as MindmapFlowNode;
      const nodeSlug = flowNode.data.slug as string;

      // Update selected node and open panel
      setSelectedNodeSlug(nodeSlug);
      setIsPanelOpen(true);

      // Call the external onNodeClick callback if provided
      onNodeClick?.(flowNode);
    },
    [onNodeClick],
  );

  // Handle panel close
  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedNodeSlug(undefined);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-full min-h-100 items-center justify-center rounded-lg border border-border bg-card",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading mindmap...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "flex h-full min-h-100 items-center justify-center rounded-lg border border-destructive bg-destructive/10",
          className,
        )}
      >
        <div className="text-center">
          <p className="font-medium text-destructive">Failed to load mindmap</p>
          <p className="mt-1 text-destructive/80 text-sm">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.nodes.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full min-h-100 items-center justify-center rounded-lg border border-border bg-card",
          className,
        )}
      >
        <div className="text-center text-muted-foreground">
          <p className="font-medium">No topics found</p>
          <p className="mt-1 text-sm">
            This course doesn't have any topics yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full w-full", className)}>
      {/* Main Mindmap Area */}
      <div
        className={cn(
          "relative h-full min-h-125 flex-1 rounded-lg border border-border bg-background transition-all",
          isPanelOpen ? "rounded-r-none border-r-0" : "",
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, duration: 300 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: "prerequisite",
            animated: false,
          }}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          {/* Background pattern */}
          <Background
            gap={20}
            size={1}
            color="hsl(var(--border))"
            className="bg-background"
          />

          {/* Controls */}
          <Controls className="border-border bg-card shadow-sm">
            <FitViewButton />
          </Controls>

          {/* Mini map */}
          <MiniMap
            className="rounded-lg border border-border bg-card shadow-sm"
            nodeColor={(node) => {
              switch (node.data?.priority) {
                case "core":
                  return "hsl(var(--destructive))";
                case "important":
                  return "hsl(var(--warning))";
                case "optional":
                  return "hsl(var(--muted))";
                default:
                  return "hsl(var(--primary))";
              }
            }}
            maskColor="hsl(var(--background) / 0.8)"
          />

          {/* Study Path Filter */}
          <Panel position="top-left" className="m-4">
            <StudyPathFilter
              value={path}
              onChange={(newPath) => {
                // Call the onPathChange callback if provided
                onPathChange?.(newPath);
              }}
              nodes={data.nodes}
              variant="compact"
            />
          </Panel>

          {/* Node count indicator */}
          <Panel position="bottom-left" className="m-4">
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground text-xs shadow-sm">
              {data.nodes.length} topics • {data.edges.length} prerequisites
            </div>
          </Panel>
        </ReactFlow>

        {/* Desktop: Side Panel */}
        <div
          className={cn(
            "hidden w-96 shrink-0 transition-all duration-300 ease-in-out lg:block",
            isPanelOpen
              ? "translate-x-0 opacity-100"
              : "w-0 translate-x-full opacity-0",
          )}
        >
          {isPanelOpen && (
            <ContextualSourcesPanel
              topic={topicDetails ?? null}
              isLoading={isTopicLoading}
              onClose={handlePanelClose}
            />
          )}
        </div>

        {/* Mobile: Drawer */}
        <ContextualSourcesDrawer
          topic={topicDetails ?? null}
          isLoading={isTopicLoading}
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Static Data Variant (for testing/storybook)
// ============================================================================

interface MindmapViewStaticProps {
  nodes: MindmapNodeType[];
  edges: MindmapEdgeType[];
  path?: StudyPath;
  onNodeClick?: (node: MindmapFlowNode) => void;
  className?: string;
}

/**
 * Static variant of MindmapView for testing or Storybook
 * Does not fetch data - uses provided nodes and edges
 */
export function MindmapViewStatic({
  nodes: initialDataNodes,
  edges: initialDataEdges,
  path,
  onNodeClick,
  className,
}: MindmapViewStaticProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<MindmapFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<MindmapFlowEdge>([]);

  const initialNodes = useMemo(() => {
    return calculateNodeLayout(initialDataNodes, initialDataEdges);
  }, [initialDataNodes, initialDataEdges]);

  const initialEdges = useMemo(() => {
    return convertEdges(initialDataEdges);
  }, [initialDataEdges]);

  const filteredNodes = useMemo(() => {
    return filterNodesByPath(initialNodes, path);
  }, [initialNodes, path]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(
      filteredNodes
        .filter((n) => !n.style?.opacity || (n.style.opacity as number) > 0.5)
        .map((n) => n.id),
    );
    return filterEdgesByNodes(initialEdges, visibleNodeIds);
  }, [filteredNodes, initialEdges]);

  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeClick?.(node as MindmapFlowNode);
    },
    [onNodeClick],
  );

  return (
    <div
      className={cn(
        "h-full min-h-125 w-full rounded-lg border border-border bg-background",
        className,
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 300 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "prerequisite",
          animated: false,
        }}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background
          gap={20}
          size={1}
          color="hsl(var(--border))"
          className="bg-background"
        />
        <Controls className="border-border bg-card shadow-sm">
          <FitViewButton />
        </Controls>
        <MiniMap
          className="rounded-lg border border-border bg-card shadow-sm"
          nodeColor={(node) => {
            switch (node.data?.priority) {
              case "core":
                return "hsl(var(--destructive))";
              case "important":
                return "hsl(var(--warning))";
              case "optional":
                return "hsl(var(--muted))";
              default:
                return "hsl(var(--primary))";
            }
          }}
          maskColor="hsl(var(--background) / 0.8)"
        />
      </ReactFlow>
    </div>
  );
}
