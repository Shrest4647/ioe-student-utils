"use client";

import { ArrowRight, BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { QuizSkeleton } from "@/components/quiz";
import { useQuizList } from "@/components/quiz/use-quiz-data";
import { Input } from "@/components/ui/input";

function QuizCatalog() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [debounced] = useDebounceValue(search, 300);
  const { data, isLoading } = useQuizList({
    search: debounced,
    status: "published",
  });

  if (isLoading) return <QuizSkeleton />;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-2xl">
        <p className="mb-2 font-medium text-primary text-sm">Study sessions</p>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          Practice what you are learning
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Each session reshuffles questions and adapts to the topics that need
          more attention.
        </p>
      </div>

      <div className="relative mt-8 max-w-xl">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search quizzes"
          className="h-11 pl-9"
          placeholder="Search by subject or topic"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {(data ?? []).length > 0 ? (
        <div className="mt-8 divide-y border-y">
          {(data ?? []).map((quiz) => (
            <Link
              href={`/quiz/${quiz.slug}`}
              key={quiz.id}
              className="group flex items-start gap-4 py-5 outline-none transition-colors hover:bg-muted/35 focus-visible:bg-muted/50 sm:px-3"
            >
              <span className="mt-0.5 hidden size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground sm:grid">
                <BookOpen className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-base">{quiz.title}</span>
                  {quiz.difficulty ? (
                    <span className="text-muted-foreground text-xs capitalize">
                      {quiz.difficulty}
                    </span>
                  ) : null}
                </span>
                {quiz.description ? (
                  <span className="mt-1 line-clamp-2 block max-w-[68ch] text-muted-foreground text-sm leading-relaxed">
                    {quiz.description}
                  </span>
                ) : null}
                <span className="mt-2 flex gap-3 text-muted-foreground text-xs">
                  <span>{quiz.questionCount} questions</span>
                  {quiz.estimatedMinutes ? (
                    <span>{quiz.estimatedMinutes} min</span>
                  ) : null}
                </span>
              </span>
              <ArrowRight className="mt-3 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed px-5 py-10 text-center">
          <BookOpen className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-3 font-medium">No study sessions found</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Try a broader subject or clear your search.
          </p>
        </div>
      )}
    </main>
  );
}

export default function QuizCatalogPage() {
  return (
    <Suspense fallback={<QuizSkeleton />}>
      <QuizCatalog />
    </Suspense>
  );
}
