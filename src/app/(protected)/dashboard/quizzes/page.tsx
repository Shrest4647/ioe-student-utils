"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { RoleGuard } from "@/components/auth/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DashboardQuizzesPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardQuizzesContent />
    </RoleGuard>
  );
}

function DashboardQuizzesContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 400);
  const queryClient = useQueryClient();

  const quizzesQuery = useQuery({
    queryKey: ["dashboard", "quizzes", debouncedSearch],
    queryFn: async () => {
      const response = await apiClient.api.quizzes.get({
        query: { search: debouncedSearch, limit: "100" },
      });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch quizzes");
      }
      return response.data.data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      if (publish) {
        return apiClient.api.quizzes.admin({ id }).publish.post();
      }
      return apiClient.api.quizzes.admin({ id }).unpublish.post();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "quizzes"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) =>
      apiClient.api.quizzes.admin({ id }).delete(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "quizzes"] }),
  });

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quizzes</CardTitle>
          <Button asChild>
            <Link href="/dashboard/quizzes/new">
              <Plus className="mr-2 size-4" />
              New Quiz
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(quizzesQuery.data ?? []).map((quiz: any) => (
                <TableRow key={quiz.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {quiz.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize" variant="outline">
                      {quiz.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{quiz.version}</TableCell>
                  <TableCell>
                    {quiz.publishedAt
                      ? new Date(quiz.publishedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/quizzes/${quiz.id}`}>
                        <Edit2 className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        publishMutation.mutate({
                          id: quiz.id,
                          publish: quiz.status !== "published",
                        })
                      }
                    >
                      {quiz.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => archiveMutation.mutate(quiz.id)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
