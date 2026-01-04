"use client";

import { useForm } from "@tanstack/react-form";
import { FileIcon, Loader2, Upload, X } from "lucide-react";
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
  onSuccess?: () => void;
}

export function UploadResourceModal({
  categories,
  contentTypes,
  onSuccess,
}: UploadResourceModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      contentTypeId: "",
      categoryIds: [] as string[],
      file: null as File | null,
    },
    onSubmit: async ({ value }) => {
      if (!value.file || !value.title || !value.contentTypeId) {
        toast.error("Please fill in all required fields.");
        return;
      }

      try {
        const { data, error } = await apiClient.api.resources.post({
          title: value.title,
          description: value.description ?? "",
          file: value.file,
          contentTypeId: value.contentTypeId,
          categoryIds:
            value.categoryIds.length > 0 ? value.categoryIds : undefined,
        });

        if (error) {
          console.error("Upload Error:", error);
          toast.error("Failed to upload resource.");
        } else if (data?.success) {
          toast.success("Resource uploaded successfully!");
          setIsOpen(false);
          form.reset();
          onSuccess?.();
        }
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An unexpected error occurred.");
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              <form.Field name="file">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="file">Resource File *</Label>
                    {!field.state.value ? (
                      <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/50">
                        <input
                          type="file"
                          id="file"
                          className="absolute inset-0 cursor-pointer opacity-0"
                          onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                              field.handleChange(selectedFile);
                              if (!form.getFieldValue("title")) {
                                form.setFieldValue(
                                  "title",
                                  selectedFile.name.split(".")[0],
                                );
                              }
                            }
                          }}
                          required
                        />
                        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-center text-muted-foreground text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          PDF, DOCX, XLSX, MD, etc.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                          <FileIcon className="h-8 w-8 text-primary" />
                          <div className="overflow-hidden">
                            <p className="max-w-45 truncate font-medium text-sm">
                              {field.state.value.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {(field.state.value.size / 1024 / 1024).toFixed(
                                2,
                              )}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => field.handleChange(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </form.Field>

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
                      <SelectTrigger id="contentType" className="w-[240px]">
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
