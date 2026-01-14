"use client";

import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProgramDetail } from "@/components/programs/program-detail";
import { useAuth } from "@/hooks/use-auth";
import { useCollegeDepartmentProgram } from "@/hooks/use-content";

function BreadcrumbsContent({
  params,
}: {
  params: Promise<{
    slug: string;
    departmentSlug: string;
    programCode: string;
  }>;
}) {
  const resolvedParams = use(params);
  return (
    <Breadcrumbs
      items={[
        { label: "Colleges", href: "/colleges" },
        {
          label: resolvedParams.slug,
          href: `/colleges/${resolvedParams.slug}`,
        },
        {
          label: "Departments",
          href: `/colleges/${resolvedParams.slug}/departments`,
        },
        {
          label: resolvedParams.departmentSlug,
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}`,
        },
        {
          label: "Programs",
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}/programs`,
        },
        { label: resolvedParams.programCode, href: "" },
      ]}
    />
  );
}

function ProgramDetailContent() {
  const resolvedParams = useParams<{
    slug: string;
    departmentSlug: string;
    programCode: string;
  }>();
  const { user } = useAuth();
  const { data: program, isLoading } = useCollegeDepartmentProgram(
    resolvedParams.slug,
    resolvedParams.departmentSlug,
    resolvedParams.programCode,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Program not found</p>
        </div>
      </div>
    );
  }
  const programData = {
    id: program.id,
    name: program.program?.name || "",
    code: program.code || program.program?.code || "",
    description: program.description || program.program?.description || "",
    credits: program.credits || program.program?.credits || "",
    isActive: program.isActive || program.program?.isActive || false,
    createdAt: program.program?.createdAt || null,
    updatedAt: program.program?.updatedAt || null,
    degreeLevels: program.program?.degreeLevels || null,
    collegeDepartments: [],
  };

  return (
    <ProgramDetail
      program={programData}
      user={user}
      entityType="collegeDepartmentProgram"
    />
  );
}

export { BreadcrumbsContent, ProgramDetailContent };
