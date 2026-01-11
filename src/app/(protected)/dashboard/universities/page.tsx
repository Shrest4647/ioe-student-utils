"use client";

import { useQuery } from "@tanstack/react-query";
import { Edit2, Plus, Search } from "lucide-react";
import Image from "next/image";
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

export default function UniversitiesDashboardPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "universities", debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.api.universities.get({
        query: { search: debouncedSearch, limit: "50" },
      });
      return data;
    },
  });

  const universities = data?.success ? data.data : [];

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Universities</CardTitle>
            <CardDescription>
              Manage existing university entries.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/universities/new">
              <Plus className="mr-2 h-4 w-4" />
              New University
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or location..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>University</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Country</TableHead>
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
                          colSpan={5}
                          className="h-12 animate-pulse bg-muted/50"
                        />
                      </TableRow>
                    ))
                ) : universities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No universities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  universities.map((university) => (
                    <TableRow key={university.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {university.logoUrl && (
                            <Image
                              width={32}
                              height={32}
                              src={university.logoUrl}
                              alt={university.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {university.name}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {university.slug}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{university.location || "N/A"}</TableCell>
                      <TableCell>{university.country || "N/A"}</TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            university.isActive ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {university.isActive ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/dashboard/universities/${university.slug}`}
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
