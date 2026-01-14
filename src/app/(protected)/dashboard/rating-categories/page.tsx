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

export default function RatingCategoriesDashboardPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "rating-categories", debouncedSearch],
    queryFn: async () => {
      const { data } = await apiClient.api.ratings.categories.get();
      return data;
    },
  });

  const categories = data?.success ? data.data : [];

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Rating Categories</CardTitle>
            <CardDescription>
              Manage rating categories for different entity types.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/rating-categories/new">
              <Plus className="mr-2 h-4 w-4" />
              New Category
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
                  <TableHead>Category</TableHead>
                  <TableHead>Entity Type</TableHead>
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
                          colSpan={4}
                          className="h-12 animate-pulse bg-muted/50"
                        />
                      </TableRow>
                    ))
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No rating categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{category.name}</span>
                          {category.description && (
                            <span className="text-muted-foreground text-xs">
                              {category.description}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={category.isActive ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {category.isActive ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/dashboard/rating-categories/${category.slug}`}
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
