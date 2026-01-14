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

interface Position {
  id: string;
  name: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  referenceLink: string | null;
}

interface PositionsFormProps {
  onSave?: () => void;
  initialData?: Position[];
  onDataChange?: () => void;
}

export function PositionsForm({
  onSave,
  initialData,
  onDataChange,
}: PositionsFormProps) {
  const [positions, setPositions] = useState<Position[]>(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      referenceLink: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          const { data, error } = await apiClient.api
            .positions({
              id: editingId,
            })
            .patch({
              name: value.name || undefined,
              description: value.description || undefined,
              startDate: value.startDate || undefined,
              endDate: isCurrent ? undefined : value.endDate || undefined,
              referenceLink: value.referenceLink || undefined,
            });

          if (error) {
            toast.error("Failed to update position.");
          } else if (data?.success) {
            toast.success("Position updated successfully!");
            fetchPositions();
            onDataChange?.();
            resetForm();
          }
        } else {
          const { data, error } = await apiClient.api.positions.post({
            name: value.name || undefined,
            description: value.description || undefined,
            startDate: value.startDate || undefined,
            endDate: isCurrent ? undefined : value.endDate || undefined,
            referenceLink: value.referenceLink || undefined,
          });

          if (error) {
            toast.error("Failed to add position.");
          } else if (data?.success) {
            toast.success("Position added successfully!");
            fetchPositions();
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

  const fetchPositions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.positions.get();
      if (data?.success) {
        setPositions(data.data as Position[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchPositions();
    }
  }, [fetchPositions, initialData]);

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setIsCurrent(false);
  };

  const handleEdit = (position: Position) => {
    setEditingId(position.id);
    form.setFieldValue("name", position.name ?? "");
    form.setFieldValue("description", position.description ?? "");
    form.setFieldValue("startDate", position.startDate ?? "");
    form.setFieldValue("endDate", position.endDate ?? "");
    form.setFieldValue("referenceLink", position.referenceLink ?? "");
    setIsCurrent(!position.endDate);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api
        .positions({
          id,
        })
        .delete();

      if (error) {
        toast.error("Failed to delete position.");
      } else if (data?.success) {
        toast.success("Position deleted successfully!");
        fetchPositions();
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
        <CardTitle>Positions of Responsibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isLoading && positions.length > 0 && (
          <div className="space-y-3">
            <Label>Your Positions</Label>
            {positions.map((pos) => (
              <div
                key={pos.id}
                className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="font-semibold">{pos.name || "Position"}</h4>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {formatDate(pos.startDate)} - {formatDate(pos.endDate)}
                    </Badge>
                  </div>
                  {pos.description && (
                    <p className="text-muted-foreground text-sm">
                      {pos.description}
                    </p>
                  )}
                  {pos.referenceLink && (
                    <a
                      href={pos.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-blue-600 text-sm hover:underline"
                    >
                      View Reference
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                    onClick={() => handleEdit(pos)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDelete(pos.id)}
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
            <Label>{editingId ? "Edit Position" : "Add Position"}</Label>
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
                    Position Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Club Secretary"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
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
                    placeholder="Describe your responsibilities and achievements..."
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
                  <Label htmlFor="referenceLink">
                    Reference Link (Optional)
                  </Label>
                  <Input
                    id="referenceLink"
                    type="url"
                    placeholder="https://example.com"
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
                      "Update Position"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Position
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
                disabled={!canSubmit && positions.length === 0}
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
