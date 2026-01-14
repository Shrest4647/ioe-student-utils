"use client";

import { motion, useInView } from "framer-motion";
import {
  BookOpen,
  Briefcase,
  Calculator,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  Library,
  Link as LinkIcon,
  PenTool,
  Search,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "University Finder",
    description:
      "Find universities accepting TU credits and their requirements.",
    href: "/universities",
  },
  {
    icon: Calculator,
    title: "GPA Calculator",
    description:
      "Convert TU percentage to US 4.0 GPA using WES/Scholaro logic.",
    href: "/gpa-converter",
  },
  {
    icon: GraduationCap,
    title: "Scholarship Database",
    description: "Explore global scholarships for international students.",
    href: "/scholarships",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description:
      "Create professional resumes tailored for international applications.",
    href: "/dashboard/resume-builder/create",
  },
  {
    icon: PenTool,
    title: "Letter of Recommendation",
    description:
      "Generate professional letters of recommendation for international applications.",
    href: "/dashboard/recommendations",
  },
  {
    icon: LinkIcon,
    title: "Course Equivalency",
    description:
      "Find equivalent courses for TU subjects in international universities.",
    href: "/courses",
  },
  {
    icon: Users,
    title: "Alumni Network",
    description:
      "Connect with alumni for insights and advice on international education.",
  },
  {
    icon: Briefcase,
    title: "Career Guidance",
    description:
      "Resources and advice on career paths, job markets, and industry trends.",
  },
  {
    icon: Target,
    title: "Subject Selector",
    description:
      "Select subjects for 7th and 8th semesters based on interests and goals.",
  },
  {
    icon: Clock,
    title: "Credit Calculator",
    description: "Convert TU hours (L-T-P) to standard international credits.",
  },
  {
    icon: BookOpen,
    title: "Syllabus Explorer",
    description: "Detailed breakdown of BCT subjects and marks distribution.",
  },
  {
    icon: Calendar,
    title: "Study Planner",
    description:
      "Plan and track study/application schedules, including exam dates and goals.",
    href: "/scholarships/calendar",
  },
  {
    icon: Library,
    title: "Resources Library",
    description:
      "Collection of study materials, past papers, and other resources.",
    href: "/resources",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
};

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="px-4 py-16" id="features">
      <div ref={ref} className="mx-auto max-w-6xl">
        <motion.h2
          className="mb-12 text-center font-bold text-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          Features
        </motion.h2>
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((feature) => (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2 },
                }}
              >
                {feature.href ? (
                  <Link href={feature.href}>
                    <Card className="h-full cursor-pointer text-center transition-shadow hover:shadow-lg">
                      <CardHeader>
                        <motion.div
                          className="mx-auto mb-4"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <feature.icon
                            aria-hidden="true"
                            className="h-12 w-12 text-primary"
                          />
                        </motion.div>
                        <CardTitle>{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ) : (
                  <Card className="h-full text-center transition-shadow hover:shadow-lg">
                    <CardHeader>
                      <motion.div
                        className="mx-auto mb-4"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon
                          aria-hidden="true"
                          className="h-12 w-12 text-primary"
                        />
                      </motion.div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ))}
        </motion.div>
      </div>
    </section>
  );
}
