"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  FlashcardPlayer,
  FlashcardSkeleton,
  useFlashcardDeckBySlug,
  useMyFlashcardSessions,
} from "@/components/flashcard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/eden";

export default function FlashcardPlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<
    "not_started" | "in_progress" | "completed"
  >("not_started");

  const { data, isLoading, error } = useFlashcardDeckBySlug(slug);
  const sessionsQuery = useMyFlashcardSessions(
    data?.id ?? "",
    isAuthenticated && Boolean(data?.id),
  );

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.api.flashcards
        .sessions({ sessionId })
        .delete({
          guestSessionId: crypto.randomUUID(),
        });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to delete study session");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["flashcards", "sessions", "mine", data?.id ?? ""],
      });
    },
  });

  if (isLoading) return <FlashcardSkeleton />;

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Deck not available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This flashcard deck does not exist or is not published.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FlashcardPlayer deck={data} onPhaseChange={setPhase} />

      {isAuthenticated && (phase === "not_started" || phase === "completed") ? (
        <div className="container mx-auto max-w-2xl px-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Study Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">
                  Loading sessions...
                </p>
              ) : (sessionsQuery.data?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No sessions yet. Complete this deck to see your review
                  history.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessionsQuery.data?.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {session.status}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {session.completedAt
                            ? new Date(session.completedAt).toLocaleString()
                            : new Date(session.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {session.cardsStudied} cards
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {session.accuracyPercentage}% recall
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this study session? This action cannot be undone.",
                              )
                            ) {
                              deleteSessionMutation.mutate(session.id);
                            }
                          }}
                          disabled={deleteSessionMutation.isPending}
                        >
                          <Trash2 className="mr-1 size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
