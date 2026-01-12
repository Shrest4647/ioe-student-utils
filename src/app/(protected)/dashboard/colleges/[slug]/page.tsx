"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building,
  Edit2,
  Globe,
  MapPin,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const collegeSchema = z.object({
  universityId: z.string().min(1, "University is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  isActive: z.boolean(),
});

type Department = {
  slug: string;
  name: string;
  id: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: string | null;
  description: string | null;
  updatedById: string | null;
  websiteUrl: string | null;
  isActive: boolean;
};

export default function CollegeEditPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = slug === "new";
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  const universitiesQuery = useQuery({
    queryKey: ["admin", "universities"],
    queryFn: async () => {
      const { data } = await apiClient.api.universities.get({
        query: { limit: "100" },
      });
      return data?.success ? data.data : [];
    },
  });

  const collegeQuery = useQuery({
    queryKey: ["admin", "college", slug],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api.colleges
        .slug({ slug: slug as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  const departmentsQuery = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: async () => {
      const { data } = await apiClient.api.departments.get({
        query: { limit: "100" },
      });
      return data?.success ? data.data : [];
    },
  });

  const collegeDepartmentsQuery = useQuery({
    queryKey: ["admin", "college-departments", slug],
    queryFn: async () => {
      if (isNew) return [];
      const collegeId = collegeQuery.data?.id;
      const { data } = await apiClient.api
        .colleges({ id: collegeId || "" })
        .departments.get();
      return data?.success ? data.data : [];
    },
    enabled: !isNew && !!collegeQuery.data?.id,
  });

  console.log("collegeDepts", collegeDepartmentsQuery.data);

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof collegeSchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.colleges.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.colleges
          .admin({ id: collegeQuery.data?.id || "" })
          .patch(values);
        return data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isNew ? "College created" : "College updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "colleges"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "college", slug] });
      if (isNew && data?.success) {
        router.push(`/dashboard/colleges/${data.data.slug}`);
      } else {
        router.push("/dashboard/colleges");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      universityId: collegeQuery.data?.universityId || "",
      name: collegeQuery.data?.name || "",
      description: collegeQuery.data?.description || "",
      websiteUrl: collegeQuery.data?.websiteUrl || "",
      location: collegeQuery.data?.location || "",
      type: collegeQuery.data?.type || "",
      isActive: collegeQuery.data?.isActive ?? true,
    } as z.infer<typeof collegeSchema>,
    validators: {
      onChange: collegeSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  useEffect(() => {
    if (collegeQuery.data) {
      form.reset({
        universityId: collegeQuery.data.universityId || "",
        name: collegeQuery.data.name || "",
        description: collegeQuery.data.description || "",
        websiteUrl: collegeQuery.data.websiteUrl || "",
        location: collegeQuery.data.location || "",
        type: collegeQuery.data.type || "",
        isActive: collegeQuery.data.isActive ?? true,
      });
    }
  }, [collegeQuery.data, form.reset]);

  if ((!isNew && collegeQuery.isLoading) || universitiesQuery.isLoading) {
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

  const universities = universitiesQuery.data || [];
  const departments: Department[] = departmentsQuery.data || [];
  const collegeId = collegeQuery.data?.id || "";

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/colleges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New College" : "Edit College"}
        </h2>
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
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="name">
                {(field) => (
                  <Field>
                    <FieldLabel>College Name</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Institute of Engineering"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      rows={6}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="A brief description of the college..."
                    />
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

          <Card>
            <CardHeader>
              <CardTitle>Contact & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="universityId">
                {(field) => (
                  <Field>
                    <FieldLabel>University</FieldLabel>
                    <Select
                      value={field.state.value as string}
                      onValueChange={(v) => field.handleChange(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id}>
                            {uni.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="type">
                  {(field) => (
                    <Field>
                      <FieldLabel>Type</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Constituent, Affiliated"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="location">
                  {(field) => (
                    <Field>
                      <FieldLabel>Location</FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Pulchowk, Lalitpur"
                        />
                      </div>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <form.Field name="websiteUrl">
                {(field) => (
                  <Field>
                    <FieldLabel>Website URL</FieldLabel>
                    <div className="relative">
                      <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://example.com"
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

          {collegeId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Departments</CardTitle>
                  <CardDescription>
                    Manage departments under this college.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDepartmentModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collegeDepartmentsQuery.isLoading ? (
                        Array(3)
                          .fill(0)
                          .map((v, i) => (
                            <TableRow key={`skeleton-${v + i}`}>
                              <TableCell
                                colSpan={3}
                                className="h-12 animate-pulse bg-muted/50"
                              />
                            </TableRow>
                          ))
                      ) : collegeDepartmentsQuery.data?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No departments found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        collegeDepartmentsQuery.data?.map((department) => (
                          <TableRow key={department.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                  <Building className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {department?.department?.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {department.department?.slug}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    department.isActive
                                      ? "bg-green-500"
                                      : "bg-muted"
                                  }`}
                                />
                                <span className="text-muted-foreground text-xs">
                                  {department.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={`/dashboard/colleges/${slug}/departments/${department.department?.slug}`}
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
                Control whether this college is visible to users.
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
                          ? "College is visible to users"
                          : "College is hidden from users"}
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
              : isNew
                ? "Create College"
                : "Update College"}
          </Button>
        </div>
      </form>
      <AddDepartmentModal
        collegeSlug={slug as string}
        collegeId={collegeId}
        collegeName={collegeQuery.data?.name ?? ""}
        departments={departments}
        isOpen={isDepartmentModalOpen}
        setIsOpen={setIsDepartmentModalOpen}
      />
    </div>
  );
}

function AddDepartmentModal({
  collegeSlug,
  collegeId,
  collegeName,
  departments,
  isOpen,
  setIsOpen,
}: {
  collegeSlug: string;
  collegeId: string;
  collegeName: string;
  departments: {
    id: string;
    name: string;
  }[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const addDepartmentMutation = useMutation({
    mutationFn: async (departmentIds: string[]) => {
      const { data } = await apiClient.api.colleges
        .admin({ id: collegeId || "" })
        .departments.post({
          departmentIds,
        });
      return data;
    },
    onSuccess: () => {
      toast.success("Department added to college");
      setIsOpen(false);
      setSelectedDepartments([]);

      queryClient.invalidateQueries({
        queryKey: ["admin", "college-departments", collegeSlug],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleClick = () => {
    addDepartmentMutation.mutate(selectedDepartments);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add Departments</DialogTitle>
          <DialogDescription>
            Add departments to {collegeName || "this college"}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="font-medium text-sm">Select Departments</Label>
            <MultiSelect
              values={selectedDepartments}
              onValuesChange={setSelectedDepartments}
            >
              <MultiSelectTrigger className="w-full max-w-100">
                <MultiSelectValue placeholder="Select departments..." />
              </MultiSelectTrigger>
              <MultiSelectContent>
                <MultiSelectGroup>
                  {departments.map((department) => (
                    <MultiSelectItem
                      key={department.id}
                      value={department.id}
                      badgeLabel={department.name}
                    >
                      {department.name}
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
            disabled={selectedDepartments.length === 0}
          >
            Add Departments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
