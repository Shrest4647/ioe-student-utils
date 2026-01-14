"use client";

import { Loader2 } from "lucide-react";
import { use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { CourseCard } from "@/components/courses/course-card";
import { useCollegeDeptProgramCourse } from "@/hooks/use-content";

function BreadcrumbsContent({
  params,
}: {
  params: Promise<{
    slug: string;
    departmentSlug: string;
    programCode: string;
    courseCode: string;
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
        {
          label: resolvedParams.programCode,
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}/programs/${resolvedParams.programCode}`,
        },
        {
          label: "Courses",
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}/programs/${resolvedParams.programCode}/courses/`,
        },
        { label: resolvedParams.courseCode, href: "" },
      ]}
    />
  );
}

function CourseDetailContent({
  params,
}: {
  params: Promise<{
    slug: string;
    departmentSlug: string;
    programCode: string;
    courseCode: string;
  }>;
}) {
  const resolvedParams = use(params);

  const { data: course, isLoading } = useCollegeDeptProgramCourse(
    resolvedParams.slug,
    resolvedParams.departmentSlug,
    resolvedParams.programCode,
    resolvedParams.courseCode,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <CourseCard
      course={{
        id: course.id,
        name: course.course?.name || "",
        code: course.code || course.course?.code || "",
        description: course.description || course.course?.description || "",
        credits: course.credits || course.course?.credits || "",
        isActive: course.isActive || course.course?.isActive || false,
        createdAt: course.course?.createdAt || "",
      }}
      entityType="collegeDepartmentProgramCourse"
    />
  );
}

export { BreadcrumbsContent, CourseDetailContent };
