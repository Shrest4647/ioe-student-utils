"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LoaderIcon } from "lucide-react";

interface LetterPreviewProps {
  letterId: string;
}

export function LetterPreview({ letterId }: LetterPreviewProps) {
  const [letter, setLetter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLetter();
  }, [letterId]);

  const fetchLetter = async () => {
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
  };

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
    <div className="border rounded-lg p-8 bg-white">
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed">
          {letter.finalContent}
        </pre>
      </div>
    </div>
  );
}
