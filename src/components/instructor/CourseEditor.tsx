"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Save,
  Shuffle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/eden";
import type {
  CourseGraphDiffResult,
  CourseGraphInputV1,
  CourseGraphValidationResult,
} from "@/types/course-graph";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function parseGraph(jsonText: string): CourseGraphInputV1 {
  return JSON.parse(jsonText) as CourseGraphInputV1;
}

export function CourseEditor({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] =
    useState<CourseGraphValidationResult | null>(null);
  const [diff, setDiff] = useState<CourseGraphDiffResult | null>(null);

  const { data: graph, isLoading } = useQuery({
    queryKey: ["course-graph", courseId],
    queryFn: async () => {
      const response = await apiClient.api["course-explorer"].admin
        .courses({ id: courseId })
        .graph.get();

      if (!response.data?.success || !response.data.data) {
        throw new Error("Failed to load course graph");
      }

      return response.data.data as CourseGraphInputV1;
    },
  });

  useMemo(() => {
    if (graph && jsonText.length === 0) {
      setJsonText(pretty(graph));
    }
  }, [graph, jsonText.length]);

  const validateMutation = useMutation({
    mutationFn: async (input: CourseGraphInputV1) => {
      const response = await apiClient.api["course-explorer"].admin[
        "course-graphs"
      ].validate.post({ input });

      if (!response.data?.success || !response.data.data) {
        throw new Error("Validation failed");
      }

      return response.data.data as CourseGraphValidationResult;
    },
    onSuccess: (result) => {
      setValidation(result);
      if (result.valid) {
        toast.success("Graph validation passed");
      } else {
        toast.error(`Validation found ${result.summary.errors} errors`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Validation failed");
    },
  });

  const diffMutation = useMutation({
    mutationFn: async (input: CourseGraphInputV1) => {
      const response = await apiClient.api["course-explorer"].admin[
        "course-graphs"
      ].diff.post({
        input,
        targetCourseId: courseId,
        mode: "merge",
      });

      if (!response.data?.success || !response.data.data) {
        throw new Error("Diff preview failed");
      }

      return response.data.data as CourseGraphDiffResult;
    },
    onSuccess: (result) => {
      setDiff(result);
      toast.success("Diff preview generated");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Diff preview failed",
      );
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (input: CourseGraphInputV1) => {
      const response = await apiClient.api["course-explorer"].admin[
        "course-graphs"
      ].upsert.post({
        input,
        targetCourseId: courseId,
        mode: "merge",
      });

      if (!response.data?.success || !response.data.data) {
        throw new Error("Failed to apply course graph");
      }

      return response.data.data;
    },
    onSuccess: () => {
      toast.success("Course graph applied successfully");
      queryClient.invalidateQueries({ queryKey: ["course-graph", courseId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Apply failed");
    },
  });

  const doValidate = () => {
    try {
      const input = parseGraph(jsonText);
      validateMutation.mutate(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const doDiff = () => {
    try {
      const input = parseGraph(jsonText);
      diffMutation.mutate(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  const doApply = () => {
    try {
      const input = parseGraph(jsonText);
      applyMutation.mutate(input);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid JSON");
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading course graph...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl">Course Graph Editor</h1>
          <p className="text-muted-foreground text-sm">
            Validate, preview, and atomically apply nested course graph changes.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={doValidate}
            disabled={validateMutation.isPending}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Validate
          </Button>
          <Button
            variant="outline"
            onClick={doDiff}
            disabled={diffMutation.isPending}
          >
            <Shuffle className="mr-2 h-4 w-4" />
            Preview Diff
          </Button>
          <Button onClick={doApply} disabled={applyMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Apply Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Graph Payload (JSON)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              className="min-h-[520px] w-full rounded-md border bg-background p-3 font-mono text-xs"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Issues</CardTitle>
            </CardHeader>
            <CardContent>
              {!validation ? (
                <p className="text-muted-foreground text-sm">
                  Run validation to view structured warnings/errors.
                </p>
              ) : validation.issues.length === 0 ? (
                <p className="text-emerald-600 text-sm">No issues found.</p>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {validation.issues.map((issue, index) => (
                      <div
                        key={`${issue.code}-${issue.path}-${index}`}
                        className="rounded-md border p-2"
                      >
                        <p className="font-semibold text-xs">
                          {issue.severity.toUpperCase()} · {issue.code}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {issue.path}
                        </p>
                        <p className="text-sm">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Diff Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!diff ? (
                <p className="text-muted-foreground">
                  Run diff preview to inspect changes.
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-semibold">Creates:</span>{" "}
                    {diff.creates.units.length} units,{" "}
                    {diff.creates.topics.length} topics
                  </p>
                  <p>
                    <span className="font-semibold">Updates:</span>{" "}
                    {diff.updates.units.length} units,{" "}
                    {diff.updates.topics.length} topics
                  </p>
                  <p>
                    <span className="font-semibold">Deactivations:</span>{" "}
                    {diff.deactivations.units.length} units,{" "}
                    {diff.deactivations.topics.length} topics
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Structure Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[220px]">
                <div className="space-y-3">
                  {(graph?.units ?? []).map((unit) => (
                    <div key={unit.id ?? unit.slug ?? unit.name}>
                      <p className="font-semibold text-sm">{unit.name}</p>
                      <ul className="ml-4 list-disc text-muted-foreground text-xs">
                        {unit.topics.map((topic) => (
                          <li key={topic.id ?? topic.slug ?? topic.name}>
                            {topic.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {(applyMutation.isError ||
        validateMutation.isError ||
        diffMutation.isError) && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4" />
          An operation failed. Check payload and retry.
        </div>
      )}
    </div>
  );
}
