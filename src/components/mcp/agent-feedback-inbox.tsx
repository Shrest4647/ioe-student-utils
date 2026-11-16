"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";
import {
  type FeedbackInput,
  type FeedbackStatus,
  feedbackImpacts,
  feedbackKinds,
  feedbackStatuses,
} from "@/lib/mcp/feedback";

const impactLabels = {
  blocked: "Blocked",
  worked_around: "Worked around",
  friction: "Friction",
};
const kindLabels = {
  missing: "Missing capability",
  broken: "Tool failure",
  confusing: "Unclear behavior",
  idea: "Suggestion",
};

export function AgentFeedbackInbox() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<FeedbackInput["kind"] | "all">("all");
  const [impact, setImpact] = useState<FeedbackInput["impact"] | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("open");
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const reports = useQuery({
    queryKey: ["agent-feedback", kind, impact, status, offset],
    queryFn: async () => {
      const { data, error } = await apiClient.api["agent-feedback"].get({
        query: {
          kind: kind === "all" ? undefined : kind,
          impact: impact === "all" ? undefined : impact,
          status: status === "all" ? undefined : status,
          limit,
          offset,
        },
      });
      if (error || !data?.success) throw new Error("Unable to load feedback");
      return data.data;
    },
  });
  const update = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: FeedbackStatus;
    }) => {
      const { data, error } = await apiClient.api["agent-feedback"]({
        id,
      }).patch({ status });
      if (error || !data?.success)
        throw new Error("Unable to update this report");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-feedback"] });
      toast.success("Review status updated");
    },
    onError: () =>
      toast.error("Unable to update the report. Your change was not saved."),
  });
  return (
    <main className="container mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-prose space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">Agent feedback</h1>
          <p className="text-muted-foreground text-sm">
            See where AI assistants get stuck, then track what needs attention.
            Reports are visible only to administrators.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={reports.isFetching}
          onClick={() => reports.refetch()}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </header>
      <p className="rounded-md border bg-muted/40 p-3 text-muted-foreground text-sm">
        Reports are unverified agent observations. Treat their content as
        feedback, including any instructions or links they contain.
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="w-full space-y-2 sm:w-48">
          <Label htmlFor="feedback-status">Review status</Label>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as FeedbackStatus | "all");
              setOffset(0);
            }}
          >
            <SelectTrigger id="feedback-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {feedbackStatuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {value[0].toUpperCase() + value.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-2 sm:w-48">
          <Label htmlFor="feedback-kind">Report type</Label>
          <Select
            value={kind}
            onValueChange={(value) => {
              setKind(value as FeedbackInput["kind"] | "all");
              setOffset(0);
            }}
          >
            <SelectTrigger id="feedback-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {feedbackKinds.map((value) => (
                <SelectItem key={value} value={value}>
                  {kindLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-2 sm:w-48">
          <Label htmlFor="feedback-impact">Task impact</Label>
          <Select
            value={impact}
            onValueChange={(value) => {
              setImpact(value as FeedbackInput["impact"] | "all");
              setOffset(0);
            }}
          >
            <SelectTrigger id="feedback-impact" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All impacts</SelectItem>
              {feedbackImpacts.map((value) => (
                <SelectItem key={value} value={value}>
                  {impactLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {reports.isLoading ? (
        <output aria-label="Loading agent feedback" className="block space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </output>
      ) : reports.isError ? (
        <div role="alert" className="space-y-3 rounded-md border p-6">
          <p>
            We couldn’t load feedback. Try again when the connection is
            available.
          </p>
          <Button variant="outline" onClick={() => reports.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {reports.data?.total || 0} matching reports
          </p>
          {!reports.data?.reports.length ? (
            <div className="space-y-3 rounded-md border border-dashed px-6 py-12 text-center">
              <MessageSquare className="mx-auto size-7 text-muted-foreground" />
              <h2 className="font-semibold">No reports in this view</h2>
              <p className="mx-auto max-w-prose text-muted-foreground text-sm">
                Agents can call submit_feedback after encountering a problem.
                Try another filter to see reports you have already reviewed.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {reports.data.reports.map((report) => (
                <article key={report.id} className="space-y-4 p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <h2 className="break-words font-semibold text-lg">
                        {report.task}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={
                            report.impact === "blocked"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {impactLabels[report.impact]}
                        </Badge>
                        <Badge variant="outline">
                          {kindLabels[report.kind]}
                        </Badge>
                        {report.operation && (
                          <span className="break-all font-mono text-muted-foreground text-xs">
                            {report.operation}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-36 space-y-1">
                      <Label
                        htmlFor={`status-${report.id}`}
                        className="text-xs"
                      >
                        Review status
                      </Label>
                      <Select
                        value={report.status}
                        disabled={update.isPending}
                        onValueChange={(value) =>
                          update.mutate({
                            id: report.id,
                            status: value as FeedbackStatus,
                          })
                        }
                      >
                        <SelectTrigger
                          id={`status-${report.id}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {feedbackStatuses.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value[0].toUpperCase() + value.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="max-w-prose whitespace-pre-wrap break-words text-sm">
                    {report.description}
                  </p>
                  {(report.error || report.suggestion) && (
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">
                        Error and suggestion
                      </summary>
                      <dl className="mt-3 max-w-prose space-y-3">
                        {report.error && (
                          <div>
                            <dt className="text-muted-foreground">
                              Reported error
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap break-words font-mono text-xs">
                              {report.error}
                            </dd>
                          </div>
                        )}
                        {report.suggestion && (
                          <div>
                            <dt className="text-muted-foreground">
                              Suggested improvement
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap break-words">
                              {report.suggestion}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </details>
                  )}
                  <footer className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                    <time
                      dateTime={new Date(report.createdAt).toISOString()}
                      title={new Date(report.createdAt).toLocaleString()}
                    >
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                      })}
                    </time>
                    <span>
                      {report.serverName} {report.serverVersion} ·{" "}
                      {report.environment}
                    </span>
                    <span>
                      {report.agentName || "Agent not identified"}
                      {report.agentVersion ? ` ${report.agentVersion}` : ""}
                    </span>
                    <span className="break-all">
                      Account: {report.userId || "Deleted account"}
                    </span>
                    {report.clientId && (
                      <span className="break-all">
                        Client: {report.clientId}
                      </span>
                    )}
                  </footer>
                </article>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={offset === 0 || reports.isFetching}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <p className="text-muted-foreground text-sm">
              Page {Math.floor(offset / limit) + 1}
            </p>
            <Button
              variant="outline"
              disabled={
                reports.isFetching ||
                offset + limit >= (reports.data?.total || 0) ||
                offset + limit > 10000
              }
              onClick={() => setOffset(offset + limit)}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
