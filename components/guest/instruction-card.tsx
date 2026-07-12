import { CheckCircle2, Lock, Timer } from "lucide-react";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";

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
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center gap-7 py-10 text-center"
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

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = iconById[card.id];

          return (
            <article
              key={card.id}
              className="min-h-44 rounded-[1.35rem] border border-border bg-surface-paper p-5 text-left shadow-paper"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-party-orange/30 bg-surface-highlight shadow-lift">
                <Icon className="h-7 w-7 text-foreground" aria-hidden="true" />
              </div>
              <h2 className="font-display text-3xl font-extrabold leading-none text-foreground">
                {card.title}
              </h2>
              <p className="mt-3 text-sm font-bold leading-6 text-muted-foreground">
                {card.description}
              </p>
            </article>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button size="lg" onClick={onContinue} data-testid="instructions-continue">
          <CheckCircle2 aria-hidden="true" />
          {primaryAction}
        </Button>
      </div>
    </section>
  );
}
