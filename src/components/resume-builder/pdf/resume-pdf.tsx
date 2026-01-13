"use client";

import { Document } from "@react-pdf/renderer";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";
import { AtsGridTemplate } from "../templates/ats-grid-template";
import { AtsTemplate } from "../templates/ats-template";
import { ClassicTemplate } from "../templates/classic-template";
import { CleanMinimalistBusinessTemplate } from "../templates/clean-minimalist-business-template";
import { MinimalistModernTemplate } from "../templates/minimalist-modern-template";
import { MinimalistTemplate } from "../templates/minimalist-template";
import { ProfessionalTemplate } from "../templates/professional-template";
import { SimpleCleanTemplate } from "../templates/simple-clean-template";
import { SimpleInfographicTemplate } from "../templates/simple-infographic-template";

interface ResumePDFProps {
  data: ResumeData;
  template?: string;
}

export function ResumePDF({ data, template = "classic" }: ResumePDFProps) {
  const renderTemplate = () => {
    switch (template) {
      case "classic":
        return <ClassicTemplate resumeData={data} />;
      case "ats":
        return <AtsTemplate resumeData={data} />;
      case "professional":
        return <ProfessionalTemplate resumeData={data} />;
      case "simple-infographic":
        return <SimpleInfographicTemplate resumeData={data} />;
      case "minimalist":
        return <MinimalistTemplate resumeData={data} />;
      case "simple-clean":
        return <SimpleCleanTemplate resumeData={data} />;
      case "minimalist-modern":
        return <MinimalistModernTemplate resumeData={data} />;
      case "clean-minimalist-business":
        return <CleanMinimalistBusinessTemplate resumeData={data} />;
      case "ats-grid":
        return <AtsGridTemplate resumeData={data} />;

      default:
        return <ClassicTemplate resumeData={data} />;
    }
  };

  return <Document>{renderTemplate()}</Document>;
}
