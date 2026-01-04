"use client";

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
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    contentTypeId: "",
    categoryIds: [] as string[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: selectedFile.name.split(".")[0],
        }));
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.title || !formData.contentTypeId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error } = await apiClient.api.resources.post({
        title: formData.title,
        description: formData.description,
        file: file,
        contentTypeId: formData.contentTypeId,
        categoryIds: formData.categoryIds,
      });

      if (error) {
        toast.error("Failed to upload resource.");
      } else if (data?.success) {
        toast.success("Resource uploaded successfully!");
        setIsOpen(false);
        resetForm();
        onSuccess?.();
      }
    } catch (_err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFormData({
      title: "",
      description: "",
      contentTypeId: "",
      categoryIds: [],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold">
          <Upload className="mr-2 h-4 w-4" />
          New Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload New Resource</DialogTitle>
          <DialogDescription>
            Share a valuable resource with the IOE student community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Resource File *</Label>
                {!file ? (
                  <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors hover:bg-muted/50">
                    <input
                      type="file"
                      id="file"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={handleFileChange}
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
                        <p className="max-w-[180px] truncate font-medium text-sm">
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
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. My Pulchowk Entrance Prep Guide"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contentType">Content Type *</Label>
                <Select
                  value={formData.contentTypeId}
                  onValueChange={(val) =>
                    setFormData({ ...formData, contentTypeId: val })
                  }
                  required
                >
                  <SelectTrigger id="contentType">
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
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what this resource is about..."
                  className="h-32 resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-3">
                <Label>Categories (Select all that apply)</Label>
                <div className="grid h-40 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={formData.categoryIds.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
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
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
