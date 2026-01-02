import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL, GITHUB_REPO_URL } from "@/data";

export function CTA() {
  return (
    <section aria-labelledby="cta-heading" className="bg-muted px-4 py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="mb-4 font-bold text-3xl" id="cta-heading">
          Ready to take the next step?
        </h2>
        <p className="mb-8 text-muted-foreground text-xl">
          Join our growing community of students and contributors.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            aria-label="Join the IOE Student Utils community"
            className="px-8 text-lg"
            size="lg"
          >
            <Link href={DISCORD_INVITE_URL} target="_blank">
              Join Community
            </Link>
          </Button>
          <Button
            aria-label="Contribute to the project on GitHub"
            className="px-8 text-lg"
            size="lg"
            variant="outline"
          >
            <Link href={GITHUB_REPO_URL} target="_blank">
              Contribute on GitHub
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
