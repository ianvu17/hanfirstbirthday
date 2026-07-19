import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type ProgressStep = {
  id: string;
  label: string;
};

type ProgressIndicatorProps = {
  steps: ProgressStep[];
  currentStep: string;
};

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === currentStep)
  );

  return (
    <nav aria-label="Onboarding progress" className="mx-auto w-full max-w-3xl">
      <ol
        className="relative grid gap-1.5 rounded-[1.25rem] border border-party-orange/20 bg-surface-paper/72 p-1.5 shadow-lift sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        <span
          className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-party-orange/20"
          aria-hidden="true"
        />
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isComplete = index < currentIndex;

          return (
            <li key={step.id} className="relative min-w-0">
              <div
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-center gap-1 rounded-[0.95rem] border px-1 py-2 text-center text-[0.68rem] font-extrabold leading-3 shadow-lift transition duration-medium ease-paper sm:min-h-14 sm:text-xs",
                  "after:absolute after:-bottom-1 after:left-1/2 after:h-2 after:w-2 after:-translate-x-1/2 after:rotate-45 after:border-b after:border-r after:bg-inherit",
                  isCurrent &&
                    "z-10 -translate-y-0.5 border-party-blue-deep/35 bg-party-blue text-primary-foreground after:border-party-blue-deep/35",
                  isComplete &&
                    "border-party-green/35 bg-surface-highlight text-foreground after:border-party-green/35",
                  !isCurrent &&
                    !isComplete &&
                    "border-border bg-surface-paper text-muted-foreground after:border-border"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={step.label}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[0.64rem] shadow-[inset_0_1px_0_hsl(var(--surface-paper)/0.35)]",
                    isCurrent && "border-white/60 bg-white/20",
                    isComplete && "border-party-green/30 bg-surface-paper/70",
                    !isCurrent && !isComplete && "border-border bg-surface-deep"
                  )}
                  aria-hidden="true"
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="hidden w-full truncate sm:block">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
