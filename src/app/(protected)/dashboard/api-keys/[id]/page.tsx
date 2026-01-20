"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Key, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/eden";

export default function ApiKeyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [expiresIn, setExpiresIn] = useState(30);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [metadata, setMetadata] = useState("{}");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["api-key", params.id],
    queryFn: async () => {
      const { data, error } = await apiClient.api
        .apikeys({
          id: params.id,
        })
        .get();
      if (error) {
        throw error;
      }
      return data?.data || null;
    },
  });

  const apiKey = data;

  const updateApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) return;

      const { error } = await apiClient.api
        .apikeys({
          id: params.id,
        })
        .put({
          name: name.trim(),
          enabled,
          expiresIn: expiresIn * 24 * 60 * 60, // Convert days to seconds
          permissions: selectedPermissions.reduce(
            (acc, permission) => {
              acc[permission] = ["read", "write"];
              return acc;
            },
            {} as Record<string, string[]>,
          ),
          metadata: metadata ? JSON.parse(metadata) : undefined,
        });

      if (error) {
        toast.error(`Failed to update API key: ${error || "Unknown error"}`);
        throw error;
      }

      toast.success("API key updated successfully!");
      setIsUpdating(false);
      refetch();
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) return;

      const { error } = await apiClient.api
        .apikeys({
          id: params.id,
        })
        .regenerate.post({
          params: { id: params.id },
        });

      if (error) {
        toast.error(
          `Failed to regenerate API key: ${error || "Unknown error"}`,
        );
        throw error;
      }

      toast.success("API key regenerated successfully!");
      refetch();
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) return;

      const { error } = await apiClient.api
        .apikeys({
          id: params.id,
        })
        .put({
          name: name.trim(),
          enabled,
          expiresIn: expiresIn * 24 * 60 * 60, // Convert days to seconds
          permissions: selectedPermissions.reduce(
            (acc, permission) => {
              acc[permission] = ["read", "write"];
              return acc;
            },
            {} as Record<string, string[]>,
          ),
          metadata: metadata ? JSON.parse(metadata) : undefined,
        });

      if (error) {
        toast.error(`Failed to delete API key: ${error || "Unknown error"}`);
        throw error;
      }

      toast.success("API key deleted successfully!");
      router.push("/dashboard/api-keys");
    },
  });

  if (!apiKey && !isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/api-keys"
            className="mb-4 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to API Keys
          </Link>
        </div>

        <div className="text-center">
          <h1 className="font-bold text-2xl">API Key Not Found</h1>
          <p className="text-muted-foreground">
            The API key you&apos;re looking for does not exist or you don&apos;t
            have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  // Update state when data loads
  if (apiKey && !name) {
    setName(apiKey.name || "");
    setEnabled(apiKey.enabled || false);
    setExpiresIn(
      apiKey.expiresAt
        ? Math.floor(
            (new Date(apiKey.expiresAt).getTime() - Date.now()) /
              (24 * 60 * 60 * 1000),
          )
        : 30,
    );
    setSelectedPermissions(
      apiKey.permissions ? Object.keys(apiKey.permissions) : [],
    );
    setMetadata(apiKey.metadata ? JSON.stringify(apiKey.metadata) : "{}");
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/api-keys"
            className="mb-4 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to API Keys
          </Link>
        </div>
        <div className="text-center">
          <h1 className="font-bold text-2xl">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/api-keys"
          className="mb-4 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to API Keys
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-xl">API Key Details</span>
            </CardTitle>
            <CardDescription>
              View and manage your API key settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">API Key Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <Label htmlFor="prefix">Key Prefix</Label>
                <Input
                  id="prefix"
                  value={apiKey?.prefix || ""}
                  disabled
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={enabled.toString()}
                  onValueChange={(value) => setEnabled(value === "true")}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiresIn">Expires In</Label>
                <Select
                  value={expiresIn.toString()}
                  onValueChange={(value) => setExpiresIn(Number(value))}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">1 week</SelectItem>
                    <SelectItem value="30">1 month</SelectItem>
                    <SelectItem value="90">3 months</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateApiKeyMutation.mutate()}
                  disabled={isUpdating || !name.trim()}
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Usage Statistics</Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="font-bold text-2xl text-primary">
                        {apiKey?.remaining || "Unlimited"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Requests Remaining
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-2xl text-green-600">
                        {apiKey?.rateLimitMax || "No Limit"}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Rate Limit per Day
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="space-y-2">
                    {[
                      { resource: "scholarships", label: "Scholarships" },
                      { resource: "universities", label: "Universities" },
                      { resource: "colleges", label: "Colleges" },
                      { resource: "departments", label: "Departments" },
                      { resource: "programs", label: "Programs" },
                      { resource: "courses", label: "Courses" },
                      { resource: "resources", label: "Resources" },
                      { resource: "recommendations", label: "Recommendations" },
                      { resource: "resumes", label: "Resumes" },
                      { resource: "ratings", label: "Ratings" },
                    ].map(({ resource, label }) => (
                      <div
                        key={resource}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={resource}
                            checked={selectedPermissions.includes(resource)}
                            onCheckedChange={(checked) => {
                              setSelectedPermissions((prev) => {
                                if (checked) {
                                  return [...prev, resource];
                                } else {
                                  return prev.filter((p) => p !== resource);
                                }
                              });
                            }}
                          />
                          <Label
                            htmlFor={resource}
                            className="font-normal text-sm"
                          >
                            {label}
                          </Label>
                        </div>
                        <span className="text-muted-foreground text-sm">
                          {selectedPermissions.includes(resource)
                            ? "Granted"
                            : "Not Granted"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Created</Label>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="font-bold text-2xl text-blue-600">
                        {formatDistanceToNow(
                          new Date(apiKey?.createdAt || ""),
                          {
                            addSuffix: true,
                          },
                        )}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Created On
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-2xl text-green-600">
                        {formatDistanceToNow(
                          new Date(apiKey?.updatedAt || ""),
                          {
                            addSuffix: true,
                          },
                        )}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Last Updated
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => regenerateApiKeyMutation.mutate()}
                disabled={regenerateApiKeyMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Key
              </Button>
            </div>

            <div className="space-y-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => deleteApiKeyMutation.mutate()}
                disabled={deleteApiKeyMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
