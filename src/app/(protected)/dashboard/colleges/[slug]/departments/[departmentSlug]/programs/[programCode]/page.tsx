"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Book, Edit2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

const programSchema = z.object({
  code: z.string().optional(),
  description: z.string().optional(),
  credits: z.string().optional(),
  isActive: z.boolean(),
});

type Course = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: string | null;
  isActive: boolean;
};

export default function ProgramEditPage() {
  const { slug, departmentSlug, programCode } = useParams();
  const queryClient = useQueryClient();
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

  const collegeQuery = useQuery({
    queryKey: ["admin", "college", slug],
    queryFn: async () => {
      const { data } = await apiClient.api.colleges
        .slug({ slug: slug as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const departmentQuery = useQuery({
    queryKey: ["admin", "department", departmentSlug],
    queryFn: async () => {
      const { data } = await apiClient.api.departments
        .slug({ slug: departmentSlug as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const programQuery = useQuery({
    queryKey: ["admin", "program", programCode],
    queryFn: async () => {
      const { data } = await apiClient.api.programs
        .code({ code: programCode as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const coursesQuery = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: async () => {
      const { data } = await apiClient.api.courses.get({
        query: { limit: "100" },
      });
      return data?.success ? data.data : [];
    },
  });

  const collegeDepartmentQuery = useQuery({
    queryKey: ["admin", "college-department", slug, departmentSlug],
    queryFn: async () => {
      const collegeId = collegeQuery.data?.id;
      const departmentId = departmentQuery.data?.id;

      if (!collegeId || !departmentId) return null;

      const { data } = await apiClient.api
        .colleges({ id: collegeId })
        .departments({ departmentId })
        .get();

      return data?.success ? data.data : null;
    },
    enabled: !!collegeQuery.data?.id && !!departmentQuery.data?.id,
  });

  const collegeProgramQuery = useQuery({
    queryKey: ["admin", "college-program", slug, departmentSlug, programCode],
    queryFn: async () => {
      const collegeId = collegeQuery.data?.id;
      const departmentId = departmentQuery.data?.id;
      const programId = programQuery.data?.id;

      if (!collegeId || !departmentId || !programId) return null;

      const { data } = await apiClient.api
        .colleges({ id: collegeId })
        .departments({ departmentId })
        .programs({ programId })
        .get();

      return data?.success ? data.data : null;
    },
    enabled:
      !!collegeQuery.data?.id &&
      !!departmentQuery.data?.id &&
      !!programQuery.data?.id,
  });

  const programCoursesQuery = useQuery({
    queryKey: ["admin", "program-courses", slug, departmentSlug, programCode],
    queryFn: async () => {
      if (!collegeProgramQuery.data?.id) return [];
      const collegeId = collegeQuery.data?.id;
      const departmentId = departmentQuery.data?.id;
      const programId = programQuery.data?.id;

      if (!collegeId || !departmentId || !programId) return [];

      const { data } = await apiClient.api
        .colleges({ id: collegeId })
        .departments({ departmentId })
        .programs({ programId })
        .courses.get();

      return data?.success ? data.data : [];
    },
    enabled: !!collegeProgramQuery.data?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof programSchema>) => {
      const collegeId = collegeQuery.data?.id;
      const departmentId = departmentQuery.data?.id;

      if (!collegeId || !departmentId) return null;

      const { data } = await apiClient.api.colleges
        .admin({ id: collegeId })
        .departments({ departmentId })
        .patch(values);
      return data;
    },
    onSuccess: () => {
      toast.success("Program updated");
      queryClient.invalidateQueries({
        queryKey: [
          "admin",
          "college-program",
          slug,
          departmentSlug,
          programCode,
        ],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      code: collegeProgramQuery.data?.code || programQuery.data?.code || "",
      description:
        collegeProgramQuery.data?.description ||
        programQuery.data?.description ||
        "",
      credits:
        collegeProgramQuery.data?.credits || programQuery.data?.credits || "",
      isActive: collegeProgramQuery.data?.isActive ?? true,
    } as z.infer<typeof programSchema>,
    validators: {
      onChange: programSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (
    !collegeQuery.data ||
    !departmentQuery.data ||
    !programQuery.data ||
    (!collegeDepartmentQuery.data && collegeDepartmentQuery.isLoading) ||
    (!collegeProgramQuery.data && collegeProgramQuery.isLoading)
  ) {
    return (
      <div className="container mx-auto space-y-6 pt-8">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-96 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const courses: Course[] = coursesQuery.data || [];
  const collegeProgramId = collegeProgramQuery.data?.id || "";

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/dashboard/colleges/${slug}/departments/${departmentSlug}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-bold text-2xl">
            {programQuery.data?.name} - {departmentQuery.data?.name} -{" "}
            {collegeQuery.data?.name}
          </h2>
          <p className="text-muted-foreground">
            Customize program for {collegeQuery.data?.name} -{" "}
            {departmentQuery.data?.name}
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
              <CardDescription>
                Customize how this program appears for {collegeQuery.data?.name}{" "}
                - {departmentQuery.data?.name}. These values will override the
                general program information if provided.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <div className="font-medium text-sm">General Program</div>
                <div className="text-muted-foreground text-sm">
                  {programQuery.data?.description || "No description"}
                </div>
                {programQuery.data?.code && (
                  <div className="mt-2">
                    <span className="font-medium">Code: </span>
                    <span className="text-sm">{programQuery.data?.code}</span>
                  </div>
                )}
                {programQuery.data?.credits && (
                  <div className="mt-1">
                    <span className="font-medium">Credits: </span>
                    <span className="text-sm">
                      {programQuery.data?.credits}
                    </span>
                  </div>
                )}
              </div>

              <form.Field name="code">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Program Code</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={programQuery.data?.code || "e.g. BCT"}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Description</FieldLabel>
                    <Textarea
                      rows={6}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Custom description for this college program (leave empty to use general program description)"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) => ({
                        message: typeof err === "string" ? err : err?.message,
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="credits">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Credits</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={programQuery.data?.credits || "e.g. 140"}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {collegeProgramId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Courses</CardTitle>
                  <CardDescription>
                    Manage courses under this program.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCourseModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Course
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {programCoursesQuery.isLoading ? (
                        Array(3)
                          .fill(0)
                          .map((v, i) => (
                            <TableRow key={`skeleton-${v + i}`}>
                              <TableCell
                                colSpan={4}
                                className="h-12 animate-pulse bg-muted/50"
                              />
                            </TableRow>
                          ))
                      ) : programCoursesQuery.data?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No courses found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        programCoursesQuery.data?.map((progCourse: any) => (
                          <TableRow key={progCourse.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                  <Book className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {progCourse.course?.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {progCourse.course?.code}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">
                                {progCourse.code || progCourse.course?.code}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    progCourse.isActive
                                      ? "bg-green-500"
                                      : "bg-muted"
                                  }`}
                                />
                                <span className="text-muted-foreground text-xs">
                                  {progCourse.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={`/dashboard/colleges/${slug}/departments/${departmentSlug}/programs/${programCode}/courses/${progCourse.course?.code}`}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Control whether this program is visible for{" "}
                {collegeQuery.data?.name} - {departmentQuery.data?.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="isActive">
                {(field) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel>Active</FieldLabel>
                      <p className="text-muted-foreground text-sm">
                        {field.state.value
                          ? "Program is visible"
                          : "Program is hidden"}
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value as boolean}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="h-12 w-full"
            disabled={saveMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending
              ? "Saving..."
              : collegeProgramQuery.data?.id
                ? "Update Program"
                : "Create Program"}
          </Button>
        </div>
      </form>

      <AddCourseModal
        collegeId={collegeQuery.data?.id as string}
        departmentId={departmentQuery.data?.id as string}
        programId={programQuery.data?.id as string}
        collegeSlug={slug as string}
        departmentSlug={departmentSlug as string}
        programCode={programCode as string}
        collegeProgramId={collegeProgramId}
        courses={courses}
        isOpen={isCourseModalOpen}
        setIsOpen={setIsCourseModalOpen}
      />
    </div>
  );
}

function AddCourseModal({
  collegeId,
  collegeSlug,
  departmentId,
  departmentSlug,
  programId,
  programCode,
  collegeProgramId: _,
  courses,
  isOpen,
  setIsOpen,
}: {
  collegeId: string;
  collegeSlug: string;
  departmentId: string;
  departmentSlug: string;
  programId: string;
  programCode: string;
  collegeProgramId: string;
  courses: Course[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const addCourseMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      const { data } = await apiClient.api.colleges
        .admin({ id: collegeId })
        .departments({ departmentId })
        .programs({ programId })
        .courses.post({
          courseIds,
        });

      if (!data?.success) {
        throw new Error(data?.error || "Failed to add courses to program");
      }

      return data.data;
    },
    onSuccess: () => {
      toast.success("Courses added to program");
      setIsOpen(false);
      setSelectedCourses([]);

      queryClient.invalidateQueries({
        queryKey: [
          "admin",
          "program-courses",
          collegeSlug,
          departmentSlug,
          programCode,
        ],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClick = () => {
    addCourseMutation.mutate(selectedCourses);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Courses</DialogTitle>
          <DialogDescription>Add courses to this program.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="font-medium text-sm">Select Courses</Label>
            <MultiSelect
              values={selectedCourses}
              onValuesChange={setSelectedCourses}
            >
              <MultiSelectTrigger className="w-full max-w-100">
                <MultiSelectValue placeholder="Select courses..." />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {courses.map((course) => (
                    <MultiSelectItem
                      key={course.id}
                      value={course.id}
                      badgeLabel={course.code || ""}
                    >
                      {course.name}
                    </MultiSelectItem>
                  ))}
                </MultiSelectGroup>
              </MultiSelectContent>
            </MultiSelect>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleClick} disabled={selectedCourses.length === 0}>
            Add Courses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
