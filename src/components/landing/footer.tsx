import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <nav aria-labelledby="project-nav">
            <h3 className="mb-4 font-semibold" id="project-nav">
              Project
            </h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-foreground" href="/#mission">
                  Mission
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/#features">
                  Features
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="resources-nav">
            <h3 className="mb-4 font-semibold" id="resources-nav">
              Resources
            </h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link className="hover:text-foreground" href="/docs">
                  Documentation
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-labelledby="social-nav">
            <h3 className="mb-4 font-semibold" id="social-nav">
              Social
            </h3>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <Link
                  aria-label="Visit GitHub repository"
                  className="hover:text-foreground"
                  href="https://github.com/Shrest4647/ioe-student-utils"
                >
                  GitHub
                </Link>
              </li>
              <li>
                <Link
                  aria-label="Join Discord community"
                  className="hover:text-foreground"
                  href="https://discord.gg/XGMwzVv9"
                >
                  Discord
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <Separator className="mb-4" />
        <p className="text-center text-muted-foreground text-sm">
          © 2026 IOE Student Utils. MIT Licensed.
        </p>
      </div>
    </footer>
  );
}
