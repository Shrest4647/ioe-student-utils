import { GPAConverterHero } from "@/components/gpa-converter/gpa-converter-hero";
import { GPAConverter } from "@/components/gpa-converter/gpa-converter";

export default function GPAConverterPage() {
  return (
    <div className="min-h-screen bg-background">
      <GPAConverterHero />
      <main className="container mx-auto px-4 py-8">
        <GPAConverter />
      </main>
    </div>
  );
}
