"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/eden";

export default function TaxonomyDashboardPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("countries");

  // --- Queries ---
  const countriesQuery = useQuery({
    queryKey: ["admin", "countries"],
    queryFn: async () => {
      const { data } = await apiClient.api.scholarships.countries.get();
      return data?.success ? data.data : [];
    },
  });

  const degreesQuery = useQuery({
    queryKey: ["admin", "degrees"],
    queryFn: async () => {
      const { data } = await apiClient.api.scholarships.degrees.get();
      return data?.success ? data.data : [];
    },
  });

  const fieldsQuery = useQuery({
    queryKey: ["admin", "fields"],
    queryFn: async () => {
      const { data } = await apiClient.api.scholarships.fields.get();
      return data?.success ? data.data : [];
    },
  });

  // --- Mutations ---
  const addCountryMutation = useMutation({
    mutationFn: async (values: {
      code: string;
      name: string;
      region?: string;
    }) => {
      const { data } =
        await apiClient.api.scholarships.admin.countries.post(values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "countries"] });
      toast.success("Country added successfully");
    },
  });

  const addDegreeMutation = useMutation({
    mutationFn: async (values: { name: string; rank?: string }) => {
      const { data } =
        await apiClient.api.scholarships.admin.degrees.post(values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "degrees"] });
      toast.success("Degree level added successfully");
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async (values: { name: string }) => {
      const { data } =
        await apiClient.api.scholarships.admin.fields.post(values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "fields"] });
      toast.success("Field of study added successfully");
    },
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="degrees">Degree Levels</TabsTrigger>
            <TabsTrigger value="fields">Fields of Study</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="countries" className="mt-6">
          <TaxonomySection
            title="Countries"
            description="Manage country ISO codes and names."
            data={countriesQuery.data || []}
            isLoading={countriesQuery.isLoading}
            onAdd={(values) => addCountryMutation.mutate(values)}
            columns={[
              { key: "code", label: "Code" },
              { key: "name", label: "Name" },
              { key: "region", label: "Region" },
            ]}
            fields={(form) => (
              <>
                <form.Field name="code">
                  {(field: any) => (
                    <Field>
                      <FieldLabel>ISO Code (e.g., NP)</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: err as string,
                        }))}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="name">
                  {(field: any) => (
                    <Field>
                      <FieldLabel>Country Name</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: err as string,
                        }))}
                      />
                    </Field>
                  )}
                </form.Field>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="degrees" className="mt-6">
          <TaxonomySection
            title="Degree Levels"
            description="Manage degree levels (e.g., Bachelors, Masters)."
            data={degreesQuery.data || []}
            isLoading={degreesQuery.isLoading}
            onAdd={(values) => addDegreeMutation.mutate(values)}
            columns={[
              { key: "name", label: "Name" },
              { key: "rank", label: "Rank" },
            ]}
            fields={(form) => (
              <>
                <form.Field name="name">
                  {(field: any) => (
                    <Field>
                      <FieldLabel>Degree Name</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: err as string,
                        }))}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="rank">
                  {(field: any) => (
                    <Field>
                      <FieldLabel>Rank (for sorting)</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: err as string,
                        }))}
                      />
                    </Field>
                  )}
                </form.Field>
              </>
            )}
          />
        </TabsContent>

        <TabsContent value="fields" className="mt-6">
          <TaxonomySection
            title="Fields of Study"
            description="Manage categories for scholarships."
            data={fieldsQuery.data || []}
            isLoading={fieldsQuery.isLoading}
            onAdd={(values) => addFieldMutation.mutate(values)}
            columns={[{ key: "name", label: "Name" }]}
            fields={(form) => (
              <form.Field name="name">
                {(field: any) => (
                  <Field>
                    <FieldLabel>Field Name</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e: any) => field.handleChange(e.target.value)}
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) => ({
                        message: err as string,
                      }))}
                    />
                  </Field>
                )}
              </form.Field>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaxonomySection({
  title,
  description,
  data,
  isLoading,
  onAdd,
  columns,
  fields,
}: {
  title: string;
  description: string;
  data: any[];
  isLoading: boolean;
  onAdd: (values: any) => void;
  columns: { key: string; label: string }[];
  fields: (form: any) => React.ReactNode;
}) {
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm({
    defaultValues: columns.reduce((acc, col) => {
      acc[col.key] = "";
      return acc;
    }, {} as any),
    onSubmit: async ({ value }) => {
      onAdd(value);
      setIsAdding(false);
      form.reset();
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {title.slice(0, -1)}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-6 rounded-lg border bg-muted/30 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="grid gap-4 md:grid-cols-3 md:items-end"
            >
              {fields(form)}
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-12 animate-pulse bg-muted"
                  />
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className="h-24 text-center"
                  >
                    No items found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id || item.code}>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {item[col.key] || "N/A"}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
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
  );
}
