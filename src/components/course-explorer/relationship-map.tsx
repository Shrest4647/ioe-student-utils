"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type {
  CourseLearningTopic,
  CourseLearningView,
} from "@/types/course-learning";

interface MapNodeData extends Record<string, unknown> {
  kind: "course" | "unit" | "topic";
  slug?: string;
  label: string;
}

export function RelationshipMap({
  learningView,
  onSelectTopic,
}: {
  learningView: CourseLearningView;
  onSelectTopic: (slug: string) => void;
}) {
  const [showPrerequisites, setShowPrerequisites] = useState(true);
  const { nodes, edges } = useMemo(
    () => buildMap(learningView),
    [learningView],
  );
  const visibleEdges = showPrerequisites
    ? edges
    : edges.filter((edge) => !edge.id.startsWith("prerequisite:"));

  return (
    <section className="relative h-[68dvh] min-h-125 overflow-hidden rounded-lg border">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        aria-pressed={showPrerequisites}
        onClick={() => setShowPrerequisites((current) => !current)}
        className="absolute top-3 left-3 z-10 shadow-sm"
      >
        {showPrerequisites ? "Hide prerequisites" : "Show prerequisites"}
      </Button>
      <ReactFlow
        nodes={nodes}
        edges={visibleEdges}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => {
          const data = node.data as MapNodeData;
          if (data.kind === "topic" && data.slug) onSelectTopic(data.slug);
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1}
          color="var(--border)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  );
}

function buildMap(learningView: CourseLearningView): {
  nodes: Node<MapNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<MapNodeData>[] = [
    {
      id: `course:${learningView.course.id}`,
      position: { x: 0, y: 0 },
      data: {
        kind: "course",
        label: learningView.course.code,
      },
      className:
        "!border-primary !bg-primary !text-primary-foreground !font-semibold",
    },
  ];
  const edges: Edge[] = [];
  const topicPositions = new Map<string, { x: number; y: number }>();
  let topicRow = 0;

  learningView.units.forEach((unit, unitIndex) => {
    const unitNodeId = `unit:${unit.id}`;
    const unitY = unitIndex * 220;
    nodes.push({
      id: unitNodeId,
      position: { x: 340, y: unitY },
      data: { kind: "unit", label: unit.name },
      className: "!w-56 !border-border !bg-muted !text-foreground !font-medium",
    });
    edges.push({
      id: `course-${unit.id}`,
      source: `course:${learningView.course.id}`,
      target: unitNodeId,
      style: { stroke: "var(--border)", strokeWidth: 2 },
    });

    const addTopics = (
      topics: CourseLearningTopic[],
      parentId: string,
      depth: number,
    ) => {
      for (const topic of topics) {
        const id = `topic:${topic.id}`;
        const position = { x: 680 + depth * 300, y: topicRow * 110 };
        topicRow += 1;
        topicPositions.set(topic.id, position);
        nodes.push({
          id,
          position,
          data: { kind: "topic", slug: topic.slug, label: topic.name },
          className:
            "!w-60 !border-border !bg-card !text-card-foreground hover:!border-primary",
        });
        edges.push({
          id: `hierarchy:${parentId}:${topic.id}`,
          source: parentId,
          target: id,
          style: { stroke: "var(--border)", strokeWidth: 2 },
        });
        addTopics(topic.children, id, depth + 1);
      }
    };

    addTopics(unit.topics, unitNodeId, 0);
  });

  const allTopics = flattenTopics(
    learningView.units.flatMap((unit) => unit.topics),
  );
  for (const topic of allTopics) {
    for (const prerequisite of topic.prerequisites) {
      if (
        !topicPositions.has(prerequisite.id) ||
        !topicPositions.has(topic.id)
      ) {
        continue;
      }
      edges.push({
        id: `prerequisite:${prerequisite.id}:${topic.id}`,
        source: `topic:${prerequisite.id}`,
        target: `topic:${topic.id}`,
        animated: false,
        label: prerequisite.dependencyType,
        style: {
          stroke: "var(--primary)",
          strokeDasharray:
            prerequisite.dependencyType === "weak" ? "4 5" : undefined,
        },
      });
    }
  }

  return { nodes, edges };
}

function flattenTopics(topics: CourseLearningTopic[]): CourseLearningTopic[] {
  return topics.flatMap((topic) => [topic, ...flattenTopics(topic.children)]);
}
