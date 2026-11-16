"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Key,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/eden";

interface McpApp {
  id: string;
  name: string;
  clientId: string;
  redirectUrls: string;
  type: string;
  disabled: boolean | null;
  userId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function McpAppsDashboardPage() {
  const queryClient = useQueryClient();

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [appName, setAppName] = useState("Google Gemini");
  const [redirectUrls, setRedirectUrls] = useState("");

  // Post-creation one-time secret modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    clientId: string;
    clientSecret: string;
    redirectUrls: string;
  } | null>(null);

  // Confirmation dialogs
  const [deleteTarget, setDeleteTarget] = useState<McpApp | null>(null);
  const [regenerateTarget, setRegenerateTarget] = useState<McpApp | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Queries
  const { data: serverInfo } = useQuery({
    queryKey: ["mcp-server-info"],
    queryFn: async () => {
      const { data } = await apiClient.api["mcp-apps"].info.get();
      return (
        data?.data || {
          serverUrl: `${window.location.origin}/api/mcp/mcp`,
        }
      );
    },
  });

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["mcp-apps"],
    queryFn: async () => {
      const { data, error } = await apiClient.api["mcp-apps"].get();
      if (error) {
        throw error;
      }
      return (data?.data || []) as McpApp[];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!appName.trim()) throw new Error("Application name is required");
      if (!redirectUrls.trim()) throw new Error("Redirect URI is required");

      const res = await apiClient.api["mcp-apps"].post({
        name: appName.trim(),
        redirectUrls: redirectUrls.trim(),
      });

      if (res.error || !res.data?.success) {
        throw new Error(
          (res.error as any)?.value?.message || "Failed to create MCP app",
        );
      }

      return res.data.data;
    },
    onSuccess: (data: any) => {
      setIsCreateOpen(false);
      setAppName("Google Gemini");
      setRedirectUrls("");
      setCreatedCredentials(data);
      queryClient.invalidateQueries({ queryKey: ["mcp-apps"] });
      toast.success("OAuth credentials generated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to register application");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.api["mcp-apps"]({ id }).delete();
      if (res.error) throw new Error("Failed to delete application");
      return res.data;
    },
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["mcp-apps"] });
      toast.success("Application and access tokens deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete application");
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await (apiClient.api["mcp-apps"]({ id }) as any)[
        "regenerate-secret"
      ].post();
      if (res.error) throw new Error("Failed to regenerate secret");
      return res.data;
    },
    onSuccess: (data: any) => {
      const targetApp = regenerateTarget;
      setRegenerateTarget(null);
      if (targetApp && data?.data) {
        setCreatedCredentials({
          name: targetApp.name,
          clientId: data.data.clientId,
          clientSecret: data.data.clientSecret,
          redirectUrls: targetApp.redirectUrls,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["mcp-apps"] });
      toast.success("New client secret generated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to regenerate secret");
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const serverUrl =
    serverInfo?.serverUrl ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/api/mcp/mcp`
      : "/api/mcp/mcp");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-3xl tracking-tight">
              Connected AI Apps (MCP)
            </h1>
            <Badge variant="secondary" className="gap-1 font-mono text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              OAuth 2.0
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage authorized OAuth 2.0 applications (Google Gemini, Claude,
            Cursor) connecting to your Model Context Protocol server.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild className="text-xs sm:text-sm">
            <Link href="/dashboard/api-keys">
              <Key className="mr-2 h-4 w-4" />
              Manage API Keys
            </Link>
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Connect New App
          </Button>
        </div>
      </div>

      {/* Server Endpoint Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="font-semibold text-base">
                Your Public MCP Server URL
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              RFC 9728 & RFC 8414
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Provide this URL to external AI assistants (Gemini, Claude, Cursor)
            when connecting to this MCP server.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md border bg-background p-2 font-mono text-sm">
            <span className="flex-1 select-all truncate">{serverUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(serverUrl, "Server URL")}
              className="h-8 gap-1.5 px-3"
            >
              {copiedKey === "Server URL" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How to Connect Gemini Guide Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="gemini-guide"
          className="rounded-lg border bg-card"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Bot className="h-4 w-4 text-blue-500" />
              <span>Step-by-step: How to connect Google Gemini with OAuth</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-1 pb-4 text-muted-foreground text-sm">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                In the Gemini app, click{" "}
                <strong>
                  Settings → Connected Apps → Connect an MCP server
                </strong>
                .
              </li>
              <li>
                Paste your MCP Server URL:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-foreground text-xs">
                  {serverUrl}
                </code>
              </li>
              <li>
                Expand <strong>Additional settings</strong> and click the{" "}
                <strong>Copy redirect URI</strong> button.
              </li>
              <li>
                Click the <strong>Connect New App</strong> button above, enter a
                name (e.g., <em>Google Gemini</em>), and paste Gemini's copied
                redirect URI.
              </li>
              <li>
                Copy the generated <strong>Client ID</strong> and{" "}
                <strong>Client Secret</strong> into Gemini's dialog and click{" "}
                <strong>Next</strong>.
              </li>
              <li>
                A secure login popup will prompt you to approve access. Once
                approved, Gemini connects automatically!
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Apps Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registered Applications</CardTitle>
          <CardDescription>
            Applications authorized to request MCP tool tokens on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold text-base">
                No Connected Apps Yet
              </h3>
              <p className="mt-1 max-w-sm text-muted-foreground text-sm">
                Register an app to connect Google Gemini or other AI assistants
                using standard, secure OAuth 2.0 credentials.
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                Connect Gemini or AI App
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Authorized Redirect URI
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Created
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span>{app.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="max-w-[120px] truncate sm:max-w-[200px]">
                          {app.clientId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            copyToClipboard(
                              app.clientId,
                              `Client ID for ${app.name}`,
                            )
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[250px] truncate font-mono text-muted-foreground text-xs md:table-cell">
                      {app.redirectUrls}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground text-xs sm:table-cell">
                      {formatDistanceToNow(new Date(app.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={app.disabled ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {app.disabled ? "Disabled" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRegenerateTarget(app)}
                          title="Regenerate Secret"
                          className="h-8 px-2 text-xs"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden lg:inline">
                            New Secret
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(app)}
                          title="Revoke Application"
                          className="h-8 px-2 text-destructive text-xs hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="ml-1 hidden lg:inline">Revoke</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Connect New App Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Connect AI Assistant (MCP OAuth)
            </DialogTitle>
            <DialogDescription>
              Register an OAuth 2.0 client for Google Gemini, Claude, or Cursor
              to generate secure Client ID and Secret credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Quick preset buttons */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">
                Popular Presets
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={appName === "Google Gemini" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAppName("Google Gemini")}
                >
                  Google Gemini
                </Button>
                <Button
                  type="button"
                  variant={appName === "Claude" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAppName("Claude")}
                >
                  Claude
                </Button>
                <Button
                  type="button"
                  variant={appName === "Cursor" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAppName("Cursor")}
                >
                  Cursor
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Google Gemini"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="redirect-uri">
                Authorized Redirect URI{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="redirect-uri"
                value={redirectUrls}
                onChange={(e) => setRedirectUrls(e.target.value)}
                placeholder="https://oauth-redirect.googleusercontent.com/r/..."
              />
              <p className="text-muted-foreground text-xs">
                In Gemini's dialog, click <strong>Copy redirect URI</strong> and
                paste it here.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !appName || !redirectUrls}
            >
              {createMutation.isPending
                ? "Generating..."
                : "Generate Credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-Creation One-Time Credentials Modal */}
      <Dialog
        open={!!createdCredentials}
        onOpenChange={(open) => {
          if (!open) setCreatedCredentials(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto rounded-full bg-emerald-500/10 p-3 text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg">
              OAuth Credentials Generated!
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Copy these credentials into your AI client (e.g. Gemini). The
              Client Secret is displayed only once and cannot be retrieved
              later.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-xs">
                    <strong>Important:</strong> Copy your Client Secret now. For
                    security reasons, it will never be displayed again.
                  </p>
                </div>
              </div>

              {/* MCP Server URL */}
              <div className="space-y-1">
                <Label className="text-xs">1. MCP Server URL</Label>
                <div className="flex items-center gap-2 rounded border bg-muted/40 p-2 font-mono text-xs">
                  <span className="flex-1 select-all truncate">
                    {serverUrl}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => copyToClipboard(serverUrl, "Server URL")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Client ID */}
              <div className="space-y-1">
                <Label className="text-xs">2. Client ID</Label>
                <div className="flex items-center gap-2 rounded border bg-muted/40 p-2 font-mono text-xs">
                  <span className="flex-1 select-all truncate">
                    {createdCredentials.clientId}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() =>
                      copyToClipboard(createdCredentials.clientId, "Client ID")
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Client Secret */}
              <div className="space-y-1">
                <Label className="text-xs">3. Client Secret</Label>
                <div className="flex items-center gap-2 rounded border bg-muted/40 p-2 font-mono text-xs">
                  <span className="flex-1 select-all truncate font-semibold text-emerald-600 dark:text-emerald-400">
                    {createdCredentials.clientSecret}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() =>
                      copyToClipboard(
                        createdCredentials.clientSecret,
                        "Client Secret",
                      )
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setCreatedCredentials(null)}
              className="w-full sm:w-auto"
            >
              I Have Saved My Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this application?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke{" "}
              <strong>{deleteTarget?.name}</strong>? Any active connections
              (such as Gemini) will immediately lose access to this MCP server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? "Revoking..." : "Yes, Revoke App"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation Alert */}
      <AlertDialog
        open={!!regenerateTarget}
        onOpenChange={(open) => {
          if (!open) setRegenerateTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Client Secret?</AlertDialogTitle>
            <AlertDialogDescription>
              Generating a new secret for{" "}
              <strong>{regenerateTarget?.name}</strong> will invalidate the
              previous secret. You will need to update the secret in Gemini or
              your AI client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                regenerateTarget &&
                regenerateMutation.mutate(regenerateTarget.id)
              }
            >
              {regenerateMutation.isPending
                ? "Generating..."
                : "Generate New Secret"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
