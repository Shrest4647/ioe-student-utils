"use client";

import { CheckCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  targetProgramType: string;
  targetRegion: string;
}

interface Step1TemplateInfoProps {
  templateId: string;
}

export function Step1TemplateInfo({ templateId }: Step1TemplateInfoProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplate = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/recommendations/templates/${templateId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch template");
      const data = await response.json();
      setTemplate(data.data);
    } catch (error) {
      console.error("Error fetching template:", error);
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Template not found
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <CheckCircleIcon className="mt-1 h-6 w-6 text-primary" />
            <div className="flex-1">
              <h3 className="mb-2 font-semibold text-lg">{template.name}</h3>
              <p className="mb-4 text-muted-foreground">
                {template.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="secondary">{template.targetProgramType}</Badge>
                <Badge variant="outline">{template.targetRegion}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-sm">
        <p>
          This template will guide you through creating a professional
          recommendation letter. Click "Next" to start entering information
          about your recommender.
        </p>
      </div>
    </div>
  );
}
