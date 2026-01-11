"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Edit2,
  Globe,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
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

const departmentSchema = z.object({
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  isActive: z.boolean(),
});

type Program = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: string | null;
  isActive: boolean;
};

export default function DepartmentEditPage() {
  const { slug, departmentSlug } = useParams();
  const queryClient = useQueryClient();
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);

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

  const programsQuery = useQuery({
    queryKey: ["admin", "programs"],
    queryFn: async () => {
      const { data } = await apiClient.api.programs.get({
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

  const departmentProgramsQuery = useQuery({
    queryKey: ["admin", "department-programs", slug, departmentSlug],
    queryFn: async () => {
      if (!collegeDepartmentQuery.data?.id) return [];
      const collegeId = collegeQuery.data?.id;
      const departmentId = departmentQuery.data?.id;

      if (!collegeId || !departmentId) return [];

      const { data } = await apiClient.api
        .colleges({ id: collegeId })
        .departments({ departmentId })
        .programs.get();

      return data?.success ? data.data : [];
    },
    enabled: !!collegeDepartmentQuery.data?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof departmentSchema>) => {
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
      toast.success("Department updated");
      queryClient.invalidateQueries({
        queryKey: ["admin", "college-department", slug, departmentSlug],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "college", slug],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      description:
        collegeDepartmentQuery.data?.description ||
        departmentQuery.data?.description ||
        "",
      websiteUrl:
        collegeDepartmentQuery.data?.websiteUrl ||
        departmentQuery.data?.websiteUrl ||
        "",
      isActive: collegeDepartmentQuery.data?.isActive ?? true,
    } as z.infer<typeof departmentSchema>,
    validators: {
      onChange: departmentSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (
    !collegeQuery.data ||
    !departmentQuery.data ||
    (!collegeDepartmentQuery.data && collegeDepartmentQuery.isLoading)
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

  const programs: Program[] = programsQuery.data || [];
  const collegeDepartmentId = collegeDepartmentQuery.data?.id || "";
  const collegeId = collegeQuery.data?.id || "";
  const departmentId = departmentQuery.data?.id || "";

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/colleges/${slug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-bold text-2xl">
            {departmentQuery.data?.name} - {collegeQuery.data?.name}
          </h2>
          <p className="text-muted-foreground">
            Customize department for {collegeQuery.data?.name}
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
              <CardTitle>Department Information</CardTitle>
              <CardDescription>
                Customize how this department appears for{" "}
                {collegeQuery.data?.name}. These values will override the
                general department information if provided.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <div className="font-medium text-sm">General Department</div>
                <div className="text-muted-foreground text-sm">
                  {departmentQuery.data?.description || "No description"}
                </div>
                {departmentQuery.data?.websiteUrl && (
                  <a
                    href={departmentQuery.data.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline"
                  >
                    {departmentQuery.data.websiteUrl}
                  </a>
                )}
              </div>

              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Description</FieldLabel>
                    <Textarea
                      rows={6}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Custom description for this college department (leave empty to use general department description)"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) => ({
                        message: typeof err === "string" ? err : err?.message,
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="websiteUrl">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Website URL</FieldLabel>
                    <div className="relative">
                      <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://example.com/department"
                      />
                    </div>
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) => ({
                        message: typeof err === "string" ? err : err?.message,
                      }))}
                    />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {collegeDepartmentId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Programs</CardTitle>
                  <CardDescription>
                    Manage programs under this department.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProgramModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Program
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentProgramsQuery.isLoading ? (
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
                      ) : departmentProgramsQuery.data?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            No programs found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        departmentProgramsQuery.data?.map(
                          (deptProgram: any) => (
                            <TableRow key={deptProgram.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {deptProgram.program?.name}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {deptProgram.program?.code}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-mono text-sm">
                                  {deptProgram.code ||
                                    deptProgram.program?.code}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-2 w-2 rounded-full ${
                                      deptProgram.isActive
                                        ? "bg-green-500"
                                        : "bg-muted"
                                    }`}
                                  />
                                  <span className="text-muted-foreground text-xs">
                                    {deptProgram.isActive
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link
                                    href={`/dashboard/colleges/${slug}/departments/${departmentSlug}/programs/${deptProgram.program?.code}`}
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
                          ),
                        )
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
                Control whether this department is visible for{" "}
                {collegeQuery.data?.name}.
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
                          ? "Department is visible"
                          : "Department is hidden"}
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
              : collegeDepartmentQuery.data?.id
                ? "Update Department"
                : "Create Department"}
          </Button>
        </div>
      </form>

      <AddProgramModal
        collegeSlug={slug as string}
        departmentSlug={departmentSlug as string}
        collegeId={collegeId}
        departmentId={departmentId}
        collegeDepartmentId={collegeDepartmentId}
        programs={programs}
        isOpen={isProgramModalOpen}
        setIsOpen={setIsProgramModalOpen}
      />
    </div>
  );
}

function AddProgramModal({
  collegeId,
  departmentId,
  collegeSlug,
  departmentSlug,
  collegeDepartmentId: _,
  programs,
  isOpen,
  setIsOpen,
}: {
  collegeId: string;
  collegeSlug: string;
  departmentSlug: string;
  departmentId: string;
  collegeDepartmentId: string;
  programs: Program[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const addProgramMutation = useMutation({
    mutationFn: async (programIds: string[]) => {
      const { data } = await apiClient.api.colleges
        .admin({ id: collegeId })
        .departments({ departmentId })
        .programs.post({
          programIds,
        });
      if (data?.success) {
        return data.data;
      }
    },
    onSuccess: (response) => {
      toast.success(
        `${response?.added ?? ""} Programs added to department ${response?.removed ? `and ${response?.removed} Programs removed` : ""}`,
      );
      setIsOpen(false);
      setSelectedPrograms([]);

      queryClient.invalidateQueries({
        queryKey: ["admin", "department-programs", collegeSlug, departmentSlug],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClick = () => {
    addProgramMutation.mutate(selectedPrograms);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Programs</DialogTitle>
          <DialogDescription>
            Add programs to this department.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="font-medium text-sm">Select Programs</Label>
            <MultiSelect
              values={selectedPrograms}
              onValuesChange={setSelectedPrograms}
            >
              <MultiSelectTrigger className="w-full max-w-100">
                <MultiSelectValue placeholder="Select programs..." />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {programs.map((program) => (
                    <MultiSelectItem
                      key={program.id}
                      value={program.id}
                      badgeLabel={program.code || ""}
                    >
                      {program.name}
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
          <Button
            onClick={handleClick}
            disabled={selectedPrograms.length === 0}
          >
            Add Programs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
