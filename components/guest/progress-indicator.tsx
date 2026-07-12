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
      <ol className="grid grid-cols-5 gap-2">
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStep;
          const isComplete = index < currentIndex;

          return (
            <li key={step.id} className="min-w-0">
              <div
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-[1rem] border px-1.5 py-2 text-center text-[0.68rem] font-extrabold leading-3 shadow-lift sm:text-xs",
                  isCurrent &&
                    "border-party-blue-deep/35 bg-party-blue text-primary-foreground",
                  isComplete &&
                    "border-party-green/35 bg-surface-paper text-foreground",
                  !isCurrent && !isComplete && "border-border bg-surface-paper/80 text-muted-foreground"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={step.label}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[0.64rem]",
                    isCurrent && "border-white/60 bg-white/20",
                    isComplete && "border-party-green/30 bg-party-green/15",
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
