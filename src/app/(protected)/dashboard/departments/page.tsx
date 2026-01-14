"use client";

import { useQuery } from "@tanstack/react-query";
import { Edit2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/eden";

export default function DepartmentsDashboardPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "departments", debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.api.departments.get({
        query: { search: debouncedSearch, limit: "50" },
      });
      return data;
    },
  });

  const departments = data?.success ? data.data : [];

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>
              Manage existing department entries.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/departments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Department
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((v, i) => (
                      <TableRow key={`skeleton-${v + i}`}>
                        <TableCell
                          colSpan={3}
                          className="h-12 animate-pulse bg-muted/50"
                        />
                      </TableRow>
                    ))
                ) : departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No departments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{department.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {department.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            department.isActive ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {department.isActive ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/dashboard/departments/${department.slug}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
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
    </div>
  );
}
