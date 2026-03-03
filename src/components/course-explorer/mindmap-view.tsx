"use client";

import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { MindmapNodeData } from "@/types/course-explorer";
import { MindmapNode } from "./mindmap-node";
import { useStudyPath } from "./use-study-path";

interface MindmapViewProps {
  nodes: Node<MindmapNodeData>[];
  edges: Edge[];
  path?: string;
  courseName?: string;
  onNodeClick?: (node: Node<MindmapNodeData>) => void;
}

const nodeTypes: NodeTypes = {
  mindmap: MindmapNode,
};

export function MindmapView({
  nodes: inputNodes,
  edges,
  path,
  courseName,
  onNodeClick,
}: MindmapViewProps) {
  const { filteredNodes: baseNodes, filteredEdges } = useStudyPath(
    inputNodes,
    edges,
    path,
  );

  // Inject Subject Node if courseName is provided
  const { nodes, edges: finalEdges } = useMemo(() => {
    if (!courseName) return { nodes: baseNodes, edges: filteredEdges };

    const subjectId = "subject-root";
    const subjectNode: Node<MindmapNodeData> = {
      id: subjectId,
      type: "mindmap",
      data: {
        id: subjectId,
        label: courseName,
        slug: "root",
        priority: "core",
        hours: 0,
        weightage: null,
        description: "Main Course Subject",
        unitName: "Root",
        resourceCount: 0,
        level: 0,
      } as MindmapNodeData,
      position: { x: 0, y: 0 },
    };

    // Find nodes that have no parents and link them to subject
    const rootNodes = baseNodes.filter(
      (n) => !filteredEdges.some((e) => e.target === n.id),
    );
    const newEdges: Edge[] = rootNodes.map((rn) => ({
      id: `root-${rn.id}`,
      source: subjectId,
      target: rn.id,
    }));

    return {
      nodes: [subjectNode, ...baseNodes],
      edges: [...newEdges, ...filteredEdges],
    };
  }, [baseNodes, filteredEdges, courseName]);

  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    new Set(),
  );
  const initializedGraphRef = useRef<string>("");
  const nodePositionMemoryRef = useRef<Map<string, { x: number; y: number }>>(
    new Map(),
  );

  // Initialize expanded nodes: Only level 0 or nodes without parents
  useEffect(() => {
    const nodeIds = nodes
      .map((node) => node.id)
      .sort()
      .join("|");
    const edgeIds = finalEdges
      .map((edge) => `${edge.source}->${edge.target}`)
      .sort()
      .join("|");
    const graphSignature = `${courseName ?? "course"}::${nodeIds}::${edgeIds}`;

    if (initializedGraphRef.current === graphSignature) {
      return;
    }
    initializedGraphRef.current = graphSignature;

    const initialExpanded = new Set<string>();
    const roots = nodes.filter(
      (n) => !finalEdges.some((e) => e.target === n.id),
    );
    for (const root of roots) {
      initialExpanded.add(root.id);
    }
    setExpandedNodeIds(initialExpanded);
  }, [nodes, finalEdges, courseName]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Determine visibility and layout based on expanded state
  const { laidOutNodes, visibleEdges } = useMemo(() => {
    const childrenMap = new Map<string, string[]>();
    for (const edge of finalEdges) {
      const children = childrenMap.get(edge.source) || [];
      children.push(edge.target);
      childrenMap.set(edge.source, children);
    }

    const visibleNodeIds = new Set<string>();

    // Find absolute roots
    const rootNodes = nodes.filter(
      (n) => !finalEdges.some((e) => e.target === n.id),
    );
    for (const r of rootNodes) {
      visibleNodeIds.add(r.id);
    }

    // Recursively add children ONLY IF parent is visible AND parent is expanded
    const addChildrenRecursively = (parentId: string) => {
      if (expandedNodeIds.has(parentId) && visibleNodeIds.has(parentId)) {
        const children = childrenMap.get(parentId) || [];
        for (const childId of children) {
          visibleNodeIds.add(childId);
          addChildrenRecursively(childId);
        }
      }
    };

    for (const r of rootNodes) {
      addChildrenRecursively(r.id);
    }

    // 2. Filter nodes and edges
    const vNodes = nodes
      .filter((n) => visibleNodeIds.has(n.id))
      .map((n) => ({
        ...n,
        type: "mindmap",
        data: {
          ...n.data,
          isExpanded: expandedNodeIds.has(n.id),
          hasChildren: (childrenMap.get(n.id)?.length ?? 0) > 0,
          onToggleExpand: toggleExpand,
        } as MindmapNodeData & {
          onToggleExpand: (id: string) => void;
          isExpanded: boolean;
          hasChildren: boolean;
        },
      }));

    const vEdges = finalEdges
      .filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
      )
      .map((e) => ({
        ...e,
        type: "bezier" as const,
        animated: false,
        style: {
          stroke: "#9ca3af",
          strokeWidth: 2,
          strokeLinecap: "round" as const,
          strokeOpacity: 0.8,
        },
      }));

    // 3. Apply tree layout
    if (vNodes.length === 0) return { laidOutNodes: [], visibleEdges: [] };

    const nodeHeight = 100;
    const horizontalGap = 400; // Increased
    const verticalGap = 60; // Increased

    const vChildrenMap = new Map<string, string[]>();
    for (const edge of vEdges) {
      const children = vChildrenMap.get(edge.source) || [];
      children.push(edge.target);
      vChildrenMap.set(edge.source, children);
    }

    const vRoots = vNodes.filter((n) => !vEdges.some((e) => e.target === n.id));
    const nodePositions = new Map<string, { x: number; y: number }>();
    let currentY = 0;

    const layoutSubtree = (nodeId: string, depth: number): number => {
      const children = vChildrenMap.get(nodeId) || [];
      const x = depth * horizontalGap;

      if (children.length === 0) {
        const y = currentY;
        nodePositions.set(nodeId, { x, y });
        currentY += nodeHeight + verticalGap;
        return y;
      }

      const childYPositions: number[] = [];
      for (const childId of children) {
        childYPositions.push(layoutSubtree(childId, depth + 1));
      }

      const minY = childYPositions[0];
      const maxY = childYPositions[childYPositions.length - 1];
      const y = (minY + maxY) / 2;
      nodePositions.set(nodeId, { x, y });
      return y;
    };

    for (const root of vRoots) {
      layoutSubtree(root.id, 0);
    }

    const resultNodes = vNodes.map((n) => ({
      ...n,
      position: nodePositions.get(n.id) || n.position,
    }));

    return { laidOutNodes: resultNodes, visibleEdges: vEdges };
  }, [nodes, finalEdges, expandedNodeIds, toggleExpand]);

  const [internalNodes, setNodes, onNodesChange] = useNodesState(laidOutNodes);
  const [internalEdges, setEdges, onEdgesChange] = useEdgesState(visibleEdges);

  useEffect(() => {
    setNodes((prevNodes) => {
      const previousPositions = new Map(
        prevNodes.map((node) => [node.id, node.position]),
      );

      const nextNodes = laidOutNodes.map((node) => {
        const isSubjectRoot = node.id === "subject-root";
        const rememberedPosition =
          nodePositionMemoryRef.current.get(node.id) ??
          previousPositions.get(node.id);

        const nextNode = {
          ...node,
          position:
            isSubjectRoot || !rememberedPosition
              ? node.position
              : rememberedPosition,
        };

        nodePositionMemoryRef.current.set(nextNode.id, nextNode.position);
        return nextNode;
      });

      return nextNodes;
    });
    setEdges(visibleEdges);
  }, [laidOutNodes, visibleEdges, setNodes, setEdges]);

  useEffect(() => {
    for (const node of internalNodes) {
      nodePositionMemoryRef.current.set(node.id, node.position);
    }
  }, [internalNodes]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      {/* Overlay UI */}
      <div className="pointer-events-none absolute top-8 left-8 z-10 space-y-1">
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">
          Course Topic Explorer
        </h1>
        <p className="text-muted-foreground text-sm">
          Interactive study path visualization
        </p>
      </div>

      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick?.(node as Node<MindmapNodeData>)}
        fitView
        minZoom={0.05}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "bezier",
          animated: false,
        }}
      >
        <Background
          color="#cbd5e1"
          gap={40}
          size={1}
          variant={BackgroundVariant.Dots}
        />
        <Controls className="border-border! bg-background! text-muted-foreground! shadow-lg" />
        <MiniMap
          className="border-border! bg-background! shadow-lg"
          nodeColor={(n) => {
            const priority = (n.data as MindmapNodeData)?.priority;
            if (priority === "core") return "#10b981";
            if (priority === "important") return "#3b82f6";
            return "#94a3b8";
          }}
          maskColor="rgba(248, 250, 252, 0.7)"
        />
      </ReactFlow>

      {/* Floating Action Hint */}
      <div className="absolute bottom-8 left-8 z-10 flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 font-medium text-muted-foreground text-xs shadow-sm backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Core Topics</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/80 px-4 py-2 font-medium text-muted-foreground text-xs shadow-sm backdrop-blur-md">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Important</span>
        </div>
      </div>
    </div>
  );
}
