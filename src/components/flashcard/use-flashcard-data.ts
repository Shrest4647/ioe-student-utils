"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";

export function useFlashcardDeckList(params?: {
  search?: string;
  status?: string;
  difficulty?: string;
  tag?: string;
}) {
  return useQuery({
    queryKey: [
      "flashcards",
      params?.search,
      params?.status,
      params?.difficulty,
      params?.tag,
    ],
    queryFn: async () => {
      const response = await apiClient.api.flashcards.get({
        query: {
          search: params?.search,
          status: params?.status as
            | "draft"
            | "published"
            | "archived"
            | undefined,
          difficulty: params?.difficulty as
            | "easy"
            | "medium"
            | "hard"
            | undefined,
          tag: params?.tag,
          limit: "100",
        },
      });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch flashcard decks");
      }
      return response.data.data;
    },
    retry: false,
  });
}

export function useFlashcardDeckBySlug(slug: string) {
  return useQuery({
    queryKey: ["flashcards", "slug", slug],
    queryFn: async () => {
      const response = await apiClient.api.flashcards.slug({ slug }).get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch flashcard deck");
      }
      return response.data.data;
    },
    enabled: Boolean(slug),
    retry: false,
  });
}

export function useFlashcardDeckById(id: string) {
  return useQuery({
    queryKey: ["flashcards", "id", id],
    queryFn: async () => {
      const response = await apiClient.api.flashcards.id({ id }).get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch flashcard deck");
      }
      return response.data.data;
    },
    enabled: Boolean(id),
    retry: false,
  });
}

export function useMyFlashcardSessions(deckId: string, enabled = true) {
  return useQuery({
    queryKey: ["flashcards", "sessions", "mine", deckId],
    queryFn: async () => {
      const response = await apiClient.api
        .flashcards({ deckId })
        .sessions.get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch study sessions");
      }
      return response.data.data;
    },
    enabled: Boolean(deckId) && enabled,
    retry: false,
  });
}
