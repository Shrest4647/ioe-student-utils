"use client";

import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ResumePDF } from "@/components/resume-builder/pdf/resume-pdf";
import { Button } from "@/components/ui/button";

interface PDFDownloadButtonProps {
  resumeData?: any;
  resumeName?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  template?: string;
}

export function PDFDownloadButton({
  resumeData,
  resumeName = "resume",
  disabled = false,
  variant = "default",
  size = "default",
  template = "classic",
}: PDFDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!resumeData) {
      toast.error("No resume data available to generate PDF");
      return;
    }

    setIsLoading(true);
    try {
      // Generate filename with date
      const date = new Date().toISOString().split("T")[0];
      const filename = `${resumeName}-${date}.pdf`;

      // Create PDF document
      const doc = <ResumePDF data={resumeData} template={template} />;

      // Generate PDF blob
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasRequiredData = resumeData?.profile;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || isLoading || !hasRequiredData}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}

// Alternative button with icon only
export function PDFDownloadIconButton({
  resumeData,
  resumeName = "resume",
  disabled = false,
}: Omit<PDFDownloadButtonProps, "variant" | "size">) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!resumeData) {
      toast.error("No resume data available");
      return;
    }

    setIsLoading(true);
    try {
      const date = new Date().toISOString().split("T")[0];
      const filename = `${resumeName}-${date}.pdf`;

      const doc = <ResumePDF data={resumeData} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleDownload}
      disabled={disabled || isLoading || !resumeData?.profile}
      title="Download PDF"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
}
