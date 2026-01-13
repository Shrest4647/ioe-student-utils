"use client";

import { LoaderIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface LetterPreviewProps {
  letterId: string;
}

export function LetterPreview({ letterId }: LetterPreviewProps) {
  const [letter, setLetter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLetter = useCallback(async () => {
    try {
      const response = await fetch(`/api/recommendations/letters/${letterId}`);
      if (!response.ok) throw new Error("Failed to fetch letter");
      const data = await response.json();
      setLetter(data.data);
    } catch (error) {
      console.error("Error fetching letter:", error);
    } finally {
      setIsLoading(false);
    }
  }, [letterId]);

  useEffect(() => {
    fetchLetter();
  }, [fetchLetter]);

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
