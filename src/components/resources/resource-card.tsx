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
  const FormatIcon = formatIcons[resource.fileFormat.toLowerCase()] || FileText;
  const ContentIcon = contentTypeIcons[resource.contentType.name] || BookOpen;
  const bgColor = contentTypeColors[resource.contentType.name] || "bg-gray-500";

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
      <Card className="flex h-full flex-col overflow-hidden border-none shadow-md transition-shadow hover:shadow-xl">
        {/* Top Visual Section */}
        <div
          className={`relative h-40 ${bgColor} flex items-center justify-center`}
        >
          <div className="rounded-lg bg-white/20 p-4 backdrop-blur-sm">
            <ContentIcon className="h-12 w-12 text-white" />
          </div>
          <Badge className="absolute top-4 right-4 bg-white/90 text-black hover:bg-white">
            {resource.contentType.name}
          </Badge>
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="mb-2 flex flex-wrap gap-1">
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
          <h3 className="line-clamp-2 font-bold text-lg leading-tight">
            {resource.title}
          </h3>
        </CardHeader>

        <CardContent className="flex-grow p-4 pt-0">
          <p className="line-clamp-3 text-muted-foreground text-sm">
            {resource.description || "No description provided."}
          </p>
        </CardContent>

        <CardFooter className="mt-auto flex items-center justify-between border-t p-4 pt-0">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
            <FormatIcon className="h-3.5 w-3.5" />
            <span>{resource.fileFormat.toUpperCase()}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            asChild
          >
            <a
              href={resource.s3Url}
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
