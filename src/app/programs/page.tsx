import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ProgramFilters } from "@/components/programs/program-filters";
import { ProgramList } from "@/components/programs/program-list";

export const metadata: Metadata = {
  title: "Programs | IOE Student Utils",
  description:
    "Explore and rate academic programs. Share your experiences and help fellow students make informed decisions.",
};

export const dynamic = "force-dynamic";

export default function ProgramsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-4">
          <div>
            <h1 className="mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
              Academic Programs
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore and rate academic programs across various degree levels.
              Share your experiences and help fellow students make informed
              decisions.
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ProgramFilters />

          <div className="min-h-125">
            <ProgramList />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
