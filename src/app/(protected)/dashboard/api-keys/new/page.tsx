"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Clock, Eye, Key } from "lucide-react";
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

const _PERMISSION_OPTIONS = [
  { id: "read", label: "Read Only" },
  { id: "write", label: "Read & Write" },
  { id: "delete", label: "Read, Write & Delete" },
] as const;

const EXPIRATION_OPTIONS = [
  { value: 1, label: "1 day" },
  { value: 7, label: "1 week" },
  { value: 30, label: "1 month" },
  { value: 90, label: "3 months" },
  { value: 365, label: "1 year" },
] as const;

/**
 * Renders the "Create New API Key" page and manages the creation flow and post-creation UI.
 *
 * Displays a form to configure API key name, expiration, per-resource permissions, and optional metadata;
 * after successful creation it shows the generated key, expiration and permission summary, and actions to copy the key or create another.
 *
 * @returns A React element that renders the new API key creation page and its result view.
 */
export default function NewApiKeyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expiresIn, setExpiresIn] = useState(30);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [metadata, setMetadata] = useState("{}");
  const [isCreating, setIsCreating] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<any>(null);
  const [_showApiKey, setShowApiKey] = useState(false);

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("API key name is required");
      }

      setIsCreating(true);
      try {
        const response = await apiClient.api["api-keys"].post({
          name: name.trim(),
          expiresIn: expiresIn * 24 * 60 * 60, // Convert days to seconds
          permissions: selectedPermissions.reduce(
            (acc, permission) => {
              acc[permission] = ["read", "write"];
              return acc;
            },
            {} as Record<string, string[]>,
          ),
        });

        const result = response.data;
        const error = response.error;
        if (!result || !result.success) {
          toast.error("Failed to create API key: No response from server");
          console.error("Failed to create API key", error);
          return;
        }

        setCreatedApiKey(result.data);
        setShowApiKey(true);
        toast.success("API key created successfully!");
      } catch (error) {
        toast.error("Failed to create API key");
        console.error("Error creating API key:", error);
      } finally {
        setIsCreating(false);
      }
    },
  });

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setSelectedPermissions((prev) => {
      if (checked) {
        return [...prev, permission];
      } else {
        return prev.filter((p) => p !== permission);
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("API key copied to clipboard");
    } catch (_error) {
      toast.error("Failed to copy API key");
    }
  };

  const handleCreateNewKey = () => {
    setCreatedApiKey(null);
    setShowApiKey(false);
    setName("");
    setExpiresIn(30);
    setSelectedPermissions(["read"]);
    setMetadata("{}");
    router.push("/dashboard/api-keys");
  };

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

        <h1 className="font-bold text-3xl">Create New API Key</h1>
        <p className="mb-8 text-muted-foreground">
          Generate a new API key for programmatic access to your data. Keys are
          shown only once during creation.
        </p>
      </div>

      {!createdApiKey ? (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Create API Key</CardTitle>
            <CardDescription>
              Configure your new API key with custom permissions and expiration
              time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">API Key Name</Label>
                <Input
                  id="name"
                  placeholder="My API Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresIn">Expiration Time</Label>
                <Select
                  value={expiresIn.toString()}
                  onValueChange={(value) => setExpiresIn(Number(value))}
                  disabled={isCreating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration time" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <p className="mb-4 text-muted-foreground text-sm">
                  Select what resources this API key can access:
                </p>
                <div className="space-y-3">
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
                  ].map(({ resource, label }) => {
                    return (
                      <div
                        key={resource}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={resource}
                          checked={selectedPermissions.includes(resource)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(resource, !!checked)
                          }
                          disabled={isCreating}
                        />
                        <Label
                          htmlFor={resource}
                          className="font-normal text-sm"
                        >
                          {label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (Optional)</Label>
                <Input
                  id="metadata"
                  placeholder='{"purpose": "data_import", "environment": "production"}'
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  disabled={isCreating}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="submit"
                onClick={() => createApiKeyMutation.mutate()}
                disabled={isCreating || !name.trim()}
                className="min-w-32"
              >
                {isCreating ? "Creating..." : "Create API Key"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-6 w-6 text-green-600" />
              API Key Created Successfully!
            </CardTitle>
            <CardDescription>
              Copy this key now and save it securely. It won&apos;t be shown
              again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border-2 border-dashed bg-muted/50 p-8">
              <div className="space-y-4 text-center">
                <div className="mb-4 flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Expires in {expiresIn} days</p>
                    <p className="text-xs">
                      Created {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <code className="break-all font-mono text-sm">
                    {createdApiKey?.key || "API Key"}
                  </code>
                </div>

                <div className="text-muted-foreground text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>
                      <p className="font-medium">Permissions</p>
                      <p className="text-xs">
                        {createdApiKey &&
                        typeof createdApiKey.permissions === "object"
                          ? Object.entries(createdApiKey.permissions)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(", ")
                          : "No permissions"}
                      </p>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 pt-6">
                  <Button
                    onClick={() => copyToClipboard(createdApiKey?.key || "")}
                    className="w-full"
                    variant="outline"
                  >
                    Copy API Key
                  </Button>
                  <Button onClick={handleCreateNewKey} className="w-full">
                    Create Another Key
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}