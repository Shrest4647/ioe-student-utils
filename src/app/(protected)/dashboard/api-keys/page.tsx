"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Edit, Eye, EyeOff, Plus, Search, Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Import authClient to check available methods
const authClient: any = require('@/lib/auth-client').authClient;

if (!authClient || !authClient.apiKey) {
  throw new Error("apiKey plugin not found in auth client");
}

export default function ApiKeysDashboardPage() {

export default function ApiKeysDashboardPage() {
  const [search, setSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["api-keys", debouncedSearch],
    queryFn: async () => {
      const { data } = await authClient.apiKey.list();
      return data?.success ? data.data : [];
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      expiresIn?: number;
      permissions?: Record<string, string[]>;
      metadata?: any;
    }) => {
      const result = await authClient.apiKey.create(data);
      if (result.error) {
        toast.error(`Failed to create API key: ${result.error.message}`);
        throw result.error;
      }
      toast.success("API key created successfully");
      refetch();
      return result.data;
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await authClient.apiKey.delete({ keyId: id });
      if (result.error) {
        toast.error(`Failed to delete API key: ${result.error.message}`);
        throw result.error;
      }
      toast.success("API key deleted successfully");
      refetch();
      return result.data;
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await authClient.apiKey.regenerate({ keyId: id });
      if (result.error) {
        toast.error(`Failed to regenerate API key: ${result.error.message}`);
        throw result.error;
      }
      toast.success("API key regenerated successfully");
      refetch();
      return result.data;
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(text);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error("Failed to copy API key");
    }
  };

  const apiKeys = data?.data ? data.data : [];
  const filteredApiKeys = apiKeys.filter((key) =>
    key.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
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
                  filteredApiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {apiKey.prefix || "sk_"}
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
                        <span className="text-sm text-muted-foreground">
                          {apiKey.remaining
                            ? `${apiKey.remaining} remaining`
                            : "Unlimited"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {apiKey.expiresAt
                            ? formatDistanceToNow(new Date(apiKey.expiresAt), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
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
                              regenerateApiKeyMutation.mutate(apiKey.id)
                            }
                            disabled={regenerateApiKeyMutation.isPending}
                          >
                            <Edit className="h-4 w-4" />
                            Regenerate
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              deleteApiKeyMutation.mutate(apiKey.id)
                            }
                            disabled={deleteApiKeyMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
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
