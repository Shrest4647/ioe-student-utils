"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { useState } from "react";
import { PDFDownloadButton } from "@/components/resume-builder/shared/pdf-download-button";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResumePDF } from "../pdf/resume-pdf";

interface ResumePreviewProps {
  resumeData?: ResumeData;
  resumeName?: string;
}

type TemplateType =
  | "classic"
  | "ats"
  | "professional"
  | "minimalist"
  | "simple-clean"
  | "minimalist-modern"
  | "clean-minimalist-business"
  | "simple-infographic"
  | "ats-grid";

export function ResumePreview({ resumeData, resumeName }: ResumePreviewProps) {
  const [template, setTemplate] = useState<TemplateType>("classic");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-lg">Live Preview</h3>
        <div className="flex items-center gap-2">
          <PDFDownloadButton
            resumeData={resumeData}
            resumeName={resumeName || "resume"}
            size="sm"
            template={template}
          />
        </div>
      </div>

      {/* Toolbar */}
      <Card className="flex flex-wrap items-center gap-4 bg-muted/50 p-2">
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <span className="font-medium text-sm">Template:</span>
          <Select
            value={template}
            onValueChange={(v) => setTemplate(v as TemplateType)}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Classic (Modern)</SelectItem>
              <SelectItem value="ats">ATS Standard</SelectItem>
              <SelectItem value="professional">Professional (Clean)</SelectItem>
              <SelectItem value="minimalist">
                Minimalist (Two Column)
              </SelectItem>
              <SelectItem value="simple-clean">Simple Clean (Gray)</SelectItem>
              <SelectItem value="minimalist-modern">
                Minimalist Modern (Poppins)
              </SelectItem>
              <SelectItem value="clean-minimalist-business">
                Business Clean (Open Sans)
              </SelectItem>
              <SelectItem value="simple-infographic">
                Simple Infographic (Poppins)
              </SelectItem>
              <SelectItem value="ats-grid">ATS Grid (Structured)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* A4 Preview Container Wrapper */}
      {resumeData && (
        <div className="relative flex w-full justify-center overflow-hidden rounded border bg-muted/30 p-0.5">
          <div className="aspect-[1/1.5] h-full w-full">
            <PDFViewer className="h-full w-full">
              <ResumePDF data={resumeData} template={template} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  );
}
