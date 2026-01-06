"use client";

import { useForm } from "@tanstack/react-form";
import {
  ExternalLink,
  FileIcon,
  Loader2,
  Plus,
  SaveIcon,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
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

interface NewUrlAttachment {
  id: string;
  name: string;
  url: string;
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
  const [newUrlName, setNewUrlName] = useState("");
  const [newUrlValue, setNewUrlValue] = useState("");
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>(
    [],
  );
  const [newUrlAttachments, setNewUrlAttachments] = useState<
    NewUrlAttachment[]
  >([]);

  const addNewUrlAttachment = () => {
    if (!newUrlName || !newUrlValue) {
      toast.error("Please fill in both name and URL fields.");
      return;
    }
    if (
      !newUrlValue.startsWith("http://") &&
      !newUrlValue.startsWith("https://")
    ) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    setNewUrlAttachments([
      ...newUrlAttachments,
      { id: crypto.randomUUID(), name: newUrlName, url: newUrlValue },
    ]);
    setNewUrlName("");
    setNewUrlValue("");
  };

  const removeNewUrlAttachment = (id: string) => {
    setNewUrlAttachments(newUrlAttachments.filter((a) => a.id !== id));
  };

  const removeExistingAttachment = (id: string) => {
    setRemovedAttachmentIds([...removedAttachmentIds, id]);
  };

  const restoreRemovedAttachment = (id: string) => {
    setRemovedAttachmentIds(removedAttachmentIds.filter((a) => a !== id));
  };

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
        // Build attachments payload
        const attachments: {
          add?: Array<{ type: "url"; name: string; url: string }>;
          remove?: string[];
        } = {};

        // Add new URL attachments
        if (newUrlAttachments.length > 0) {
          attachments.add = newUrlAttachments.map((a) => ({
            type: "url" as const,
            name: a.name,
            url: a.url,
          }));
        }

        // Mark removed attachments
        if (removedAttachmentIds.length > 0) {
          attachments.remove = removedAttachmentIds;
        }

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
            attachments:
              Object.keys(attachments).length > 0 ? attachments : undefined,
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
  useEffect(() => {
    if (isOpen && resource) {
      form.setFieldValue("title", resource.title);
      form.setFieldValue("description", resource.description ?? "");
      form.setFieldValue("contentTypeId", resource.contentType.id);
      form.setFieldValue(
        "categoryIds",
        resource.categories.map((c) => c.id),
      );
      // Reset attachment state
      setRemovedAttachmentIds([]);
      setNewUrlAttachments([]);
      setNewUrlName("");
      setNewUrlValue("");
    }
  }, [isOpen, resource, form]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Get existing attachments that haven't been removed
  const existingAttachments =
    resource?.attachments?.filter(
      (a) => !removedAttachmentIds.includes(a.id),
    ) || [];

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

              {/* Existing Attachments Section */}
              <div className="space-y-2">
                <Label>Existing Attachments</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {existingAttachments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No attachments remaining
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {existingAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className={`flex items-center justify-between rounded-md p-2 ${
                            removedAttachmentIds.includes(attachment.id)
                              ? "bg-muted/30 opacity-50"
                              : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {attachment.type === "url" ? (
                              <ExternalLink className="h-4 w-4 flex-shrink-0 text-primary" />
                            ) : (
                              <FileIcon className="h-4 w-4 flex-shrink-0 text-primary" />
                            )}
                            <div className="overflow-hidden">
                              <p className="truncate font-medium text-sm">
                                {attachment.name}
                              </p>
                              <p className="truncate text-muted-foreground text-xs">
                                {attachment.type === "url"
                                  ? attachment.url
                                  : attachment.url.split("/").pop() ||
                                    attachment.name}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removedAttachmentIds.includes(attachment.id)
                                ? restoreRemovedAttachment(attachment.id)
                                : removeExistingAttachment(attachment.id)
                            }
                            className={
                              removedAttachmentIds.includes(attachment.id)
                                ? "text-green-600 hover:text-green-700"
                                : "text-destructive hover:text-destructive"
                            }
                          >
                            {removedAttachmentIds.includes(attachment.id) ? (
                              <Plus className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* New URL Attachments Section */}
              <div className="space-y-2">
                <Label>Add New URL Attachments</Label>
                <div className="space-y-3 rounded-lg border p-3">
                  {newUrlAttachments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No new URLs to add
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {newUrlAttachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between rounded-md bg-muted/30 p-2"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <ExternalLink className="h-4 w-4 flex-shrink-0 text-primary" />
                            <div className="overflow-hidden">
                              <p className="truncate font-medium text-sm">
                                {attachment.name}
                              </p>
                              <p className="truncate text-muted-foreground text-xs">
                                {attachment.url}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeNewUrlAttachment(attachment.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name (e.g., Reference Link)"
                      value={newUrlName}
                      onChange={(e) => setNewUrlName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="https://example.com"
                      value={newUrlValue}
                      onChange={(e) => setNewUrlValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addNewUrlAttachment}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
                  <SaveIcon className="mr-2 h-4 w-4" />
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
