"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import { apiClient } from "@/lib/eden";

interface LetterPreviewProps {
  letterId: string;
}

export function LetterPreview({ letterId }: LetterPreviewProps) {
  const { data: letter, isLoading } = useQuery({
    queryKey: ["recommendation-letter", letterId],
    queryFn: async () => {
      const { data, error } = await apiClient.api.recommendations
        .letters({
          id: letterId,
        })
        .get();

      if (error) {
        throw new Error("Failed to fetch letter");
      }

      return data?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!letter) {
    return <div>Letter not found</div>;
  }

  return (
    <div className="rounded-lg border bg-white p-8">
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed">
          {letter.finalContent}
        </pre>
      </div>
    </div>
  );
}
