"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, Eye, EyeOff, Key, Shield } from "lucide-react";
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
import { toast } from "sonner";

// Import authClient to check available methods
const authClient: any = require('@/lib/auth-client').authClient;

if (!authClient || !authClient.apiKey) {
  throw new Error("apiKey plugin not found in auth client");
}

const PERMISSION_OPTIONS = [
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

export default function NewApiKeyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expiresIn, setExpiresIn] = useState(30);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["read"]);
  const [metadata, setMetadata] = useState("{}");
  const [isCreating, setIsCreating] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<any>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const createApiKeyMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) {
        throw new Error("API key name is required");
      }

      setIsCreating(true);
      try {
        const result = await authClient.apiKey.create({
          name: name.trim(),
          expiresIn: expiresIn * 24 * 60 * 60, // Convert days to seconds
          permissions: selectedPermissions.reduce((acc, permission) => {
            acc[permission] = true;
            return acc;
          }, {} as Record<string, string[]>),
          metadata: metadata ? JSON.parse(metadata) : undefined,
        });

        if (result.error) {
          toast.error(`Failed to create API key: ${result.error.message}`);
          throw result.error;
        }

        setCreatedApiKey(result.data);
        setShowApiKey(true);
        toast.success("API key created successfully!");
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
    } catch (error) {
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
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/api-keys" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to API Keys
        </Link>

        <h1 className="text-3xl font-bold">Create New API Key</h1>
        <p className="text-muted-foreground mb-8">
          Generate a new API key for programmatic access to your data. Keys are shown only once during creation.
        </p>
      </div>

      {!createdApiKey ? (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create API Key</CardTitle>
            <CardDescription>
              Configure your new API key with custom permissions and expiration time.
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
                  {EXPIRATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <p className="text-sm text-muted-foreground mb-4">
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
                      <div key={resource} className="flex items-center space-x-2">
                        <Checkbox
                          id={resource}
                          checked={selectedPermissions.includes(resource)}
                          onCheckedChange={(checked) => handlePermissionChange(resource, checked)}
                          disabled={isCreating}
                        />
                        <Label htmlFor={resource} className="text-sm font-normal">
                          {label}
                        </Label>
                      </div>
                    );
                  })}
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-6 w-6 text-green-600" />
              API Key Created Successfully!
            </CardTitle>
            <CardDescription>
              Copy this key now and save it securely. It won&apos;t be shown again.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 border-2 border-dashed rounded-lg p-8">
                <div className="text-center space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Expires in {expiresIn} days</p>
                      <p className="text-xs">Created {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">
                      <p className="font-medium">Permissions</p>
                      <p className="text-xs">
                        {createdApiKey && typeof createdApiKey.permissions === 'object' 
                          ? Object.entries(createdApiKey.permissions).map(([key, value]) => `${key}: ${value}`).join(", ")
                          : "No permissions"
                        }
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
                  <Button
                    onClick={handleCreateNewKey}
                    className="w-full"
                  >
                    Create Another Key
                  </Button>
                </div>
              </div>
                    <code className="bg-muted px-4 py-3 rounded text-sm font-mono break-all">
                      {createdApiKey?.key || "API Key"}
                    </code>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Expires in {expiresIn} days</p>
                      <p className="text-xs">Created {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>
                      <p className="font-medium">Permissions</p>
                      <p className="text-xs">
                        {createdApiKey && typeof createdApiKey.permissions === 'object' 
                          ? Object.entries(createdApiKey.permissions).map(([key, value]) => `${key}: ${value}`).join(", ")
                          : "No permissions"
                        }
                      </p>
                    </div>
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
                  <Button
                    onClick={handleCreateNewKey}
                    className="w-full"
                  >
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