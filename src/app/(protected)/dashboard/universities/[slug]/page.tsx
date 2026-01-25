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

const universitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  websiteUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (starting with http:// or https://)")
    .or(z.literal("")),
  logoUrl: z.string().optional(),
  establishedYear: z.string().optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  isActive: z.boolean(),
});

const collegeSchema = z.object({
  universityId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  isActive: z.boolean(),
});

export default function UniversityEditPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = slug === "new";
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState(false);

  const universityQuery = useQuery({
    queryKey: ["admin", "university", slug],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api.universities
        .slug({ slug: slug as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  const collegesQuery = useQuery({
    queryKey: ["admin", "colleges", slug],
    queryFn: async () => {
      if (isNew) return [];
      const universityId = universityQuery.data?.id;
      const { data } = await apiClient.api.colleges.get({
        query: { universityId, limit: "50" },
      });
      return data?.success ? data.data : [];
    },
    enabled: !isNew && !!universityQuery.data?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof universitySchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.universities.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.universities
          .admin({ id: universityQuery.data?.id ?? "" })
          .patch(values);
        return data;
      }
    },

    onSuccess: (data: any) => {
      toast.success(isNew ? "University created" : "University updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "universities"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "university", slug],
      });
      if (isNew && data?.success) {
        router.push(`/dashboard/universities/${data.data.slug}`);
      } else {
        router.push("/dashboard/universities");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: universityQuery.data?.name || "",
      description: universityQuery.data?.description || "",
      websiteUrl: universityQuery.data?.websiteUrl || "",
      logoUrl: universityQuery.data?.logoUrl || "",
      establishedYear: universityQuery.data?.establishedYear || "",
      location: universityQuery.data?.location || "",
      country: universityQuery.data?.country || "",
      isActive: universityQuery.data?.isActive ?? true,
    } as z.infer<typeof universitySchema>,
    validators: {
      onChange: universitySchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (!isNew && universityQuery.isLoading) {
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

  const universityId = universityQuery.data?.id || "";

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/universities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New University" : "Edit University"}
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
                    <FieldLabel>University Name</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Tribhuvan University"
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
                      placeholder="A brief description of university..."
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
              <form.Field name="logoUrl">
                {(field) => (
                  <Field>
                    <FieldLabel>Logo URL</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <div className="grid gap-4 md:grid-cols-2">
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
                          placeholder="Kirtipur, Kathmandu"
                        />
                      </div>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="country">
                  {(field) => (
                    <Field>
                      <FieldLabel>Country</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Nepal"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <form.Field name="establishedYear">
                {(field) => (
                  <Field>
                    <FieldLabel>Established Year</FieldLabel>
                    <Input
                      type="number"
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="1959"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>

          {universityId && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Colleges</CardTitle>
                  <CardDescription>
                    Manage colleges under this university.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCollegeModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add College
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>College</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {collegesQuery.isLoading ? (
                        Array(3)
                          .fill(0)
                          .map((v, i) => (
                            <TableRow key={`skeleton-${v + i}`}>
                              <TableCell
                                colSpan={5}
                                className="h-12 animate-pulse bg-muted/50"
                              />
                            </TableRow>
                          ))
                      ) : collegesQuery.data?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No colleges found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        collegesQuery.data?.map((college) => (
                          <TableRow key={college.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                  <Building className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {college.name}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {college.slug}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{college.location || "N/A"}</TableCell>
                            <TableCell>{college.type || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${
                                    college.isActive
                                      ? "bg-green-500"
                                      : "bg-muted"
                                  }`}
                                />
                                <span className="text-muted-foreground text-xs">
                                  {college.isActive ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" asChild>
                                <Link
                                  href={`/dashboard/colleges/${college.slug}`}
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
                Control whether this university is visible to users.
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
                          ? "University is visible to users"
                          : "University is hidden from users"}
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
                ? "Create University"
                : "Update University"}
          </Button>
        </div>
      </form>
      <AddCollegeModal
        universityId={universityId}
        universityName={universityQuery.data?.name ?? ""}
        isOpen={isCollegeModalOpen}
        setIsOpen={setIsCollegeModalOpen}
      />
    </div>
  );
}

function AddCollegeModal({
  universityId,
  universityName,
  isOpen,
  setIsOpen,
}: {
  universityId: string;
  universityName: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { slug } = useParams();

  const addCollegeMutation = useMutation({
    mutationFn: async (values: z.infer<typeof collegeSchema>) => {
      const { data } = await apiClient.api.colleges.admin.post(values);
      return data;
    },
    onSuccess: () => {
      toast.success("College added");
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["admin", "colleges", slug] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      websiteUrl: "",
      location: "",
      type: "",
      isActive: true,
      universityId,
    } as z.infer<typeof collegeSchema>,
    validators: {
      onChange: collegeSchema,
    },
    onSubmit: async ({ value }) => {
      console.log("value", value);
      addCollegeMutation.mutate({ ...value, universityId });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Add New College</DialogTitle>
          <DialogDescription>
            Add a college to {universityName || "this university"}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>College Name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Institute of Engineering"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="type">
                {(field) => (
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <Input
                      value={field.state.value}
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
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Pulchowk, Lalitpur"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </div>
            <form.Field name="websiteUrl">
              {(field) => (
                <Field>
                  <FieldLabel>Website URL</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://example.com"
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
                    rows={3}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Brief description of the college..."
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
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
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </div>
              )}
            </form.Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add College</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
