import { use } from "react";
import { RecommendationWizard } from "@/components/recommendations/wizard/recommendation-wizard";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Render the RecommendationWizard in edit mode for the specified letter.
 *
 * @param params - Object with an `id` string identifying the letter to edit
 * @returns The page element containing the recommendation editor for that letter
 */
export default function EditLetterPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <div className="container mx-auto py-6">
      <RecommendationWizard editMode letterId={id} />
    </div>
  );
}
