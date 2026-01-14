import { GraduationCap, Tags } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ScholarshipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="font-bold text-3xl tracking-tight">
            Scholarship Management
          </h1>
          <p className="text-muted-foreground">
            Manage scholarships, application rounds, and taxonomy data.
          </p>
        </div>
        <nav className="flex items-center gap-1 rounded-lg border bg-background p-1 shadow-sm">
          <Link
            href="/dashboard/scholarships"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm transition-colors hover:bg-muted",
              "bg-background text-foreground shadow-sm", // Active state logic can be added here or via client component
            )}
          >
            <GraduationCap className="h-4 w-4" />
            Scholarships
          </Link>
          <Link
            href="/dashboard/scholarships/taxonomy"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 font-medium text-sm transition-colors hover:bg-muted",
            )}
          >
            <Tags className="h-4 w-4" />
            Taxonomy
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
