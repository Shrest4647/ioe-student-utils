"use client";

import { ArrowLeft, FileX, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResourceNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileX className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Resource Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The resource you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button asChild className="flex-1">
              <Link href="/resources" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Browse Resources
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/resources" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Resources
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
