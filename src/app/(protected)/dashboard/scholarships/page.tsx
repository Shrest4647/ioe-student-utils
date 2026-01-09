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

export default function ScholarshipsDashboardPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "scholarships", debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.api.scholarships.get({
        query: { search: debouncedSearch, limit: "50" },
      });
      return data;
    },
  });

  const scholarships = data?.success ? data.data : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Scholarships</CardTitle>
            <CardDescription>
              Manage existing scholarship entries.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/scholarships/new">
              <Plus className="mr-2 h-4 w-4" />
              New Scholarship
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, provider, or description..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scholarship</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rounds</TableHead>
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
                          colSpan={5}
                          className="h-12 animate-pulse bg-muted/50"
                        />
                      </TableRow>
                    ))
                ) : scholarships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No scholarships found.
                    </TableCell>
                  </TableRow>
                ) : (
                  scholarships.map((scholarship) => (
                    <TableRow key={scholarship.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {scholarship.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {scholarship.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{scholarship.providerName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            scholarship.status === "active"
                              ? "default"
                              : scholarship.status === "inactive"
                                ? "secondary"
                                : "outline"
                          }
                          className="capitalize"
                        >
                          {scholarship.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {scholarship.rounds?.length || 0} rounds
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/dashboard/scholarships/${scholarship.id}`}
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
