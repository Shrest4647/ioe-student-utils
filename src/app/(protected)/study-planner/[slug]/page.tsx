import { StudyPlanWorkspace } from "@/components/study-planner/StudyPlanWorkspace";

export default async function StudyPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StudyPlanWorkspace slug={slug} />;
}
