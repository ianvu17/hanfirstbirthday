import { CheckCircle2, Lock, Timer } from "lucide-react";
import type { ComponentType } from "react";

import { PaperPanel } from "@/components/design/paper-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InstructionItem = {
  id: "timer" | "locked" | "reveal";
  title: string;
  description: string;
};

type InstructionCardProps = {
  title: string;
  subtitle: string;
  primaryAction: string;
  cards: InstructionItem[];
  onContinue: () => void;
};

const iconById: Record<InstructionItem["id"], ComponentType<{ className?: string }>> = {
  timer: Timer,
  locked: Lock,
  reveal: CheckCircle2
};

export function InstructionCard({
  title,
  subtitle,
  primaryAction,
  cards,
  onContinue
}: InstructionCardProps) {
  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center gap-3 py-5 text-center sm:gap-6 sm:py-8"
      data-testid="onboarding-instructions"
    >
      <div className="space-y-3">
        <h1 className="font-display text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto max-w-xl text-base font-semibold leading-7 text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <PaperPanel tone="celebration" className="overflow-hidden p-2 sm:p-6">
        <div className="pointer-events-none absolute inset-0 cow-soft-spots opacity-50" aria-hidden="true" />
        <div className="relative grid gap-3 md:grid-cols-3 md:gap-4">
        {cards.map((card, index) => {
          const Icon = iconById[card.id];

          return (
            <article
              key={card.id}
              className={cn(
                "relative rounded-[1rem] border p-3 text-left shadow-paper md:min-h-44 md:rounded-[1.28rem] md:p-5",
                card.id === "timer" && "border-party-orange/30 bg-surface-highlight/72",
                card.id === "locked" && "border-party-blue-deep/25 bg-surface-sky/70",
                card.id === "reveal" && "border-party-red/20 bg-surface-paper"
              )}
            >
              {index < cards.length - 1 ? (
                <div
                  className="absolute left-1/2 top-full hidden h-4 w-10 -translate-x-1/2 border-b-4 border-dotted border-party-orange/35 md:left-auto md:right-[-1.65rem] md:top-1/2 md:block md:h-0 md:w-7 md:-translate-y-1/2"
                  aria-hidden="true"
                />
              ) : null}
              <div className="mb-2 flex items-center justify-between md:mb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-[0.9rem] border border-party-orange/30 bg-surface-paper shadow-lift md:h-14 md:w-14 md:rounded-[1.1rem]">
                  <Icon className="h-6 w-6 text-foreground md:h-7 md:w-7" aria-hidden="true" />
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-party-orange/30 bg-surface-paper text-sm font-extrabold text-foreground shadow-lift">
                  {index + 1}
                </span>
              </div>
              <h2 className="font-display text-2xl font-extrabold leading-none text-foreground md:text-3xl">
                {card.title}
              </h2>
              <p className="mt-1.5 text-sm font-bold leading-5 text-muted-foreground md:mt-3 md:leading-6">
                {card.description}
              </p>
            </article>
          );
        })}
        </div>
      </PaperPanel>

      <div className="flex justify-center">
        <Button size="lg" onClick={onContinue} data-testid="instructions-continue">
          <CheckCircle2 aria-hidden="true" />
          {primaryAction}
        </Button>
      </div>
    </section>
  );
}
