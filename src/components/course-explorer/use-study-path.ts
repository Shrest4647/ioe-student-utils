import type { Edge, Node } from "@xyflow/react";
import { useMemo } from "react";

export function useStudyPath(nodes: Node[], edges: Edge[], path?: string) {
  return useMemo(() => {
    if (!path) return { filteredNodes: nodes, filteredEdges: edges };

    const filteredNodes = filterNodesByPath(nodes, path);
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter(
      (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
    );

    return { filteredNodes, filteredEdges };
  }, [nodes, edges, path]);
}

function filterNodesByPath(nodes: Node[], path: string): Node[] {
  switch (path) {
    case "exam-prep":
      return nodes.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity:
            n.data.weightage && (n.data.weightage as number) > 0 ? 1 : 0.3,
        },
      }));

    case "minimum":
      return nodes
        .filter((n) => n.data.priority === "core")
        .map((n) => ({ ...n, style: { ...n.style, opacity: 1 } }));

    case "mastery":
      return nodes.map((n) => ({
        ...n,
        style: { ...n.style, opacity: 1 },
      }));

    default:
      return nodes;
  }
}
