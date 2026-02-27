"use client";

import { useQuery } from "@tanstack/react-query";
import type { Node } from "@xyflow/react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ExternalLink, FileText, Video } from "lucide-react";
import { apiClient } from "@/lib/eden";
import type { MindmapNodeData } from "@/types/course-explorer";

interface SourcesPanelProps {
  selectedNode: Node<MindmapNodeData> | null | undefined;
  isLoading?: boolean;
}

export function SourcesPanel({ selectedNode, isLoading }: SourcesPanelProps) {
  const { data: topic } = useQuery({
    queryKey: ["topic", selectedNode?.id],
    queryFn: async () => {
      if (!selectedNode) return null;
      const response = await apiClient.api["course-explorer"].topics
        .slug({ slug: selectedNode.data.slug })
        .get();
      return response.data?.data;
    },
    enabled: !!selectedNode,
  });
  if (isLoading) {
    return <SourcesPanelSkeleton />;
  }

  if (!topic) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>Select a topic to view resources</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={topic.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <h2 className="mb-2 font-bold text-2xl">{topic.name}</h2>
          {topic.description && (
            <p className="mb-6 text-gray-600">{topic.description}</p>
          )}

          {topic?.prerequisites?.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 font-semibold text-gray-700">
                Prerequisites
              </h3>
              <ul className="space-y-2">
                {topic.prerequisites.map((prereq) => (
                  <li
                    key={prereq?.prerequisiteTopic?.id}
                    className="flex items-center gap-2 text-gray-600 text-sm"
                  >
                    <span className="text-blue-600">→</span>
                    {prereq?.prerequisiteTopic?.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3 className="mb-3 font-semibold text-gray-700">Resources</h3>
          <div className="space-y-3">
            {topic.resources.map(({ resource, relevance }) =>
              resource ? (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  relevance={relevance}
                />
              ) : null,
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ResourceCard({
  resource,
  relevance,
}: {
  resource: {
    id: string;
    description: string | null;
    title: string;
    s3Url: string;
    viewCount: number;
  };
  relevance: string;
}) {
  const icons = {
    syllabus: BookOpen,
    notes: FileText,
    video: Video,
    default: ExternalLink,
  };

  const Icon = icons.default;

  return (
    <a
      href={resource.s3Url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-gray-900">{resource.title}</h4>
          {resource.description && (
            <p className="mt-1 line-clamp-2 text-gray-600 text-sm">
              {resource.description}
            </p>
          )}
          <span className="mt-2 inline-block rounded-full bg-gray-100 px-2 py-1 text-gray-600 text-xs">
            {relevance}
          </span>
        </div>
      </div>
    </a>
  );
}

function SourcesPanelSkeleton() {
  return (
    <div className="h-full animate-pulse space-y-4 p-6">
      <div className="h-8 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-200" />
      <div className="h-4 w-5/6 rounded bg-gray-200" />
      <div className="h-32 rounded bg-gray-200" />
    </div>
  );
}
