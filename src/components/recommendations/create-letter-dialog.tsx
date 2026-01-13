"use client";

import { useQuery } from "@tanstack/react-query";
import { BriefcaseIcon, GraduationCapIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  targetProgramType: string;
  targetRegion: string;
}

interface CreateLetterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLetterDialog({
  open,
  onOpenChange,
}: CreateLetterDialogProps) {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [programTypeFilter, setProgramTypeFilter] = useState<string>("all");

  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendation-templates", categoryFilter, programTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("isActive", "true");
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (programTypeFilter !== "all") {
        params.append("targetProgramType", programTypeFilter);
      }

      const { data, error } = await apiClient.api.recommendations.templates.get(
        {
          query: Object.fromEntries(params),
        }
      );

      if (error) {
        throw new Error("Failed to fetch templates");
      }

      return data?.data || [];
    },
    enabled: open,
  });

  // Show error toast if query fails
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    }
  }, [error]);

  const handleSelectTemplate = () => {
    if (!selectedTemplate) return;

    // Navigate to the wizard page with the selected template
    router.push(
      `/dashboard/recommendations/new?templateId=${selectedTemplate}`
    );
    onOpenChange(false);
  };

  const filteredTemplates = (templates as Template[]).filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "research":
      case "academic":
        return <GraduationCapIcon className="h-5 w-5" />;
      case "industry":
        return <BriefcaseIcon className="h-5 w-5" />;
      default:
        return <GraduationCapIcon className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "research":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "academic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "industry":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "general":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
      case "country_specific":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] min-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Recommendation Letter</DialogTitle>
          <DialogDescription>
            Choose a template to get started with your recommendation letter
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="country_specific">
                  Country-Specific
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={programTypeFilter}
              onValueChange={setProgramTypeFilter}
            >
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Program Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
                <SelectItem value="masters">Master's</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="any">Any</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No templates found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(filteredTemplates as Template[]).map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          <CardTitle className="text-base">
                            {template.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={getCategoryColor(template.category)}
                      >
                        {template.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {template.targetProgramType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.targetRegion}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSelectTemplate} disabled={!selectedTemplate}>
            Continue with Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
