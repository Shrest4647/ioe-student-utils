import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  ExternalLinkIcon,
  GlobeIcon,
  GraduationCapIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/server/db";
import { scholarships } from "@/server/db/schema";

export default async function ScholarshipDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const scholarship = (await db.query.scholarships.findFirst({
    where: eq(scholarships.slug, slug) as any,
    with: {
      countries: { with: { country: true } },
      degrees: { with: { degree: true } },
      fields: { with: { field: true } },
      rounds: {
        with: {
          events: {
            orderBy: (events, { asc }) => [asc(events.date)],
          },
        },
        orderBy: (rounds, { desc }) => [desc(rounds.createdAt)],
      },
    },
  })) as any;

  if (!scholarship) {
    notFound();
  }

  const activeRound =
    scholarship.rounds.find((r: any) => r.isActive) || scholarship.rounds[0];
  const deadline = activeRound?.deadlineDate
    ? new Date(activeRound.deadlineDate)
    : null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumbs / Back */}
      <Link
        href="/scholarships"
        className="mb-6 inline-flex items-center text-muted-foreground text-sm transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="mr-1.25 h-4 w-4" />
        Back to Scholarships
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {scholarship.fundingType && (
                <Badge className="px-3 py-1 font-semibold text-xs capitalize">
                  {scholarship.fundingType.replace("_", " ")}
                </Badge>
              )}
              {activeRound?.scholarshipAmount && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 font-semibold text-xs"
                >
                  {activeRound.scholarshipAmount}
                </Badge>
              )}
            </div>
            <h1 className="mb-2 font-extrabold text-4xl tracking-tight lg:text-5xl">
              {scholarship.name}
            </h1>
            <p className="text-muted-foreground text-xl">
              Provided by{" "}
              <span className="font-medium text-foreground">
                {scholarship.providerName || "Global Organization"}
              </span>
            </p>
          </div>

          <Card className="border-none bg-muted/30 shadow-none">
            <CardHeader>
              <CardTitle className="text-lg">About this Scholarship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {scholarship.description || "No description provided."}
              </div>
            </CardContent>
          </Card>

          {/* Rounds & Timeline Section if available */}
          {activeRound && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-2 font-bold text-2xl">
                <ClockIcon className="h-6 w-6 text-primary" />
                Application Timeline
              </h2>
              <div className="relative ml-3 space-y-8 border-muted border-l-2 py-2 pl-8">
                {/* Round Dates */}
                <TimelineItem
                  title="Applications Open"
                  date={
                    activeRound.openDate ? new Date(activeRound.openDate) : null
                  }
                  description="The official start of the application period."
                  isImportant
                />

                {/* Custom Events */}
                {activeRound.events?.map((event: any) => (
                  <TimelineItem
                    key={event.id}
                    title={event.name}
                    date={new Date(event.date)}
                    description={event.description}
                    type={event.type}
                  />
                ))}

                <TimelineItem
                  title="Deadline"
                  date={deadline}
                  description="Last date to submit your application."
                  isImportant
                  isDeadline
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg">Eligibility & Details</CardTitle>
              <CardDescription>Requirements to apply</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DetailGroup
                icon={<GlobeIcon className="h-5 w-5" />}
                label="Eligible Countries"
                values={scholarship.countries.map((c: any) => c.country.name)}
              />

              <DetailGroup
                icon={<GraduationCapIcon className="h-5 w-5" />}
                label="Degree Levels"
                values={scholarship.degrees.map((d: any) => d.degree.name)}
              />

              <DetailGroup
                icon={<BookOpenIcon className="h-5 w-5" />}
                label="Fields of Study"
                values={scholarship.fields.map((f: any) => f.field.name)}
              />
            </CardContent>
            <CardHeader className="pt-0">
              {scholarship.websiteUrl && (
                <Button asChild className="w-full">
                  <Link
                    href={scholarship.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Official Website{" "}
                    <ExternalLinkIcon className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailGroup({
  icon,
  label,
  values,
}: {
  icon: React.ReactNode;
  label: string;
  values: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-semibold text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {values.length > 0 ? (
          values.map((v) => (
            <Badge
              key={`detail-${v}`}
              variant="outline"
              className="font-bold text-[10px] uppercase tracking-tight"
            >
              {v}
            </Badge>
          ))
        ) : (
          <span className="text-muted-foreground text-xs italic">Any</span>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  description,
  isImportant,
  isDeadline,
  type,
}: {
  title: string;
  date: Date | null;
  description: string | null;
  isImportant?: boolean;
  isDeadline?: boolean;
  type?: string;
}) {
  if (!date) return null;

  return (
    <div className="relative">
      {/* Dot */}
      <div
        className={`absolute top-1.5 -left-10 h-4 w-4 rounded-full border-4 bg-background ${isDeadline ? "border-red-500" : isImportant ? "border-primary" : "border-muted-foreground/30"}`}
      />

      <div className="space-y-1">
        <div className="flex flex-col justify-between gap-1 md:flex-row md:items-baseline">
          <h3
            className={`font-bold ${isImportant ? "text-foreground" : "text-foreground/80"}`}
          >
            {title}
            {type && type !== "deadline" && (
              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground uppercase">
                {type}
              </span>
            )}
          </h3>
          <time className="font-medium text-muted-foreground text-sm tabular-nums">
            {format(date, "MMMM d, yyyy")}
          </time>
        </div>
        {description && (
          <p
            className="line-clamp-2 text-muted-foreground text-sm"
            title={description}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
