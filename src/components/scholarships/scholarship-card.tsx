import { format } from "date-fns";
import { CalendarIcon, GlobeIcon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define flexible type matching the API response structure
export interface Scholarship {
  id: string;
  name: string;
  slug: string;
  providerName: string | null;
  fundingType: "fully_funded" | "partial" | "tuition_only" | null;
  countries: { country: { name: string; code: string } }[];
  degrees: { degree: { name: string } }[];
  fields: { field: { name: string } }[];
  rounds: {
    roundName: string | null;
    deadlineDate: string | Date | null;
    scholarshipAmount: string | null;
  }[];
  createdAt: string | Date;
}

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

export function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const activeRound = scholarship.rounds[0];
  const deadline = activeRound?.deadlineDate
    ? new Date(activeRound.deadlineDate)
    : null;

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardDescription className="font-medium text-muted-foreground/80 text-xs uppercase tracking-wider">
              {scholarship.providerName || "Unknown Provider"}
            </CardDescription>
            <CardTitle className="line-clamp-2 text-lg leading-tight">
              <Link
                href={`/scholarships/${scholarship.slug}`}
                className="decoration-primary underline-offset-4 hover:underline"
              >
                {scholarship.name}
              </Link>
            </CardTitle>
          </div>
          {scholarship.fundingType && (
            <Badge
              variant={
                scholarship.fundingType === "fully_funded"
                  ? "default"
                  : "secondary"
              }
              className="shrink-0 capitalize"
            >
              {scholarship.fundingType.replace("_", " ")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Key Details Grid */}
        <div className="grid gap-2 text-muted-foreground text-sm">
          {/* Countries */}
          {scholarship.countries.length > 0 && (
            <div className="flex items-start gap-2">
              <GlobeIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex flex-wrap gap-1">
                {scholarship.countries.slice(0, 3).map((c, i) => (
                  <span key={i} className="text-foreground/90">
                    {c.country.name}
                    {i < scholarship.countries.length - 1 && i < 2 ? "," : ""}
                  </span>
                ))}
                {scholarship.countries.length > 3 && (
                  <span className="text-muted-foreground text-xs">
                    +{scholarship.countries.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Degrees */}
          {scholarship.degrees.length > 0 && (
            <div className="flex items-center gap-2">
              <GraduationCapIcon className="h-4 w-4 shrink-0" />
              <span className="text-foreground/90">
                {scholarship.degrees.map((d) => d.degree.name).join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* Tags for Fields */}
        {scholarship.fields.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {scholarship.fields.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground text-xs"
              >
                {f.field.name}
              </span>
            ))}
            {scholarship.fields.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
                +{scholarship.fields.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          {deadline ? (
            <div className="flex items-center gap-1.5 font-medium text-amber-600">
              <CalendarIcon className="h-4 w-4" />
              <span>Deadline: {format(deadline, "MMM d, yyyy")}</span>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs italic">
              No active deadline
            </div>
          )}

          {activeRound?.scholarshipAmount && (
            <span
              className="max-w-[40%] truncate text-muted-foreground text-xs"
              title={activeRound.scholarshipAmount}
            >
              {activeRound.scholarshipAmount}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
