"use client";

import {
  BookOpen,
  ExternalLink,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Layout,
  Link2,
  Paperclip,
  Star,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ResourceAttachment {
  id: string;
  type: "file" | "url";
  url: string;
  name: string;
  fileFormat: string | null;
  createdAt: string;
}

export type Resource = {
  id: string;
  title: string;
  description: string | null;
  s3Url: string;
  fileFormat?: string;
  contentType: { id: string; name: string } | null;
  categories: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string | Date | null;
    updatedAt: string | Date | null;
  }[];
  uploader: { id: string; name: string } | null;
  createdAt: string;
  isFeatured: boolean;
  attachments?: ResourceAttachment[];
};

interface ResourceCardProps {
  resource: Resource;
}

const formatIcons = {
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

export function ResourceCard({ resource }: ResourceCardProps) {
  const primaryAttachment = resource.attachments?.[0];
  const fileFormat = primaryAttachment?.fileFormat || resource.fileFormat;
  const primaryUrl = primaryAttachment?.url || resource.s3Url;
  const FormatIcon =
    fileFormat && fileFormat.toLowerCase() in formatIcons
      ? formatIcons[fileFormat.toLowerCase() as keyof typeof formatIcons]
      : primaryAttachment?.type === "url"
        ? Link2
        : FileText;
  const TypeIcon = resource.contentType?.name === "Tool" ? Wrench : BookOpen;

  return (
    <article className="group relative grid gap-3 rounded-xl border bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-primary/35 hover:shadow-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary sm:size-11">
        <TypeIcon className="size-5" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={`/resources/${resource.id}`}
            className="min-w-0 font-semibold text-sm leading-5 underline-offset-4 hover:underline group-hover:text-primary sm:text-base"
          >
            {resource.title}
          </Link>
          {resource.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-[0.6875rem] text-primary">
              <Star className="size-3" aria-hidden="true" />
              Featured
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 max-w-3xl text-muted-foreground text-xs leading-5 sm:text-sm">
          {resource.description ||
            "Open this resource to view its details and materials."}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
          <span className="inline-flex items-center gap-1">
            <FormatIcon className="size-3.5" aria-hidden="true" />
            {fileFormat?.toUpperCase() ||
              resource.contentType?.name ||
              "Resource"}
          </span>
          {resource.attachments && resource.attachments.length > 1 && (
            <span className="inline-flex items-center gap-1">
              <Paperclip className="size-3.5" aria-hidden="true" />
              {resource.attachments.length} files
            </span>
          )}
          {resource.categories.slice(0, 2).map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="h-5 px-1.5 font-normal text-[0.6875rem]"
            >
              {category.name}
            </Badge>
          ))}
          {resource.categories.length > 2 && (
            <span>+{resource.categories.length - 2} topics</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:justify-end">
        <Button variant="outline" size="lg" asChild>
          <Link href={`/resources/${resource.id}`}>View details</Link>
        </Button>
        {primaryUrl && (
          <Button size="icon-lg" asChild>
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${resource.title} in a new tab`}
              title="Open resource"
            >
              <ExternalLink />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}
