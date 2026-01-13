"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Layout,
  Paperclip,
  Share2,
  Tag,
  User,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Resource, ResourceAttachment } from "./resource-card";

interface ResourceDetailProps {
  resource: Resource;
}

const formatIcons: Record<string, any> = {
  pdf: FileText,
  docx: FileText,
  doc: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  md: FileCode,
  json: FileJson,
  pptx: Layout,
  ppt: Layout,
};

const contentTypeColors: Record<string, string> = {
  Tool: "bg-orange-500",
  Ebook: "bg-blue-500",
  Book: "bg-green-500",
  Guide: "bg-teal-500",
  Template: "bg-purple-500",
};

const contentTypeIcons: Record<string, any> = {
  Tool: Wrench,
  Ebook: BookOpen,
  Book: BookOpen,
  Guide: BookOpen,
  Template: Layout,
};

function AttachmentItem({ attachment }: { attachment: ResourceAttachment }) {
  const FormatIcon =
    formatIcons[attachment.fileFormat?.toLowerCase() || ""] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted p-2">
          <FormatIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-sm">{attachment.name}</p>
          <p className="text-muted-foreground text-xs">
            {attachment.fileFormat?.toUpperCase() || "FILE"} • {attachment.type}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        asChild
        className="gap-1"
        aria-label={`Access ${attachment.name}`}
      >
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          {attachment.type === "file" ? (
            <Download className="h-3 w-3" />
          ) : (
            <ExternalLink className="h-3 w-3" />
          )}
          Access
        </a>
      </Button>
    </motion.div>
  );
}

export function ResourceDetail({ resource }: ResourceDetailProps) {
  const ContentIcon = contentTypeIcons[resource.contentType.name] || BookOpen;
  const bgColor = contentTypeColors[resource.contentType.name] || "bg-gray-500";
  const primaryAttachment = resource.attachments?.[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.description || "",
          url: window.location.href,
        });
      } catch (_err) {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`${bgColor} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="container relative mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-white hover:bg-white/20"
            >
              <Link href="/resources" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Resources
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-8 lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                  <ContentIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge className="bg-white/90 text-black hover:bg-white">
                      {resource.contentType.name}
                    </Badge>
                    {resource.isFeatured && (
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h1 className="mb-4 font-bold text-2xl text-white md:text-3xl">
                    {resource.title}
                  </h1>
                  <p className="text-sm text-white/90 leading-relaxed md:text-base">
                    {resource.description ||
                      "No description provided for this resource."}
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:text-right"
            >
              <div className="flex gap-2 lg:justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShare}
                  className="gap-1 bg-white/10 text-white hover:bg-white/20"
                  aria-label="Share this resource"
                >
                  <Share2 className="h-3 w-3" />
                  Share
                </Button>
                {primaryAttachment && (
                  <Button
                    size="sm"
                    asChild
                    className="gap-1 bg-white text-gray-900 hover:bg-gray-100"
                    aria-label={`${primaryAttachment.type === "file" ? "Download" : "Access"} ${primaryAttachment.name}`}
                  >
                    <a
                      href={primaryAttachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      {primaryAttachment.type === "file" ? (
                        <Download className="h-3 w-3" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      {primaryAttachment.type === "file"
                        ? "Download"
                        : "Access"}
                    </a>
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Main Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Attachments */}
            {resource.attachments && resource.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Attachments ({resource.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resource.attachments.map((attachment, _index) => (
                    <AttachmentItem
                      key={attachment.id}
                      attachment={attachment}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {resource.categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {resource.categories.map((category) => (
                      <Badge key={category.id} variant="secondary">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {resource.s3Url && !resource.attachments?.length && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview/Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full gap-2">
                    <a
                      href={resource.s3Url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Resource
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Resource Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resource Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Uploaded by</p>
                    <p className="font-medium text-sm">
                      {resource.uploader.name}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Created on</p>
                    <p className="font-medium text-sm">
                      {formatDate(resource.createdAt)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Content Type
                    </p>
                    <p className="font-medium text-sm">
                      {resource.contentType.name}
                    </p>
                  </div>
                </div>

                {resource.fileFormat && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground text-xs">
                          File Format
                        </p>
                        <p className="font-medium text-sm">
                          {resource.fileFormat.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <Link href="/resources">
                    <ArrowLeft className="h-4 w-4" />
                    Browse More Resources
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  Share Resource
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton component
ResourceDetail.Skeleton = function ResourceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="bg-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>
            </div>
            <div className="lg:text-right">
              <div className="flex gap-2 lg:justify-end">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
