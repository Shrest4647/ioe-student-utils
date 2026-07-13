"use client";

import { WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineNotice() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <Alert className="mt-6">
      <WifiOff className="size-4" />
      <AlertTitle>You are offline</AlertTitle>
      <AlertDescription>
        You can review what is already on screen, but previews and task changes
        will not be saved until your connection returns.
      </AlertDescription>
    </Alert>
  );
}
