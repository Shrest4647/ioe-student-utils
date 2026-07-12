import { ArrowUpRight, CheckCircle2, FileSearch, Scale } from "lucide-react";

const checks = [
  {
    icon: FileSearch,
    title: "Read the exact requirement",
    body: "Look for a Nepal or Tribhuvan University entry table before converting anything.",
  },
  {
    icon: Scale,
    title: "Keep the awarded scale",
    body: "Submit the percentage, division, or GPA exactly as TU printed it unless the form says otherwise.",
  },
  {
    icon: CheckCircle2,
    title: "Use an evaluator only when asked",
    body: "If the institution names WES, uni-assist, or another service, follow that service’s document process.",
  },
];

export function GPAConverterGuide() {
  return (
    <section className="rounded-xl border bg-muted/35 px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.18em]">
            Before you submit
          </p>
          <h2 className="mt-3 max-w-sm font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
            The original transcript is the source of truth.
          </h2>
          <p className="mt-5 max-w-sm text-muted-foreground text-sm leading-6">
            This tool is for deciding where to apply and checking rough
            eligibility. It does not certify credentials or change what TU
            awarded.
          </p>
        </div>

        <div className="divide-y border-y">
          {checks.map((check, index) => {
            const Icon = check.icon;
            return (
              <div
                key={check.title}
                className="grid gap-4 py-6 sm:grid-cols-[2.5rem_1fr] sm:py-7"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-background">
                  <Icon className="size-4" />
                </span>
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[0.65rem] text-muted-foreground">
                      0{index + 1}
                    </span>
                    <h3 className="font-medium text-base">{check.title}</h3>
                  </div>
                  <p className="mt-2 max-w-xl text-muted-foreground text-sm leading-6">
                    {check.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-14 flex flex-col justify-between gap-5 border-foreground/15 border-t pt-6 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-muted-foreground text-xs leading-5">
          Research reviewed July 2026. Admission rules change; the linked
          institutional source beside each result is the current authority.
        </p>
        <a
          href="https://www.wes.org/credential-evaluations/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 font-medium text-sm underline decoration-2 decoration-primary underline-offset-6"
        >
          Explore official evaluation <ArrowUpRight className="size-4" />
        </a>
      </div>
    </section>
  );
}
