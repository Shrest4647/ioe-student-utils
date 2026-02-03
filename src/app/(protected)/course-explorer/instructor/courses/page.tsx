"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CourseStatusBadge } from "@/components/instructor/course-status-badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/eden";
import type { AcademicCourse } from "@/server/db/schema";

export default function InstructorCoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(),
  );
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["instructor-courses", searchQuery],
    queryFn: async () => {
      const response = await apiClient.api["course-explorer"].courses.get({
        query: {
          search: searchQuery || undefined,
          limit: "50",
        },
      });
      if (!response.data) return [];

      return response.data.data;
    },
  });

  const _deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.api["course-explorer"].admin
        .courses({ id })
        .delete();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      toast.success("Course deleted successfully");
      setCourseToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete course");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.api["course-explorer"].admin
        .courses({ id })
        .duplicate.post();
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      toast.success("Course duplicated successfully");
    },
    onError: () => {
      toast.error("Failed to duplicate course");
    },
  });

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCourses(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedCourses.size === courses?.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(courses?.map((c) => c.id)));
    }
  };

  const getCourseStatus = (
    course: AcademicCourse & { units?: { id: string; name: string }[] },
  ): "published" | "draft" | "archived" => {
    if (!course.isActive) return "archived";
    if (course.units && course.units.length > 0) return "published";
    return "draft";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Manage your courses, units, and topics.
          </p>
        </div>
        <Link href="/instructor/courses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
        {selectedCourses.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {selectedCourses.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Bulk delete would be implemented here
                toast.info("Bulk delete not implemented yet");
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Courses Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    !!courses &&
                    courses?.length > 0 &&
                    selectedCourses.size === courses?.length
                  }
                  onCheckedChange={toggleAllSelection}
                />
              </TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Units</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((v, i) => (
                  <TableRow key={`${v + i}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-12" />
                    </TableCell>
                  </TableRow>
                ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Failed to load courses. Please try again.
                  </p>
                </TableCell>
              </TableRow>
            ) : courses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <p className="text-muted-foreground">No courses found.</p>
                  <Link href="/instructor/courses/new">
                    <Button variant="outline" className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Create your first course
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCourses.has(course.id)}
                      onCheckedChange={() => toggleSelection(course.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{course.name}</p>
                      {course.description && (
                        <p className="line-clamp-1 text-muted-foreground text-sm">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {course.code ? (
                      <Badge variant="secondary">{course.code}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <CourseStatusBadge status={getCourseStatus(course)} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {course?.units?.length || 0} units
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/instructor/courses/${course.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/courses/${course.slug}`} target="_blank">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem
                          onClick={() => duplicateMutation.mutate(course.id)}
                          disabled={duplicateMutation.isPending}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setCourseToDelete(course.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!courseToDelete}
        onOpenChange={() => setCourseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will soft delete the course. It can be restored later
              from the archive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCourseToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                courseToDelete && _deleteMutation.mutate(courseToDelete)
              }
              disabled={_deleteMutation.isPending}
            >
              {_deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
