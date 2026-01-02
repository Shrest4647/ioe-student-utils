import Image from "next/image";
import landingImage from "@/assets/images/pulchowk-landing-image.jpg";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="px-4 py-20 text-center">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 font-bold text-4xl md:text-6xl" id="hero-heading">
          Bridging the Gap Between IOE and Global Standards
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl md:text-2xl">
          The ultimate open-source toolkit for Institute of Engineering students
          to navigate their academic journey and transition to international
          education.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            aria-label="Get started with IOE Student Utils"
            className="px-8 text-lg"
            size="lg"
          >
            Get Started
          </Button>
          <Button
            aria-label="View project on GitHub"
            className="px-8 text-lg"
            size="lg"
            variant="outline"
          >
            View on GitHub
          </Button>
        </div>

        {/* Hero Image */}
        <div className="mt-12 mb-8">
          <Image
            src={landingImage.src}
            alt="Landing image showcasing IOE Student Utils features"
            height={400}
            className="mx-auto h-auto max-w-full rounded-lg shadow-lg"
            priority
            width={800}
          />
        </div>
      </div>
    </section>
  );
}
