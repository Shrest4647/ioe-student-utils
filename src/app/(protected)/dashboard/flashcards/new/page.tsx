"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

export default function NewFlashcardPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <NewFlashcardForm />
    </RoleGuard>
  );
}

function NewFlashcardForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.api.flashcards.admin.post({
        title,
        slug: slug || undefined,
        description: description || undefined,
        status: "draft",
      });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to create flashcard deck");
      }
      return response.data.data;
    },
    onSuccess: (deck) => {
      router.push(`/dashboard/flashcards/${deck.id}`);
    },
  });

  return (
    <div className="container mx-auto max-w-3xl space-y-6 pt-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Flashcard Deck</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deck title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug (optional)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="deck-slug"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this deck covers..."
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title || createMutation.isPending}
          >
            Create
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
