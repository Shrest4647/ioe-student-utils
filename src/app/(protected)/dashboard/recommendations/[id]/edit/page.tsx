import { use } from "react";
import { RecommendationWizard } from "@/components/recommendations/wizard/recommendation-wizard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditLetterPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto py-6">
      <RecommendationWizard editMode letterId={id} />
    </div>
  );
}
