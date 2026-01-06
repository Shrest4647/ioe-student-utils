"use client";

import { useForm } from "@tanstack/react-form";
import { Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Resource } from "@/components/resources/resource-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

interface EditResourceModalProps {
  resource: Resource | null;
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string }[];
  contentTypes: { id: string; name: string }[];
  onSuccess?: () => void;
}

export function EditResourceModal({
  resource,
  isOpen,
  onClose,
  categories,
  contentTypes,
  onSuccess,
}: EditResourceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      contentTypeId: "",
      categoryIds: [] as string[],
    },
    onSubmit: async ({ value }) => {
      if (!resource) return;

      if (!value.title || !value.contentTypeId) {
        toast.error("Please fill in all required fields.");
        return;
      }

      setIsSubmitting(true);
      try {
        const { data, error } = await apiClient.api
          .resources({
            id: resource.id,
          })
          .put({
            title: value.title,
            description: value.description ?? "",
            contentTypeId: value.contentTypeId,
            categoryIds:
              value.categoryIds.length > 0 ? value.categoryIds : undefined,
          });

        if (error) {
          console.error("Update Error:", error);
          toast.error("Failed to update resource.");
        } else if (data?.success) {
          toast.success("Resource updated successfully!");
          onClose();
          onSuccess?.();
        }
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Reset form when resource changes
  const handleOpenChange = (open: boolean) => {
    if (open && resource) {
      form.setFieldValue("title", resource.title);
      form.setFieldValue("description", resource.description ?? "");
      form.setFieldValue("contentTypeId", resource.contentType.id);
      form.setFieldValue(
        "categoryIds",
        resource.categories.map((c) => c.category.id),
      );
    } else if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>
            Update the details of your resource.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="min-w-[80wh] space-y-6 py-4"
        >
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <form.Field name="title">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. My Pulchowk Entrance Prep Guide"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="contentTypeId">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="contentType">Content Type *</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      required
                    >
                      <SelectTrigger id="contentType" className="w-60">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {contentTypes.map((ct) => (
                          <SelectItem key={ct.id} value={ct.id}>
                            {ct.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="space-y-4">
              <form.Field name="description">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Briefly describe what this resource is about..."
                      className="h-32 resize-none"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="categoryIds">
                {(field) => (
                  <div className="space-y-3">
                    <Label>Categories (Select all that apply)</Label>
                    <div className="grid h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                      {categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`edit-cat-${cat.id}`}
                            checked={field.state.value.includes(cat.id)}
                            onCheckedChange={() => {
                              const current = field.state.value;
                              const updated = current.includes(cat.id)
                                ? current.filter((id) => id !== cat.id)
                                : [...current, cat.id];
                              field.handleChange(updated);
                            }}
                          />
                          <Label
                            htmlFor={`edit-cat-${cat.id}`}
                            className="cursor-pointer font-normal text-sm leading-none"
                          >
                            {cat.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
