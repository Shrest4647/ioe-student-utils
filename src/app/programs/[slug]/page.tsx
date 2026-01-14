"use client";

import { Loader2 } from "lucide-react";
import { Suspense, use } from "react";
import { ProgramDetail } from "@/components/programs/program-detail";
import { useAuth } from "@/hooks/use-auth";
import { useProgram } from "@/hooks/use-content";

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { data: program, isLoading } = useProgram(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Program not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Suspense
        fallback={
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        }
      >
        <ProgramDetail program={program} user={user} />
      </Suspense>
    </div>
  );
}
