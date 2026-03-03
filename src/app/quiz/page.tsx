"use client";

import Link from "next/link";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { QuizSkeleton } from "@/components/quiz";
import { useQuizList } from "@/components/quiz/use-quiz-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function QuizCatalogPage() {
  const [search, setSearch] = useState("");
  const [debounced] = useDebounceValue(search, 300);
  const { data, isLoading } = useQuizList({
    search: debounced,
    status: "published",
  });

  if (isLoading) return <QuizSkeleton />;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-bold text-3xl">Quizzes</h1>
        <p className="text-muted-foreground">
          Practice with interactive quizzes and track your results.
        </p>
      </div>
      <Input
        placeholder="Search quizzes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((quiz) => (
          <Link href={`/quiz/${quiz.slug}`} key={quiz.id}>
            <Card className="h-full transition hover:border-primary/60">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="line-clamp-3 text-muted-foreground">
                  {quiz.description}
                </p>
                <div className="flex items-center gap-2">
                  {quiz.difficulty ? (
                    <Badge variant="secondary" className="capitalize">
                      {quiz.difficulty}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {quiz.questionCount} questions
                  </Badge>
                  {quiz.estimatedMinutes ? (
                    <Badge variant="outline">{quiz.estimatedMinutes} min</Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
