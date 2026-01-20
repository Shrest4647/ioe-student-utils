"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Edit, Eye, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
import { authClient } from "@/lib/auth-client";

interface ApiKey {
  id: string;
  name: string | null;
  prefix: string | null;
  start: string | null;
  enabled: boolean;
  rateLimitEnabled: boolean;
  rateLimitMax: number | null;
  remaining: number | null;
  expiresAt: string | null;
  lastRequest: string | null;
  permissions: Record<string, string[]> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export default function ApiKeysDashboardPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 300);
  const [_copiedKey, setCopiedKey] = useState<string | null>(null);
  const _queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["api-keys", debouncedSearch],
    queryFn: async () => {
      const response = await fetch("/api/api-keys", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const result = await response.json();
      return result.success ? result.data : [];
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (createData: {
      name: string;
      expiresIn?: number;
      permissions?: Record<string, string[]>;
      metadata?: any;
    }) => {
      const { data, error } = await authClient.apiKey.create({
        name: createData.name,
        expiresIn: createData.expiresIn
          ? createData.expiresIn / (24 * 60 * 60)
          : undefined, // Convert from days to seconds
        permissions: createData.permissions,
        metadata: createData.metadata,
      });
      if (error) {
        toast.error(`Failed to create API key: ${error.message}`);
        throw error;
      }
      toast.success("API key created successfully");
      refetch();
      return data;
    },
  });

  const _deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await authClient.apiKey.delete({ keyId: id });
      if (error) {
        toast.error(`Failed to delete API key: ${error.message}`);
        throw error;
      }
      toast.success("API key deleted successfully");
      refetch();
      return data;
    },
  });

  const _copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (_error) {
      toast.error("Failed to copy API key");
    }
  };

  const apiKeys = data || [];
  const filteredApiKeys = apiKeys.filter((key: ApiKey) =>
    key.name
      ? key.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      : false,
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access to your data.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/api-keys/new">
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or prefix..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
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
                          colSpan={6}
                          className="h-12 animate-pulse bg-muted/50"
                        />
                      </TableRow>
                    ))
                ) : filteredApiKeys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No API keys found. Create your first API key to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApiKeys.map((apiKey: ApiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs">
                          {apiKey.prefix || "No prefix"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={apiKey.enabled ? "default" : "secondary"}
                        >
                          {apiKey.enabled ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {apiKey.remaining
                            ? `${apiKey.remaining} remaining`
                            : "Unlimited"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {apiKey.expiresAt
                            ? formatDistanceToNow(new Date(apiKey.expiresAt), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(apiKey.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/api-keys/${apiKey.id}`}>
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              createApiKeyMutation.mutate({
                                name: `Regenerated - ${apiKey.name}`,
                                permissions: apiKey.permissions
                                  ? Object.keys(
                                      apiKey.permissions || {},
                                    ).reduce(
                                      (acc, key) => {
                                        acc[key] =
                                          apiKey.permissions?.[key] || [];
                                        return acc;
                                      },
                                      {} as Record<string, string[]>,
                                    )
                                  : {},
                                expiresIn: apiKey.expiresAt
                                  ? Math.floor(
                                      (new Date(apiKey.expiresAt).getTime() -
                                        Date.now()) /
                                        (24 * 60 * 60 * 1000),
                                    )
                                  : undefined,
                                metadata: apiKey.metadata,
                              })
                            }
                            disabled={createApiKeyMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                            Regenerate
                          </Button>
                        </div>
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
