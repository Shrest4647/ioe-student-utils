"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { apiClient } from "@/lib/eden";

export function CourseEditor({ courseId }: { courseId: string }) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const response = await apiClient.api["course-explorer"]
        .courses({ id: courseId })
        .get();
      return response.data?.data;
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 font-bold text-3xl">Edit Course: {course?.name}</h1>

      <div className="space-y-4">
        {course?.units?.map((unit: any) => (
          <UnitTree
            key={unit.id}
            unit={unit}
            isExpanded={expandedUnits.has(unit.id)}
            onToggle={() => {
              const newExpanded = new Set(expandedUnits);
              if (newExpanded.has(unit.id)) {
                newExpanded.delete(unit.id);
              } else {
                newExpanded.add(unit.id);
              }
              setExpandedUnits(newExpanded);
            }}
          />
        ))}

        <button
          type="button"
          className="flex items-center gap-2 text-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add Unit
        </button>
      </div>
    </div>
  );
}

function UnitTree({ unit, isExpanded, onToggle }: any) {
  return (
    <div className="rounded-lg border">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onToggle();
          }
        }}
      >
        <div className="flex items-center gap-2">
          <ChevronRight
            className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          />
          <span className="font-semibold">{unit.name}</span>
          <span className="text-gray-500 text-sm">
            ({unit.topics?.length || 0} topics)
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded p-1 hover:bg-gray-100">
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-red-600 hover:bg-gray-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 border-t p-4 pl-8">
          {unit.topics?.map((topic: any) => (
            <TopicItem key={topic.id} topic={topic} />
          ))}
          <button
            type="button"
            className="text-primary text-sm hover:underline"
          >
            + Add Topic
          </button>
        </div>
      )}
    </div>
  );
}

function TopicItem({ topic }: { topic: any }) {
  return (
    <div className="flex items-center justify-between rounded px-3 py-2 hover:bg-gray-50">
      <span>{topic.name}</span>
      <div className="flex gap-2">
        <button type="button" className="text-blue-600 text-sm hover:underline">
          Edit
        </button>
        <button type="button" className="text-red-600 text-sm hover:underline">
          Delete
        </button>
      </div>
    </div>
  );
}
