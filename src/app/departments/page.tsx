import { Loader2 } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { DepartmentFilters } from "@/components/departments/department-filters";
import { DepartmentList } from "@/components/departments/department-list";

export const metadata: Metadata = {
  title: "Departments | IOE Student Utils",
  description:
    "Explore and rate academic departments. Share your experiences and help fellow students make informed decisions.",
};

export const dynamic = "force-dynamic";

export default function DepartmentsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-start gap-4">
          <div>
            <h1 className="mb-2 bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
              Departments
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Explore and rate academic departments. Share your experiences and
              help fellow students make informed decisions.
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
          <DepartmentFilters />

          <div className="min-h-125">
            <DepartmentList />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
