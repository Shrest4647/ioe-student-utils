"use client";

import type { ResumeData } from "@/components/resume-builder/shared/resume-types";
import { AtsGridPdf } from "./templates/ats-grid-pdf";
import { AtsPdf } from "./templates/ats-pdf";
import { ClassicPdf } from "./templates/classic-pdf";
import { CleanMinimalistBusinessPdf } from "./templates/clean-minimalist-business-pdf";
import { MinimalistModernPdf } from "./templates/minimalist-modern-pdf";
import { MinimalistPdf } from "./templates/minimalist-pdf";
import { ProfessionalPdf } from "./templates/professional-pdf";
import { SimpleCleanPdf } from "./templates/simple-clean-pdf";
import { SimpleInfographicPdf } from "./templates/simple-infographic-pdf";

interface ResumePDFProps {
  data: ResumeData;
  template?: string;
}

export function ResumePDF({ data, template = "classic" }: ResumePDFProps) {
  switch (template) {
    case "classic":
      return <ClassicPdf data={data} />;
    case "ats":
      return <AtsPdf data={data} />;
    case "professional":
      return <ProfessionalPdf data={data} />;
    case "simple-infographic":
      return <SimpleInfographicPdf data={data} />;
    case "minimalist":
      return <MinimalistPdf data={data} />;
    case "simple-clean":
      return <SimpleCleanPdf data={data} />;
    case "minimalist-modern":
      return <MinimalistModernPdf data={data} />;
    case "clean-minimalist-business":
      return <CleanMinimalistBusinessPdf data={data} />;
    case "ats-grid":
      return <AtsGridPdf data={data} />;

    default:
      return <ClassicPdf data={data} />;
  }
}
