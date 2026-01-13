"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { CourseCard } from "@/components/courses/course-card";
import {
  useCollegeDepartmentProgramCourses,
  useCollegeDepartmentsBySlug,
  useDepartment,
  useProgram,
} from "@/hooks/use-content";

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
        {
          label: resolvedParams.programCode,
          href: `/colleges/${resolvedParams.slug}/departments/${resolvedParams.departmentSlug}/programs/${resolvedParams.programCode}`,
        },
        { label: "Courses", href: "" },
      ]}
    />
  );
}

function CoursesContent() {
  const resolvedParams = useParams<{
    slug: string;
    departmentSlug: string;
    programCode: string;
  }>();
  const { data: college } = useCollegeDepartmentsBySlug(resolvedParams.slug);
  const { data: department } = useDepartment(resolvedParams.departmentSlug);
  const { data: program } = useProgram(resolvedParams.programCode);

  const { data: courses, isLoading } = useCollegeDepartmentProgramCourses(
    resolvedParams.slug,
    resolvedParams.departmentSlug,
    resolvedParams.programCode,
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
  };

  if (!college || !department || !program) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Content not found</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No courses found</p>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        className="text-muted-foreground text-sm"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        key={`count-${courses.length}`}
      >
        Showing {courses.length} courses
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {courses.map((courseData: any) => (
            <motion.div
              key={courseData.id}
              variants={item}
              layout
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <CourseCard
                course={courseData.course || courseData}
                entityType="collegeDepartmentProgramCourse"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export { BreadcrumbsContent, CoursesContent };
