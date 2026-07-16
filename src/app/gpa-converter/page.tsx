import type { Metadata } from "next";
import { GPAConverter } from "@/components/gpa-converter/gpa-converter";
import { GPAConverterGuide } from "@/components/gpa-converter/gpa-converter-guide";
import { GPAConverterHero } from "@/components/gpa-converter/gpa-converter-hero";

export const metadata: Metadata = {
  title: "TU Grade Converter for International Applications",
  description:
    "Estimate how a Tribhuvan University percentage, GPA, or CGPA may be understood by universities across North America, Europe, and Asia Pacific.",
  alternates: { canonical: "/gpa-converter" },
};

export default function GPAConverterPage() {
  return (
    <div className="min-h-screen bg-background">
      <GPAConverterHero />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <GPAConverter />
        <GPAConverterGuide />
      </main>
    </div>
  );
}
