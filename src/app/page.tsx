import { CTA } from "@/components/landing/cta";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Objective } from "@/components/landing/objective";

export default function Page() {
  return (
    <main className="pt-16">
      <Hero />
      <Objective />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
