"use client";

import { Loader2 } from "lucide-react";
import { Suspense, use } from "react";
import { UniversityDetail } from "@/components/universities/university-detail";
import { useAuth } from "@/hooks/use-auth";
import { useUniversity } from "@/hooks/use-universities";

interface UniversityPageProps {
  params: Promise<{ slug: string }>;
}

export default function UniversityPage({ params }: UniversityPageProps) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { data: university, isLoading } = useUniversity(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              University not found
            </p>
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
        <UniversityDetail university={university} user={user} />
      </Suspense>
    </div>
  );
}
