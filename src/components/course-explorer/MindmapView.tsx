"use client";

import {
  addEdge,
  Background,
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
import { useCallback, useEffect, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import type { MindmapNodeData } from "@/types/course-explorer";
import { useStudyPath } from "./useStudyPath";

interface MindmapViewProps {
  nodes: Node<MindmapNodeData>[];
  edges: Edge[];
  path?: string;
  onNodeClick?: (node: Node<MindmapNodeData>) => void;
}

const nodeTypes: NodeTypes = {};

export function MindmapView({
  nodes,
  edges,
  path,
  onNodeClick,
}: MindmapViewProps) {
  const { filteredNodes, filteredEdges } = useStudyPath(nodes, edges, path);

  const [internalNodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [internalEdges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Update when path changes
  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const styledNodes = useMemo(
    () =>
      internalNodes.map((node) => ({
        ...node,
        style: getNodeStyle(node.data as MindmapNodeData),
      })),
    [internalNodes],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={styledNodes}
        edges={internalEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick?.(node as Node<MindmapNodeData>)}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

function getNodeStyle(data?: MindmapNodeData) {
  const priorityColors = {
    core: "#ef4444",
    important: "#f97316",
    optional: "#6b7280",
  };

  const priority = data?.priority ?? "optional";
  const level = data?.level ?? 3;

  const color = priorityColors[priority] || "#6b7280";
  const size = level === 1 ? 60 : level === 2 ? 50 : 40;

  return {
    background: color,
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
  };
}
