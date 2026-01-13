"use client";

import { AnimatePresence, motion } from "framer-motion";

import { use } from "react";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import {
  useCollegeDepartmentPrograms,
  useCollegeDepartmentsBySlug,
  useDepartment,
} from "@/hooks/use-content";
import { ProgramCard } from "../programs/program-card";

function BreadcrumbsContent({
  params,
}: {
  params: Promise<{ slug: string; departmentSlug: string }>;
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
        { label: "Programs", href: "" },
      ]}
    />
  );
}

function CollegeDepartmentProgramsContent({
  params,
}: {
  params: Promise<{ slug: string; departmentSlug: string }>;
}) {
  const resolvedParams = use(params);
  const { data: college } = useCollegeDepartmentsBySlug(resolvedParams.slug);
  const { data: department } = useDepartment(resolvedParams.departmentSlug);

  if (!college || !department) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Content not found</p>
        </div>
      </div>
    );
  }

  return (
    <CollegeProgramListContent
      collegeId={college.id}
      departmentId={department.id}
    />
  );
}

function CollegeProgramListContent({
  collegeId,
  departmentId,
}: {
  collegeId: string;
  departmentId: string;
}) {
  const { data: programs, isLoading } = useCollegeDepartmentPrograms(
    collegeId,
    departmentId,
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No programs found</p>
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
        key={`count-${programs.length}`}
      >
        Showing {programs.length} programs
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {programs.map((program) => (
            <motion.div
              key={program.id}
              variants={item}
              layout
              transition={{
                layout: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              <ProgramCard
                program={{
                  id: program.id,
                  name: program.program?.name || "",
                  code: program.program?.code || program?.code || "",
                  description:
                    program.description || program.program?.description || "",
                  credits: program.credits || program.program?.credits || "",
                  isActive:
                    program.isActive || program.program?.isActive || false,
                  createdAt: program.program?.createdAt || null,
                  degreeLevels: program.program?.degreeLevels || null,
                }}
                entityType="collegeDepartmentProgram"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export { BreadcrumbsContent, CollegeDepartmentProgramsContent };
