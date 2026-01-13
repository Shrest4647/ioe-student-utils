"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  FileTextIcon,
  MoreVerticalIcon,
  TrashIcon,
  EditIcon,
  DownloadIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type LetterStatus = "draft" | "completed" | "exported";

interface Letter {
  id: string;
  title: string;
  status: LetterStatus;
  createdAt: string;
  updatedAt: string;
  targetInstitution: string;
  targetProgram: string;
  recommenderName: string;
}

export function LetterList() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchLetters();
  }, [statusFilter]);

  const fetchLetters = async () => {
    try {
      setIsLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== "all") {
        query.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/recommendations/letters?${query.toString()}`,
      );

      if (!response.ok) throw new Error("Failed to fetch letters");

      const data = await response.json();
      setLetters(data.data || []);
    } catch (error) {
      console.error("Error fetching letters:", error);
      toast.error("Failed to load recommendation letters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/recommendations/letters/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete letter");

      toast.success("Letter deleted successfully");
      fetchLetters();
    } catch (error) {
      console.error("Error deleting letter:", error);
      toast.error("Failed to delete letter");
    }
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
          <FileTextIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No letters yet</h3>
          <p className="text-muted-foreground text-center mb-4">
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
          <SelectTrigger className="w-[180px]">
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
          <Card key={letter.id} className="hover:shadow-md transition-shadow">
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
