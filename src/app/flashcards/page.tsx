"use client";

import { ArrowRight, BookOpen, Clock3, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import {
  FlashcardSkeleton,
  useFlashcardDeckList,
} from "@/components/flashcard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function FlashcardCatalogPage() {
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(new URLSearchParams(window.location.search).get("q") ?? "");
  }, []);
  const [debounced] = useDebounceValue(search, 250);
  const { data, isLoading, error, refetch } = useFlashcardDeckList({
    search: debounced,
    status: "published",
  });

  if (isLoading) return <FlashcardSkeleton />;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="grid gap-6 border-b pb-7 sm:grid-cols-[1fr_minmax(18rem,24rem)] sm:items-end">
        <div>
          <p className="font-medium text-primary text-sm">
            Learn for the long term
          </p>
          <h1 className="mt-1 font-semibold text-3xl tracking-tight sm:text-4xl">
            Flashcards
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground text-sm leading-6">
            Adaptive review brings back difficult material before you forget it.
          </p>
        </div>
        <label htmlFor="flashcard-search" className="relative block">
          <span className="sr-only">Search flashcard decks</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="flashcard-search"
            className="h-10 pl-9"
            placeholder="Search decks"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </header>

      {error ? (
        <section className="py-16 text-center">
          <h2 className="font-semibold text-lg">Decks could not be loaded</h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Check your connection and try once more.
          </p>
          <Button className="mt-5" onClick={() => void refetch()}>
            Try again
          </Button>
        </section>
      ) : null}

      {!error && (data?.length ?? 0) === 0 ? (
        <section className="py-16 text-center">
          <BookOpen className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-4 font-semibold text-lg">
            {search ? "No matching decks" : "No decks are published yet"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm">
            {search
              ? "Try a subject, course, or shorter keyword."
              : "Published study material will appear here."}
          </p>
          {search ? (
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => setSearch("")}
            >
              Clear search
            </Button>
          ) : null}
        </section>
      ) : null}

      {!error && (data?.length ?? 0) > 0 ? (
        <section aria-label="Flashcard decks" className="divide-y">
          {data?.map((deck) => (
            <Link
              href={`/flashcards/${deck.slug}`}
              key={deck.id}
              className="group grid gap-3 py-5 outline-none transition-colors hover:bg-muted/30 focus-visible:bg-muted/40 sm:grid-cols-[1fr_auto] sm:items-center sm:px-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-base group-hover:text-primary">
                    {deck.title}
                  </h2>
                  {deck.difficulty ? (
                    <Badge variant="secondary" className="capitalize">
                      {deck.difficulty}
                    </Badge>
                  ) : null}
                </div>
                {deck.description ? (
                  <p className="mt-1 line-clamp-2 max-w-[70ch] text-muted-foreground text-sm leading-6">
                    {deck.description}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                  <span>{deck.cardCount} cards</span>
                  {deck.estimatedMinutes ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" /> {deck.estimatedMinutes}{" "}
                      min
                    </span>
                  ) : null}
                  {deck.tags.slice(0, 3).map((tag) => (
                    <span key={tag.id}>{tag.name}</span>
                  ))}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 font-medium text-primary text-sm sm:justify-self-end">
                Study{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </section>
      ) : null}
    </main>
  );
}
