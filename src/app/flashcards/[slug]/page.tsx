"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FlashcardPlayer,
  FlashcardSkeleton,
  useFlashcardDeckBySlug,
} from "@/components/flashcard";
import { Button } from "@/components/ui/button";

export default function FlashcardPlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error, refetch } = useFlashcardDeckBySlug(slug);

  if (isLoading) return <FlashcardSkeleton />;

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
        <div className="w-full text-center">
          <p className="font-medium text-primary text-sm">Deck unavailable</p>
          <h1 className="mt-2 font-semibold text-2xl">
            We could not open these flashcards
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground text-sm leading-6">
            The deck may be unpublished, or your connection may have dropped.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => void refetch()}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/flashcards">
                <ChevronLeft className="size-4" /> All decks
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return <FlashcardPlayer deck={data} />;
}
