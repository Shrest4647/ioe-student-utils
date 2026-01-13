"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import type { Resource } from "@/components/resources/resource-card";
import { ResourceDetail } from "@/components/resources/resource-detail";
import { apiClient } from "@/lib/eden";

export default function ResourceDetailPage() {
  const params = useParams();
  const resourceId = params.id as string;

  const {
    data: resource,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: async (): Promise<Resource> => {
      // Use the dynamic route properly
      const response = await (apiClient.api.resources as any)[resourceId].get();

      if (response.data?.success) {
        // Transform the data to match our Resource type
        const item = response.data.data as any;
        return {
          ...item,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        };
      }

      throw new Error("Failed to fetch resource");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return <ResourceDetail.Skeleton />;
  }

  if (isError || !resource) {
    notFound();
  }

  return <ResourceDetail resource={resource} />;
}
