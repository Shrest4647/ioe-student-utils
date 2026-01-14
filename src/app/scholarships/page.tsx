import { CalendarIcon, Loader2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ScholarshipFilters } from "@/components/scholarships/scholarship-filters";
import { ScholarshipList } from "@/components/scholarships/scholarship-list";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";

export const metadata: Metadata = {
  title: "Scholarships | IOE Student Utils",
  description:
    "Find scholarships, grants, and funding opportunities for your studies.",
};

export const dynamic = "force-dynamic";

export default async function ScholarshipsPage() {
  // Fetch taxonomy filters server-side for initial render
  const [allCountries, allDegrees, allFields] = await Promise.all([
    db.query.countries.findMany({ orderBy: (t, { asc }) => [asc(t.name)] }),
    db.query.degreeLevels.findMany({ orderBy: (t, { asc }) => [asc(t.rank)] }),
    db.query.fieldsOfStudy.findMany({ orderBy: (t, { asc }) => [asc(t.name)] }),
  ]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
              Global Scholarships
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore funding opportunities for your higher education journey.
              Filter by country, degree, or field of study.
            </p>
          </div>
          <Link href="/scholarships/calendar">
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              View Calendar
            </Button>
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ScholarshipFilters
            countries={allCountries}
            degrees={allDegrees}
            fields={allFields}
          />

          <div className="min-h-[500px]">
            <ScholarshipList />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
