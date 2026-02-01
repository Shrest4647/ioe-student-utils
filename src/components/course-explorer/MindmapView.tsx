"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface MindmapViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
}

const nodeTypes: NodeTypes = {};

export function MindmapView({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
}: MindmapViewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const styledNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        style: getNodeStyle(node.data),
      })),
    [nodes]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={styledNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => onNodeClick?.(node)}
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

function getNodeStyle(data: any) {
  const priorityColors = {
    core: "#ef4444",
    important: "#f97316",
    optional: "#6b7280",
  };

  const color = priorityColors[data.priority] || "#6b7280";
  const size = data.level === 1 ? 60 : data.level === 2 ? 50 : 40;

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
