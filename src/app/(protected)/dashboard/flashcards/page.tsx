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

export default function DashboardFlashcardsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardFlashcardsContent />
    </RoleGuard>
  );
}

function DashboardFlashcardsContent() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 400);
  const queryClient = useQueryClient();

  const decksQuery = useQuery({
    queryKey: ["dashboard", "flashcards", debouncedSearch],
    queryFn: async () => {
      const response = await apiClient.api.flashcards.get({
        query: { search: debouncedSearch, limit: "100", status: "draft" },
      });
      if (response.error || !response.data?.success) {
        throw new Error("Failed to fetch flashcard decks");
      }
      return response.data.data;
    },
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      if (publish) {
        return apiClient.api.flashcards.admin({ id }).publish.post();
      }
      return apiClient.api.flashcards.admin({ id }).unpublish.post();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "flashcards"] }),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) =>
      apiClient.api.flashcards.admin({ id }).delete(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dashboard", "flashcards"] }),
  });

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Flashcards</CardTitle>
          <Button asChild>
            <Link href="/dashboard/flashcards/new">
              <Plus className="mr-2 size-4" />
              New Deck
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search flashcard decks..."
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
              {(decksQuery.data ?? []).map((deck: any) => (
                <TableRow key={deck.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{deck.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {deck.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="capitalize" variant="outline">
                      {deck.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{deck.version}</TableCell>
                  <TableCell>
                    {deck.publishedAt
                      ? new Date(deck.publishedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/flashcards/${deck.id}`}>
                        <Edit2 className="size-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        publishMutation.mutate({
                          id: deck.id,
                          publish: deck.status !== "published",
                        })
                      }
                    >
                      {deck.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => archiveMutation.mutate(deck.id)}
                    >
                      Archive
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {decksQuery.isError ? (
            <p className="text-destructive text-sm">
              Failed to load flashcard decks.
            </p>
          ) : null}
          {!decksQuery.isLoading &&
          !decksQuery.isError &&
          (decksQuery.data?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm">
              No flashcard decks found.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
