"use client";

import { useEffect, useState } from "react";
import {
  type Resource,
  ResourceCard,
} from "@/components/resources/resource-card";
import { ResourceFilters } from "@/components/resources/resource-filters";
import { ResourceGrid } from "@/components/resources/resource-grid";
import { ResourceHero } from "@/components/resources/resource-hero";
import { apiClient } from "@/lib/eden";

export default function ResourceLibraryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [contentTypes, setContentTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    contentType: "",
    search: "",
  });

  // Fetch initial data (Categories and Content Types)
  useEffect(() => {
    async function fetchMetadata() {
      const [catRes, ctRes] = await Promise.all([
        apiClient.api.resources.categories.get(),
        apiClient.api.resources["content-types"].get(),
      ]);

      if (catRes.data?.success) setCategories(catRes.data.data as any);
      if (ctRes.data?.success) setContentTypes(ctRes.data.data as any);
    }
    fetchMetadata();
  }, []);

  // Fetch resources when filters change
  useEffect(() => {
    async function fetchResources() {
      setIsLoading(true);
      const { data } = await apiClient.api.resources.get({
        query: {
          category: filters.category || undefined,
          contentType: filters.contentType || undefined,
          search: filters.search || undefined,
        },
      });

      if (data?.success) {
        setResources(data.data as any);
      }
      setIsLoading(false);
    }

    const timer = setTimeout(() => {
      fetchResources();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [filters]);

  const featuredResources = resources.filter((r: any) => r.isFeatured);

  return (
    <div className="min-h-screen bg-background">
      <ResourceHero />

      <main className="container mx-auto px-4 py-12">
        {featuredResources.length > 0 && (
          <div className="mb-20">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-orange-500" />
              <h2 className="font-bold text-3xl tracking-tight">
                Featured Resources
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featuredResources.slice(0, 3).map((resource) => (
                <div
                  key={`featured-${resource.id}`}
                  className="transform transition-transform hover:scale-[1.02]"
                >
                  <ResourceCard resource={resource} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-12">
          <ResourceFilters
            categories={categories}
            contentTypes={contentTypes}
            filters={filters}
            setFilters={setFilters}
          />
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-bold text-2xl">
            {isLoading
              ? "Finding resources..."
              : `${resources.length} resources found`}
          </h2>
        </div>

        <ResourceGrid resources={resources} isLoading={isLoading} />
      </main>
    </div>
  );
}
