"use client";

import { BookOpen, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceFilters } from "./resource-filters";

export interface ResourceLibraryFilters {
  category: string;
  contentType: string;
  search: string;
  limit: string;
}

interface ResourceHeroProps {
  categories: { id: string; name: string }[];
  contentTypes: { id: string; name: string }[];
  filters: ResourceLibraryFilters;
  setFilters: (filters: ResourceLibraryFilters) => void;
}

export function ResourceHero({
  categories,
  contentTypes,
  filters,
  setFilters,
}: ResourceHeroProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <section className="border-b bg-muted/25">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2 text-primary">
              <BookOpen className="size-4" aria-hidden="true" />
              <span className="font-semibold text-xs uppercase tracking-[0.14em]">
                Student resource library
              </span>
            </div>
            <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
              Find the right material, faster
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
              Search notes, books, guides, tools, and templates shared for IOE
              study and applications.
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Have something useful?{" "}
            <Link
              href="/dashboard/resources"
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
            >
              Contribute a resource
            </Link>
          </p>
        </div>

        <div className="mt-5 rounded-xl border bg-background p-2 shadow-sm">
          <div className="flex min-w-0 items-center">
            <Search
              className="ml-2 size-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              ref={searchRef}
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters({ ...filters, search: event.target.value })
              }
              placeholder="Search by title, topic, or keyword"
              aria-label="Search resources"
              className="h-11 border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0 md:text-sm"
            />
            {filters.search ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mr-1 shrink-0"
                onClick={() => setFilters({ ...filters, search: "" })}
                aria-label="Clear search"
              >
                <X />
              </Button>
            ) : (
              <kbd className="mr-2 hidden rounded border bg-muted px-2 py-0.5 font-mono text-muted-foreground text-xs sm:inline-block">
                /
              </kbd>
            )}
          </div>
          <ResourceFilters
            categories={categories}
            contentTypes={contentTypes}
            filters={filters}
            setFilters={setFilters}
          />
        </div>
      </div>
    </section>
  );
}
