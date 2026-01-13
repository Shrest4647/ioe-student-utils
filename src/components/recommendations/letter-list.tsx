"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DownloadIcon,
  EditIcon,
  FileTextIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";

type LetterStatus = "draft" | "completed" | "exported";

export function LetterList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: letters = [], isLoading } = useQuery({
    queryKey: ["recommendation-letters", statusFilter],
    queryFn: async () => {
      const query: any = {};
      if (statusFilter !== "all") {
        query.status = statusFilter;
      }

      const { data, error } = await apiClient.api.recommendations.letters.get({
        query,
      });

      if (error) {
        throw new Error("Failed to fetch letters");
      }

      return data?.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await apiClient.api.recommendations
        .letters({ id })
        .delete();

      if (error) {
        throw new Error("Failed to delete letter");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Letter deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["recommendation-letters"] });
    },
    onError: () => {
      toast.error("Failed to delete letter");
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    deleteMutation.mutate(id);
  };

  const getStatusBadgeVariant = (status: LetterStatus) => {
    switch (status) {
      case "draft":
        return "outline";
      case "completed":
        return "default";
      case "exported":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (letters.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileTextIcon className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 font-semibold text-lg">No letters yet</h3>
          <p className="mb-4 text-center text-muted-foreground">
            Create your first recommendation letter to get started
          </p>
          <Link href="/dashboard/recommendations/new">
            <Button>Create Letter</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Letters Grid */}
      <div className="grid gap-4">
        {letters.map((letter) => (
          <Card key={letter.id} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/recommendations/${letter.id}`}
                      className="hover:underline"
                    >
                      {letter.title}
                    </Link>
                    <Badge variant={getStatusBadgeVariant(letter.status)}>
                      {letter.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {letter.targetInstitution} - {letter.targetProgram}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/recommendations/${letter.id}`}
                        className="cursor-pointer"
                      >
                        <EditIcon className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/dashboard/recommendations/${letter.id}`}
                        className="cursor-pointer"
                      >
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Download PDF
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(letter.id, letter.title)}
                      className="text-destructive"
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Recommender:</span>{" "}
                  {letter.recommenderName}
                </div>
                <div className="text-muted-foreground">
                  Created {format(new Date(letter.createdAt), "MMM d, yyyy")} •
                  Updated {format(new Date(letter.updatedAt), "MMM d, yyyy")}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
