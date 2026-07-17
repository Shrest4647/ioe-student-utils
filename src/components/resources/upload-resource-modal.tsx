"use client";

import { useForm } from "@tanstack/react-form";
import {
  ExternalLink,
  FileIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface UploadResourceModalProps {
  categories: { id: string; name: string }[];
  contentTypes: { id: string; name: string }[];
  onCategoryCreated?: (category: { id: string; name: string }) => void;
  onContentTypeCreated?: (contentType: { id: string; name: string }) => void;
  onSuccess?: () => void;
}

interface UrlAttachment {
  id: string;
  name: string;
  url: string;
}

export function UploadResourceModal({
  categories,
  contentTypes,
  onCategoryCreated,
  onContentTypeCreated,
  onSuccess,
}: UploadResourceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlAttachments, setUrlAttachments] = useState<UrlAttachment[]>([]);
  const [newUrlName, setNewUrlName] = useState("");
  const [newUrlValue, setNewUrlValue] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [isCreatingContentType, setIsCreatingContentType] = useState(false);
  const [isContentTypeFormOpen, setIsContentTypeFormOpen] = useState(false);
  const [newContentTypeName, setNewContentTypeName] = useState("");
  const [contentTypeError, setContentTypeError] = useState("");

  const resetContentTypeCreator = () => {
    setIsContentTypeFormOpen(false);
    setNewContentTypeName("");
    setContentTypeError("");
  };

  const resetCategoryCreator = () => {
    setIsCategoryFormOpen(false);
    setNewCategoryName("");
    setCategoryError("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetCategoryCreator();
      resetContentTypeCreator();
    }
  };

  const createCategory = async (onCreated: (id: string) => void) => {
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError("Enter a name for the category.");
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError("");

    try {
      const { data, error } = await apiClient.api.resources.categories.post({
        name,
      });

      if (error) {
        const message =
          typeof error.value === "object" &&
          error.value !== null &&
          "error" in error.value
            ? String(error.value.error)
            : "Could not create the category. Please try again.";
        setCategoryError(message);
        return;
      }

      if (data?.success && data.data) {
        const category = {
          id: data.data.id,
          name: data.data.name,
        };
        onCategoryCreated?.(category);
        onCreated(category.id);
        resetCategoryCreator();
        toast.success(`Category "${category.name}" created and selected.`);
        return;
      }

      setCategoryError("Could not create the category. Please try again.");
    } catch {
      setCategoryError(
        "Could not create the category. Check your connection and try again.",
      );
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const createContentType = async (onCreated: (id: string) => void) => {
    const name = newContentTypeName.trim();
    if (!name) {
      setContentTypeError("Enter a name for the content type.");
      return;
    }

    setIsCreatingContentType(true);
    setContentTypeError("");

    try {
      const { data, error } = await apiClient.api.resources[
        "content-types"
      ].post({ name });

      if (error) {
        const message =
          typeof error.value === "object" &&
          error.value !== null &&
          "error" in error.value
            ? String(error.value.error)
            : "Could not create the content type. Please try again.";
        setContentTypeError(message);
        return;
      }

      if (data?.success && data.data) {
        const contentType = {
          id: data.data.id,
          name: data.data.name,
        };
        onContentTypeCreated?.(contentType);
        onCreated(contentType.id);
        resetContentTypeCreator();
        toast.success(`Content type "${contentType.name}" created.`);
        return;
      }

      setContentTypeError(
        "Could not create the content type. Please try again.",
      );
    } catch {
      setContentTypeError(
        "Could not create the content type. Check your connection and try again.",
      );
    } finally {
      setIsCreatingContentType(false);
    }
  };

  const addUrlAttachment = () => {
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
    setUrlAttachments([
      ...urlAttachments,
      { id: crypto.randomUUID(), name: newUrlName, url: newUrlValue },
    ]);
    setNewUrlName("");
    setNewUrlValue("");
  };

  const removeUrlAttachment = (id: string) => {
    setUrlAttachments(urlAttachments.filter((a) => a.id !== id));
  };

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      contentTypeId: "",
      categoryIds: [] as string[],
      files: [] as File[],
    },
    onSubmit: async ({ value }) => {
      if (
        (value.files.length === 0 && urlAttachments.length === 0) ||
        !value.title ||
        !value.contentTypeId
      ) {
        toast.error(
          "Please add at least one attachment and fill in all required fields.",
        );
        return;
      }

      try {
        // Upload files to S3 using presigned URLs
        const uploadedFiles: Array<{ name: string; url: string; key: string }> =
          [];
        for (const file of value.files) {
          const { data: presignedData } = await apiClient.api.resources[
            "presigned-upload"
          ].post({
            fileName: file.name,
            contentType: file.type,
          });

          if (!presignedData?.success) {
            throw new Error("Failed to get presigned upload URL");
          }

          const { url: uploadUrl, key } = presignedData.data;

          // Upload file to S3
          const response = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to upload file to S3");
          }

          uploadedFiles.push({
            name: file.name,
            url: uploadUrl.split("?")[0], // Remove query params
            key,
          });
        }

        // Build attachments array for API
        const fileAttachments = uploadedFiles.map((file) => ({
          type: "file" as const,
          name: file.name,
          url: file.url,
        }));

        // Add URL attachments
        const urlAttachmentsData = urlAttachments.map((attachment) => ({
          type: "url" as const,
          name: attachment.name,
          url: attachment.url,
        }));

        const attachments = [...fileAttachments, ...urlAttachmentsData];

        const { data, error } = await apiClient.api.resources.post({
          title: value.title,
          description: value.description ?? "",
          contentTypeId: value.contentTypeId,
          categoryIds:
            value.categoryIds.length > 0 ? value.categoryIds : undefined,
          attachments,
        });

        if (error) {
          console.error("Upload Error:", error);
          toast.error("Failed to upload resource.");
        } else if (data?.success) {
          toast.success("Resource uploaded successfully!");
          setIsOpen(false);
          form.reset();
          setUrlAttachments([]);
          resetCategoryCreator();
          resetContentTypeCreator();
          onSuccess?.();
        }
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An unexpected error occurred.");
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold">
          <Upload className="mr-2 h-4 w-4" />
          New Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vh]">
        <DialogHeader>
          <DialogTitle>Upload New Resource</DialogTitle>
          <DialogDescription>
            Share a valuable resource with the IOE student community.
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
              <form.Field name="files">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="files">Resource Files *</Label>
                    {field.state.value.length === 0 ? (
                      <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/50">
                        <input
                          type="file"
                          id="files"
                          multiple
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(e) => {
                            const selectedFiles = Array.from(
                              e.target.files || [],
                            );
                            if (selectedFiles.length > 0) {
                              field.handleChange([
                                ...field.state.value,
                                ...selectedFiles,
                              ]);
                              if (
                                !form.getFieldValue("title") &&
                                selectedFiles[0]
                              ) {
                                form.setFieldValue(
                                  "title",
                                  selectedFiles[0].name.split(".")[0],
                                );
                              }
                            }
                          }}
                        />
                        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-center text-muted-foreground text-sm">
                          Click to upload or drag and drop (multiple files
                          allowed)
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          PDF, DOCX, XLSX, MD, etc.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {field.state.value.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
                          >
                            <div className="flex items-center gap-3">
                              <FileIcon className="h-6 w-6 text-primary" />
                              <div className="overflow-hidden">
                                <p className="max-w-45 truncate font-medium text-sm">
                                  {file.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newFiles = field.state.value.filter(
                                  (_, i) => i !== index,
                                );
                                field.handleChange(newFiles);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById(
                              "files",
                            ) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add More Files
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </form.Field>

              {/* URL Attachments Section */}
              <div className="space-y-2">
                <Label>URL Attachments (Optional)</Label>
                <div className="space-y-3 rounded-lg border p-3">
                  {urlAttachments.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No URL attachments added
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {urlAttachments.map((attachment) => (
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
                            onClick={() => removeUrlAttachment(attachment.id)}
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
                      onClick={addUrlAttachment}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select
                        value={field.state.value}
                        onValueChange={field.handleChange}
                        required
                      >
                        <SelectTrigger
                          id="contentType"
                          className="w-full sm:w-60"
                        >
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
                      {!isContentTypeFormOpen && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
                          onClick={() => {
                            setIsContentTypeFormOpen(true);
                            setContentTypeError("");
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add type
                        </Button>
                      )}
                    </div>
                    {isContentTypeFormOpen && (
                      <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                        <Label htmlFor="newContentTypeName">
                          New content type
                        </Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="newContentTypeName"
                            value={newContentTypeName}
                            onChange={(event) => {
                              setNewContentTypeName(event.target.value);
                              if (contentTypeError) setContentTypeError("");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                createContentType(field.handleChange);
                              }
                            }}
                            placeholder="e.g. Lecture notes"
                            disabled={isCreatingContentType}
                            aria-invalid={Boolean(contentTypeError)}
                            aria-describedby={
                              contentTypeError
                                ? "contentTypeCreateError"
                                : undefined
                            }
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() =>
                                createContentType(field.handleChange)
                              }
                              disabled={
                                isCreatingContentType ||
                                !newContentTypeName.trim()
                              }
                              className="flex-1 sm:flex-none"
                            >
                              {isCreatingContentType ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                "Create"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={resetContentTypeCreator}
                              disabled={isCreatingContentType}
                              className="flex-1 sm:flex-none"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                        {contentTypeError && (
                          <p
                            id="contentTypeCreateError"
                            className="text-destructive text-sm"
                            role="alert"
                          >
                            {contentTypeError}
                          </p>
                        )}
                      </div>
                    )}
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
                    <div className="flex items-center justify-between gap-3">
                      <Label>Categories (Select all that apply)</Label>
                      {categories.length > 0 && !isCategoryFormOpen && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsCategoryFormOpen(true);
                            setCategoryError("");
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add category
                        </Button>
                      )}
                    </div>
                    <div className="h-40 overflow-y-auto rounded-md border p-3">
                      {categories.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                          <p className="max-w-xs text-muted-foreground text-sm">
                            No categories exist yet. Create one to tag this
                            resource.
                          </p>
                          {!isCategoryFormOpen && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsCategoryFormOpen(true);
                                setCategoryError("");
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create first category
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {categories.map((cat) => (
                            <div
                              key={cat.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`cat-${cat.id}`}
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
                                htmlFor={`cat-${cat.id}`}
                                className="cursor-pointer font-normal text-sm leading-none"
                              >
                                {cat.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isCategoryFormOpen && (
                      <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                        <Label htmlFor="newCategoryName">New category</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            id="newCategoryName"
                            value={newCategoryName}
                            onChange={(event) => {
                              setNewCategoryName(event.target.value);
                              if (categoryError) setCategoryError("");
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                createCategory((id) => {
                                  if (!field.state.value.includes(id)) {
                                    field.handleChange([
                                      ...field.state.value,
                                      id,
                                    ]);
                                  }
                                });
                              }
                            }}
                            placeholder="e.g. First year"
                            disabled={isCreatingCategory}
                            aria-invalid={Boolean(categoryError)}
                            aria-describedby={
                              categoryError ? "categoryCreateError" : undefined
                            }
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() =>
                                createCategory((id) => {
                                  if (!field.state.value.includes(id)) {
                                    field.handleChange([
                                      ...field.state.value,
                                      id,
                                    ]);
                                  }
                                })
                              }
                              disabled={
                                isCreatingCategory || !newCategoryName.trim()
                              }
                              className="flex-1 sm:flex-none"
                            >
                              {isCreatingCategory ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                "Create"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={resetCategoryCreator}
                              disabled={isCreatingCategory}
                              className="flex-1 sm:flex-none"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                        {categoryError && (
                          <p
                            id="categoryCreateError"
                            className="text-destructive text-sm"
                            role="alert"
                          >
                            {categoryError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          <DialogFooter>
            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      form.reset();
                      setUrlAttachments([]);
                      resetCategoryCreator();
                      resetContentTypeCreator();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Resource"
                    )}
                  </Button>
                </>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
