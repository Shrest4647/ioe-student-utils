import { StudyPlannerDashboard } from "@/components/study-planner/StudyPlannerDashboard";
import type { StudyPlanSeed } from "@/types/study-planner";

export default async function StudyPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{
    course?: string;
    topics?: string;
    focus?: string;
    targetDate?: string;
  }>;
}) {
  const { course, topics, focus, targetDate } = await searchParams;
  const initialSeed: StudyPlanSeed | undefined = course
    ? {
        courseSlug: course,
        topicSlugs: (topics ?? "")
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        focusMode: isFocusMode(focus) ? focus : undefined,
        targetDate,
      }
    : undefined;

  return <StudyPlannerDashboard initialSeed={initialSeed} />;
}

function isFocusMode(
  value: string | undefined,
): value is NonNullable<StudyPlanSeed["focusMode"]> {
  return (
    value === "overview" ||
    value === "exam" ||
    value === "essentials" ||
    value === "full"
  );
}
