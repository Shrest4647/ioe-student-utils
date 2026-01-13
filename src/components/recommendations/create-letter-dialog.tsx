"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { SearchIcon, GraduationCapIcon, BriefcaseIcon } from "lucide-react";
import { toast } from "sonner";

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
  onLetterCreated?: () => void;
}

export function CreateLetterDialog({
  open,
  onOpenChange,
  onLetterCreated,
}: CreateLetterDialogProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [programTypeFilter, setProgramTypeFilter] = useState<string>("all");

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, categoryFilter, programTypeFilter]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("isActive", "true");
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (programTypeFilter !== "all") {
        params.append("targetProgramType", programTypeFilter);
      }

      const response = await fetch(
        `/api/recommendations/templates?${params.toString()}`,
      );

      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = () => {
    if (!selectedTemplate) return;

    // Navigate to the wizard page with the selected template
    router.push(`/dashboard/recommendations/new?templateId=${selectedTemplate}`);
    onOpenChange(false);
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Recommendation Letter</DialogTitle>
          <DialogDescription>
            Choose a template to get started with your recommendation letter
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="country_specific">Country-Specific</SelectItem>
              </SelectContent>
            </Select>
            <Select value={programTypeFilter} onValueChange={setProgramTypeFilter}>
              <SelectTrigger className="w-[180px]">
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
            <div className="text-center py-8">
              <p className="text-muted-foreground">No templates found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTemplates.map((template) => (
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
                        <div className="flex items-center gap-2 mb-1">
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
        <div className="border-t pt-4 flex justify-end gap-2">
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
