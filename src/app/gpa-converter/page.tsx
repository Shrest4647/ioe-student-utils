import { GPAConverter } from "@/components/gpa-converter/gpa-converter";
import { GPAConverterGuide } from "@/components/gpa-converter/gpa-converter-guide";
import { GPAConverterHero } from "@/components/gpa-converter/gpa-converter-hero";

export default function GPAConverterPage() {
  return (
    <div className="min-h-screen bg-background">
      <GPAConverterHero />
      <main className="container mx-auto space-y-8 px-4 py-8">
        <GPAConverter />
        <section>
          <GPAConverterGuide />
        </section>
      </main>
    </div>
  );
}
