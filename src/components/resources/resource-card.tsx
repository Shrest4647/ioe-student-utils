"use client";

import { motion } from "framer-motion";
import {
  Book,
  BookOpen,
  ExternalLink,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileText,
  Layout,
  Paperclip,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

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
  fileFormat: string;
  contentType: {
    id: string;
    name: string;
  };
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
  uploader: {
    id: string;
    name: string;
  };
  createdAt: string;
  isFeatured: boolean;
  attachments?: ResourceAttachment[];
};

interface ResourceCardProps {
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
  Book: Book,
  Guide: BookOpen,
  Template: Layout,
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const ContentIcon = contentTypeIcons[resource.contentType.name] || BookOpen;
  const bgColor = contentTypeColors[resource.contentType.name] || "bg-gray-500";

  // Get the primary attachment for the card display
  const primaryAttachment = resource.attachments?.[0];
  const fileFormat = primaryAttachment?.fileFormat || resource.fileFormat;
  const primaryUrl = primaryAttachment?.url || resource.s3Url;
  const FormatIcon = formatIcons[fileFormat?.toLowerCase()] || FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="flex h-full flex-col overflow-hidden border-none p-0 shadow-md transition-shadow hover:shadow-xl">
        {/* Top Visual Section */}
        <div
          className={`relative h-24 ${bgColor} flex items-center justify-center pt-2`}
        >
          <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
            <ContentIcon className="h-8 w-8 text-white" />
          </div>
          <Badge className="absolute top-3 right-2 bg-white/90 text-[10px] text-black hover:bg-white">
            {resource.contentType.name}
          </Badge>
        </div>

        <CardHeader className="p-2 pb-0">
          <div className="mb-1 flex flex-wrap gap-1">
            {resource.categories.slice(0, 2).map((c) => (
              <Badge
                key={c.category.id}
                variant="secondary"
                className="px-1.5 py-0 text-[10px]"
              >
                {c.category.name}
              </Badge>
            ))}
            {resource.categories.length > 2 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                +{resource.categories.length - 2}
              </Badge>
            )}
          </div>
          <h3 className="line-clamp-2 font-semibold text-sm leading-tight">
            {resource.title}
          </h3>
        </CardHeader>

        <CardContent className="grow p-2 pt-0">
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {resource.description || "No description provided."}
          </p>
          {/* Show attachment count if multiple */}
          {resource.attachments && resource.attachments.length > 1 && (
            <div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
              <Paperclip className="h-3 w-3" />
              <span>{resource.attachments.length} attachments</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="mt-auto flex items-center justify-between border-t p-2 pt-0">
          <div className="flex items-center gap-1.5 font-medium text-[10px] text-muted-foreground">
            <FormatIcon className="h-3 w-3" />
            <span>{fileFormat?.toUpperCase() || "FILE"}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 font-semibold text-[10px] text-primary hover:bg-primary hover:text-primary-foreground"
            asChild
          >
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5"
            >
              <span>Access</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
