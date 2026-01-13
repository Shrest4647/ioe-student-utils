"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";

interface Step1TemplateInfoProps {
  templateId: string;
}

export function Step1TemplateInfo({ templateId }: Step1TemplateInfoProps) {
  const { data: template, isLoading } = useQuery({
    queryKey: ["recommendation-template", templateId],
    queryFn: async () => {
      const { data, error } = await apiClient.api.recommendations
        .templates({
          id: templateId,
        })
        .get();

      if (error) {
        throw new Error("Failed to fetch template");
      }

      return data?.data;
    },
    enabled: !!templateId,
  });

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
