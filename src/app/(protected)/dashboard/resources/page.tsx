"use client";

import { Clock, Edit2, Eye, FileIcon, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EditResourceModal } from "@/components/resources/edit-resource-modal";
import type { Resource } from "@/components/resources/resource-card";
import { UploadResourceModal } from "@/components/resources/upload-resource-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/eden";

const DASHBOARD_SKELETON_KEYS = ["row-1", "row-2", "row-3", "row-4", "row-5"];

export default function ResourceDashboardPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [contentTypes, setContentTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );

  const fetchMyResources = useCallback(async () => {
    setIsLoading(true);
    const { data } = await apiClient.api.resources.mine.get();
    if (data?.success) {
      setResources(data.data as any);
    }
    setIsLoading(false);
  }, []);

  const fetchMetadata = useCallback(async () => {
    const [catRes, ctRes] = await Promise.all([
      apiClient.api.resources.categories.get(),
      apiClient.api.resources["content-types"].get(),
    ]);

    if (catRes.data?.success) setCategories(catRes.data.data as any);
    if (ctRes.data?.success) setContentTypes(ctRes.data.data as any);
  }, []);

  useEffect(() => {
    fetchMyResources();
    fetchMetadata();
  }, [fetchMetadata, fetchMyResources]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    const { data, error } = await apiClient.api.resources({ id }).delete();
    if (error) {
      toast.error("Failed to delete resource.");
    } else if (data?.success) {
      toast.success("Resource deleted successfully.");
      fetchMyResources();
    }
  };

  function handleEdit(resource: Resource): void {
    setSelectedResource(resource);
    setIsEditModalOpen(true);
  }

  return (
    <div className="fade-in container mx-auto max-w-7xl animate-in p-4 duration-500 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 font-bold text-3xl tracking-tight">
            My Resources
          </h1>
          <p className="text-muted-foreground">
            Manage the resources you've shared with the community.
          </p>
        </div>
        <UploadResourceModal
          categories={categories}
          contentTypes={contentTypes}
          onSuccess={fetchMyResources}
        />
      </div>

      <EditResourceModal
        resource={selectedResource}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedResource(null);
        }}
        categories={categories}
        contentTypes={contentTypes}
        onSuccess={fetchMyResources}
      />

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Resource List</CardTitle>
          <CardDescription>
            You have uploaded {resources.length} resources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {DASHBOARD_SKELETON_KEYS.map((key) => (
                <div
                  key={key}
                  className="h-12 w-full animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="py-12">
              <Empty>
                <EmptyTitle>No resources yet</EmptyTitle>
                <EmptyDescription>
                  Start by uploading your first resource to share with others.
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Categories
                    </TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="mb-1 font-medium text-sm leading-none">
                              {resource.title}
                            </p>
                            <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(
                                  resource.createdAt,
                                ).toLocaleDateString()}
                              </span>
                              <span className="md:hidden">
                                • {resource.contentType.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {resource.contentType.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {resource.categories.map((c) => (
                            <Badge
                              key={c.id}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {c.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
                            asChild
                          >
                            <a
                              href={
                                resource.attachments?.[0]?.url || resource.s3Url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          {/* Edit Modal (Story 2 refinement) */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                            onClick={() => handleEdit(resource)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                            onClick={() => handleDelete(resource.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
