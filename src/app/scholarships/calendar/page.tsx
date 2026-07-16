import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ScholarshipCalendar } from "@/components/scholarships/scholarship-calendar";

export const metadata: Metadata = {
  title: "Scholarship Calendar | IOE Student Utils",
  description:
    "Search and track scholarship deadlines, openings, interviews, webinars, and results.",
};

export default function ScholarshipCalendarPage() {
  return (
    <div className="mx-auto w-full max-w-400 px-3 py-6 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
          Scholarship Calendar
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground text-sm sm:text-base">
          Find every important date, then open the scholarship when you are
          ready to act.
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
