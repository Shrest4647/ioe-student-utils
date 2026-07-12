"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/eden";

export function useQuizList(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["quizzes", params?.search, params?.status],
    queryFn: async () => {
      const response = await apiClient.api.quizzes.get({
        query: {
          search: params?.search,
          status: params?.status as
            | "draft"
            | "published"
            | "archived"
            | undefined,
          limit: "100",
        },
      });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch quizzes");
      }
      return response.data.data;
    },
  });
}

export function useQuizBySlug(slug: string) {
  return useQuery({
    queryKey: ["quiz", "slug", slug],
    queryFn: async () => {
      const response = await apiClient.api.quizzes.slug({ slug }).get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch quiz");
      }
      return response.data.data;
    },
    enabled: Boolean(slug),
  });
}

export function useQuizById(id: string) {
  return useQuery({
    queryKey: ["quiz", "id", id],
    queryFn: async () => {
      const response = await apiClient.api.quizzes.id({ id }).get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch quiz");
      }
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}

export function useMyQuizAttempts(quizId: string, enabled = true) {
  return useQuery({
    queryKey: ["quiz", "attempts", "mine", quizId],
    queryFn: async () => {
      const response = await apiClient.api.quizzes
        .quiz({ quizId })
        ["my-attempts"].get();
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch attempts");
      }
      return response.data.data;
    },
    enabled: Boolean(quizId) && enabled,
  });
}
