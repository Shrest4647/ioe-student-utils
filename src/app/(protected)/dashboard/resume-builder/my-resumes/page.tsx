"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Copy, Edit2, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { apiClient } from "@/lib/eden";

interface Resume {
  id: string;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export default function MyResumesPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const fetchResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.resumes.mine.get();
      if (data?.success) {
        setResumes(data.data as Resume[]);
        setHasProfile(true);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const { data, error } = await apiClient.api.resumes({ id }).delete();

      if (error) {
        toast.error("Failed to delete resume");
      } else if (data?.success) {
        toast.success("Resume deleted successfully");
        fetchResumes();
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const { data, error } = await apiClient.api.resumes({ id })["duplicate"].post();

      if (error) {
        toast.error("Failed to duplicate resume");
      } else if (data?.success) {
        toast.success("Resume duplicated successfully");
        fetchResumes();
      }
    } catch (err) {
      console.error("Duplicate Error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleCreateNew = () => {
    if (!hasProfile) {
      router.push("/dashboard/resume-builder/profile");
    } else {
      router.push("/dashboard/resume-builder/create");
    }
  };

  return (
    <div className="fade-in container mx-auto max-w-7xl p-4 md:p-8 animate-in duration-500">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="mb-1 font-bold text-3xl tracking-tight">My Resumes</h1>
          <p className="text-muted-foreground">
            Manage and create resumes from your profile data
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Resume
        </Button>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Your Resumes</CardTitle>
          <CardDescription>
            {resumes.length} {resumes.length === 1 ? "resume" : "resumes"} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-muted-foreground text-sm">Loading resumes...</p>
              </div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="py-12">
              <Empty>
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                <EmptyTitle>No resumes yet</EmptyTitle>
                <EmptyDescription>
                  {!hasProfile
                    ? "Create a profile first to start building resumes"
                    : "Create your first resume to get started"}
                </EmptyDescription>
              </Empty>
              <div className="mt-6 flex justify-center">
                <Button onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  {!hasProfile ? "Create Profile" : "Create Resume"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resume Name</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resumes.map((resume) => (
                    <TableRow key={resume.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{resume.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="h-3 w-3" />
                          <span>
                            {resume.createdAt
                              ? new Date(resume.createdAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="h-3 w-3" />
                          <span>
                            {resume.updatedAt
                              ? new Date(resume.updatedAt).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => router.push(`/dashboard/resume-builder/edit/${resume.id}`)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                            onClick={() => handleDuplicate(resume.id)}
                            disabled={duplicatingId === resume.id}
                          >
                            {duplicatingId === resume.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                            onClick={() => handleDelete(resume.id, resume.name)}
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
