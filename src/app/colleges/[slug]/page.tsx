"use client";

import { Loader2 } from "lucide-react";
import { Suspense, use } from "react";
import { CollegeDetail } from "@/components/colleges/college-detail";
import { useAuth } from "@/hooks/use-auth";
import { useCollege } from "@/hooks/use-content";

interface CollegePageProps {
  params: Promise<{ slug: string }>;
}

export default function CollegePage({ params }: CollegePageProps) {
  const { slug } = use(params);
  const { user } = useAuth();
  const { data: college, isLoading } = useCollege(slug);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">College not found</p>
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
        <CollegeDetail college={college} user={user} />
      </Suspense>
    </div>
  );
}
