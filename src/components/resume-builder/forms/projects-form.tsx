"use client";

import { useForm } from "@tanstack/react-form";
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

interface Project {
  id: string;
  name: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  referenceLink: string | null;
}

interface ProjectsFormProps {
  onSave?: () => void;
  initialData?: Project[];
  onDataChange?: () => void;
}

export function ProjectsForm({
  onSave,
  initialData,
  onDataChange,
}: ProjectsFormProps) {
  const [projects, setProjects] = useState<Project[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      referenceLink: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          const { data, error } = await apiClient.api
            .projects({
              id: editingId,
            })
            .patch({
              name: value.name || undefined,
              role: value.role || undefined,
              startDate: value.startDate || undefined,
              endDate: isCurrent ? undefined : value.endDate || undefined,
              description: value.description || undefined,
              referenceLink: value.referenceLink || undefined,
            });

          if (error) {
            toast.error("Failed to update project.");
          } else if (data?.success) {
            toast.success("Project updated successfully!");
            fetchProjects();
            onDataChange?.();
            resetForm();
          }
        } else {
          const { data, error } = await apiClient.api.projects.post({
            name: value.name || undefined,
            role: value.role || undefined,
            startDate: value.startDate || undefined,
            endDate: isCurrent ? undefined : value.endDate || undefined,
            description: value.description || undefined,
            referenceLink: value.referenceLink || undefined,
          });

          if (error) {
            toast.error("Failed to add project.");
          } else if (data?.success) {
            toast.success("Project added successfully!");
            fetchProjects();
            onDataChange?.();
            resetForm();
          }
        }
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.projects.get();
      if (data?.success) {
        setProjects(data.data as Project[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchProjects();
    }
  }, [fetchProjects, initialData]);

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setIsCurrent(false);
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    form.setFieldValue("name", project.name ?? "");
    form.setFieldValue("role", project.role ?? "");
    form.setFieldValue("startDate", project.startDate ?? "");
    form.setFieldValue("endDate", project.endDate ?? "");
    form.setFieldValue("description", project.description ?? "");
    form.setFieldValue("referenceLink", project.referenceLink ?? "");
    setIsCurrent(!project.endDate);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api
        .projects({
          id,
        })
        .delete();

      if (error) {
        toast.error("Failed to delete project.");
      } else if (data?.success) {
        toast.success("Project deleted successfully!");
        fetchProjects();
        onDataChange?.();
        if (editingId === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isLoading && projects.length > 0 && (
          <div className="space-y-3">
            <Label>Your Projects</Label>
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="font-semibold">{proj.name || "Project"}</h4>
                    {proj.role && <Badge variant="outline">{proj.role}</Badge>}
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                    </Badge>
                  </div>
                  {proj.description && (
                    <p className="text-muted-foreground text-sm">
                      {proj.description}
                    </p>
                  )}
                  {proj.referenceLink && (
                    <a
                      href={proj.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-blue-600 text-sm hover:underline"
                    >
                      View Project
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                    onClick={() => handleEdit(proj)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDelete(proj.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <Label>{editingId ? "Edit Project" : "Add Project"}</Label>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Edit
              </Button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Portfolio Website"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="role">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    placeholder="e.g. Lead Developer"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
              <form.Field name="startDate">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="month"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm">To:</span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isCurrent"
                      checked={isCurrent}
                      onCheckedChange={(checked) =>
                        setIsCurrent(checked as boolean)
                      }
                    />
                    <Label htmlFor="isCurrent" className="cursor-pointer">
                      Ongoing
                    </Label>
                  </div>
                </div>

                {!isCurrent && (
                  <form.Field name="endDate">
                    {(field) => (
                      <Input
                        placeholder="End Date"
                        type="month"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    )}
                  </form.Field>
                )}
              </div>
            </div>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the project, technologies used, and your contribution..."
                    className="min-h-32 resize-none"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="referenceLink">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="referenceLink">Project Link (Optional)</Label>
                  <Input
                    id="referenceLink"
                    type="url"
                    placeholder="https://github.com/username/project"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <div className="flex justify-end gap-2">
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update Project"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Project
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </div>

        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onSave}
                disabled={!canSubmit && projects.length === 0}
              >
                Save & Continue
              </Button>
            </div>
          )}
        </form.Subscribe>
      </CardContent>
    </Card>
  );
}
