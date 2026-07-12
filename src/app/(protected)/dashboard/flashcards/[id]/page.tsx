"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

export default function EditFlashcardPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <EditFlashcardContent />
    </RoleGuard>
  );
}

function EditFlashcardContent() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const deckQuery = useQuery({
    queryKey: ["dashboard", "flashcards", id],
    queryFn: async () => {
      const response = await apiClient.api.flashcards.id({ id }).get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to load flashcard deck");
      }
      return response.data.data;
    },
    retry: false,
  });

  const tagsQuery = useQuery({
    queryKey: ["dashboard", "flashcards", "tags"],
    queryFn: async () => {
      const response = await apiClient.api.flashcards.admin.tags.get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to load tags");
      }
      return response.data.data;
    },
    retry: false,
  });

  const updateDeckMutation = useMutation({
    mutationFn: async (payload: { title: string; description: string }) =>
      apiClient.api.flashcards.admin({ id }).patch(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "flashcards", id],
      }),
  });

  const addCardMutation = useMutation({
    mutationFn: async () => {
      const cardCount = deckQuery.data?.cards.length ?? 0;
      return apiClient.api.flashcards.admin.deck({ deckId: id }).cards.post({
        orderNo: cardCount + 1,
        front: newFront,
        back: newBack,
      });
    },
    onSuccess: () => {
      setNewFront("");
      setNewBack("");
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "flashcards", id],
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) =>
      apiClient.api.flashcards.admin.cards({ cardId }).delete(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "flashcards", id],
      }),
  });

  const assignTagsMutation = useMutation({
    mutationFn: async (tagIds: string[]) =>
      apiClient.api.flashcards.admin
        .deck({ deckId: id })
        .tags.patch({ tagIds }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["dashboard", "flashcards", id],
      }),
  });

  if (deckQuery.isError) {
    return (
      <div className="container mx-auto max-w-3xl pt-8">
        <Card>
          <CardContent className="py-6 text-destructive text-sm">
            Failed to load flashcard deck details.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deckQuery.data) return null;
  const deck = deckQuery.data;
  const selectedTagIds = new Set((deck.tags ?? []).map((tag: any) => tag.id));

  return (
    <div className="container mx-auto max-w-5xl space-y-6 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Flashcard Deck</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              defaultValue={deck.title}
              onBlur={(e) =>
                updateDeckMutation.mutate({
                  title: e.target.value,
                  description: deck.description ?? "",
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              defaultValue={deck.description ?? ""}
              onBlur={(e) =>
                updateDeckMutation.mutate({
                  title: deck.title,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {(tagsQuery.data ?? []).map((tag: any) => {
                const selected = selectedTagIds.has(tag.id);
                return (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const next = new Set(selectedTagIds);
                      if (selected) {
                        next.delete(tag.id);
                      } else {
                        next.add(tag.id);
                      }
                      assignTagsMutation.mutate([...next]);
                    }}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {deck.cards.map((card: any) => (
            <div key={card.id} className="rounded-lg border p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-medium">
                  {card.orderNo}. {card.front}
                </p>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => deleteCardMutation.mutate(card.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">{card.back}</p>
            </div>
          ))}

          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <Label>New Card Front</Label>
            <Textarea
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Question/front text"
            />
            <Label>New Card Back</Label>
            <Textarea
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Answer/back text"
            />
            <Button
              onClick={() => addCardMutation.mutate()}
              disabled={!newFront || !newBack || addCardMutation.isPending}
            >
              <Plus className="mr-2 size-4" />
              Add Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
