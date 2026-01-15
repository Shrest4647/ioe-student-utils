"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { authClient } from "@/lib/auth-client";

interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  start: string | null;
  enabled: boolean;
  rateLimitEnabled: boolean;
  rateLimitMax: string | null;
  remaining: string | null;
  expiresAt: string | null;
  permissions: Record<string, string[]> | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

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

  const { data, isLoading } = useQuery({
    queryKey: ["api-key", params.id],
    queryFn: async () => {
      const { data } = await authClient.apiKey.get({ id: params.id });
      return data?.success ? data.data : null;
    },
  });

  const apiKey = data?.success ? data.data : null;

  const updateApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) return;

      const result = await authClient.apiKey.update({
        keyId: params.id,
        name: name.trim(),
        enabled,
        permissions: selectedPermissions.reduce(
          (acc, permission) => {
            acc[permission] = true;
            return acc;
          },
          {} as Record<string, string[]>,
        ),
        metadata: metadata ? JSON.parse(metadata) : undefined,
      });

      if (result.error) {
        toast.error(`Failed to update API key: ${result.error.message}`);
        throw result.error;
      }

      toast.success("API key updated successfully!");
      setIsUpdating(false);
    },
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) return;

      const result = await authClient.apiKey.regenerate({ keyId: params.id });
      if (result.error) {
        toast.error(`Failed to regenerate API key: ${result.error.message}`);
        throw result.error;
      }

      toast.success("API key regenerated successfully!");
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!apiKey) return;

      const result = await authClient.apiKey.delete({ keyId: params.id });
      if (result.error) {
        toast.error(`Failed to delete API key: ${result.error.message}`);
        throw result.error;
      }

      toast.success("API key deleted successfully!");
      router.push("/dashboard/api-keys");
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy API key");
    }
  };

  if (!apiKey) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard/api-keys"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to API Keys
          </Link>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">API Key Not Found</h1>
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
    setName(apiKey.name);
    setEnabled(apiKey.enabled);
    setExpiresIn(
      apiKey.expiresAt
        ? Math.floor(
            (new Date(apiKey.expiresAt).getTime() - Date.now()) /
              (24 * 60 * 60 * 1000),
          )
        : 30,
    );
    setSelectedPermissions(apiKey.permissions || []);
    setMetadata(apiKey.metadata ? JSON.stringify(apiKey.metadata) : "{}");
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/api-keys"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to API Keys
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold">API Key Details</span>
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
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {apiKey.remaining || "Unlimited"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requests Remaining
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {apiKey.rateLimitMax || "No Limit"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rate Limit per Day
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="bg-muted/50 border rounded-lg p-4">
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
                            className="text-sm font-normal"
                          >
                            {label}
                          </Label>
                        </div>
                        <span className="text-sm text-muted-foreground">
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
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatDistanceToNow(new Date(apiKey.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">Created On</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {formatDistanceToNow(new Date(apiKey.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last Updated
                    </p>
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
