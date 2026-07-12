"use client";

import Link from "next/link";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import {
  FlashcardSkeleton,
  useFlashcardDeckList,
} from "@/components/flashcard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function FlashcardCatalogPage() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounceValue(search, 300);
  const { data, isLoading } = useFlashcardDeckList({
    search: debounced,
    status: "published",
  });

  if (isLoading) return <FlashcardSkeleton />;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-bold text-3xl">Flashcards</h1>
        <p className="text-muted-foreground">
          Study with spaced-repetition-ready decks.
        </p>
      </div>
      <Input
        placeholder="Search flashcard decks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {data === undefined ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground text-sm">
            Failed to load flashcard decks. Check database migrations and try
            again.
          </CardContent>
        </Card>
      ) : null}
      {Array.isArray(data) && data.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-muted-foreground text-sm">
            No flashcard decks are published yet.
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((deck) => (
          <Link href={`/flashcards/${deck.slug}`} key={deck.id}>
            <Card className="h-full transition hover:border-primary/60">
              <CardHeader>
                <CardTitle>{deck.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="line-clamp-3 text-muted-foreground">
                  {deck.description}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {deck.difficulty ? (
                    <Badge variant="secondary" className="capitalize">
                      {deck.difficulty}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">{deck.cardCount} cards</Badge>
                  {deck.estimatedMinutes ? (
                    <Badge variant="outline">{deck.estimatedMinutes} min</Badge>
                  ) : null}
                  {(deck.tags ?? []).slice(0, 2).map((tag: any) => (
                    <Badge key={tag.id} variant="outline">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
