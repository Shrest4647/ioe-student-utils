import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ScholarshipCalendar } from "@/components/scholarships/scholarship-calendar";

export const metadata: Metadata = {
  title: "Scholarship Calendar | IOE Student Utils",
  description: "View scholarship deadlines and events on a calendar.",
};

export default function ScholarshipCalendarPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
          Scholarship Calendar
        </h1>
        <p className="text-lg text-muted-foreground">
          Track upcoming application deadlines, webinars, and interview dates.
        </p>
      </div>
      <Suspense
        fallback={
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        }
      >
        <ScholarshipCalendar />
      </Suspense>
    </div>
  );
}
