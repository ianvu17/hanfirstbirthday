"use client";

import { ArrowRight, CheckCircle2, Lock, Sparkles, Timer } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { PaperPanel } from "@/components/design/paper-panel";
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

function TimerVisual({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative mx-auto grid h-32 w-32 place-items-center rounded-full bg-surface-paper shadow-sticker">
      <svg viewBox="0 0 120 120" className="absolute inset-2" aria-hidden="true">
        <circle cx="60" cy="60" r="48" fill="none" stroke="hsl(var(--surface-deep))" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r="48"
          fill="none"
          stroke="hsl(var(--party-orange))"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="302"
          initial={false}
          animate={reducedMotion ? { strokeDashoffset: 76 } : { strokeDashoffset: [0, 226, 0] }}
          transition={reducedMotion ? undefined : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="font-display text-4xl font-extrabold text-foreground">20</span>
      <Timer className="absolute -right-1 top-2 h-8 w-8 rotate-12 text-party-blue-deep" aria-hidden="true" />
    </div>
  );
}

function LockVisual({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative mx-auto flex h-32 w-full max-w-[13rem] flex-col justify-center gap-2">
      <div className="h-10 rounded-[0.9rem] border border-party-blue/25 bg-surface-paper shadow-lift" />
      <div className="h-10 rounded-[0.9rem] border-2 border-party-blue-deep bg-surface-sky shadow-lift">
        <div className="ml-3 mt-3 h-3 w-20 rounded-full bg-party-blue" />
      </div>
      <motion.div
        className="absolute -right-2 bottom-3 grid h-12 w-12 place-items-center rounded-full border-4 border-surface-paper bg-party-yellow text-foreground shadow-sticker"
        animate={reducedMotion ? undefined : { scale: [1, 1.12, 1], rotate: [0, -8, 0] }}
        transition={reducedMotion ? undefined : { duration: 1.8, repeat: Infinity, repeatDelay: 1.5 }}
      >
        <Lock className="h-6 w-6" aria-hidden="true" />
      </motion.div>
    </div>
  );
}

function RaceVisual({ reducedMotion }: { reducedMotion: boolean }) {
  const bars = [
    { color: "bg-party-blue-deep", width: "92%", delay: 0 },
    { color: "bg-party-orange", width: "70%", delay: 0.15 },
    { color: "bg-party-yellow", width: "50%", delay: 0.3 },
  ];

  return (
    <div className="mx-auto flex h-32 w-full max-w-[14rem] flex-col justify-center gap-3 rounded-[1.2rem] bg-surface-paper/75 p-4 shadow-outline">
      {bars.map((bar, index) => (
        <div key={bar.color} className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-highlight font-display text-sm font-extrabold">
            {index + 1}
          </span>
          <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface-deep">
            <motion.div
              className={`h-full rounded-full ${bar.color}`}
              initial={false}
              animate={reducedMotion ? { width: bar.width } : { width: ["18%", bar.width, "18%"] }}
              transition={reducedMotion ? undefined : { duration: 3.2, delay: bar.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StepVisual({ id, reducedMotion }: { id: InstructionItem["id"]; reducedMotion: boolean }) {
  if (id === "timer") return <TimerVisual reducedMotion={reducedMotion} />;
  if (id === "locked") return <LockVisual reducedMotion={reducedMotion} />;
  return <RaceVisual reducedMotion={reducedMotion} />;
}

function CompactStepVisual({ id }: { id: InstructionItem["id"] }) {
  if (id === "timer") {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-full border-4 border-party-orange/70 bg-surface-paper font-display text-xs font-extrabold text-foreground shadow-lift">
        20s
      </div>
    );
  }

  if (id === "locked") {
    return (
      <div className="grid h-10 w-10 place-items-center rounded-[0.8rem] border border-party-blue-deep/30 bg-party-yellow shadow-lift">
        <Lock className="h-5 w-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="grid h-10 w-11 content-center gap-1 rounded-[0.8rem] bg-surface-paper p-1.5 shadow-lift" aria-hidden="true">
      <span className="h-1.5 w-full rounded-full bg-party-blue-deep" />
      <span className="h-1.5 w-3/4 rounded-full bg-party-orange" />
      <span className="h-1.5 w-1/2 rounded-full bg-party-yellow" />
    </div>
  );
}

export function InstructionCard({
  title,
  subtitle,
  primaryAction,
  cards,
  onContinue,
}: InstructionCardProps) {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-11rem)] w-full max-w-5xl flex-col justify-center gap-5 py-4 text-center sm:py-6"
      data-testid="onboarding-instructions"
    >
      <div className="space-y-2">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-party-orange/25 bg-surface-highlight px-4 py-2 text-sm font-extrabold text-foreground shadow-lift">
          <Sparkles className="h-4 w-4 text-party-orange" aria-hidden="true" />
          1 · 2 · 3
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-none text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="mx-auto max-w-2xl text-sm font-semibold leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {subtitle}
        </p>
      </div>

      <PaperPanel tone="celebration" className="overflow-hidden p-3 sm:p-5">
        <div className="pointer-events-none absolute inset-0 cow-soft-spots opacity-45" aria-hidden="true" />
        <ol className="relative grid gap-3 text-left md:grid-cols-3 md:gap-5">
          <div className="absolute left-[16.66%] right-[16.66%] top-[4.4rem] hidden border-t-4 border-dashed border-party-orange/30 md:block" aria-hidden="true" />
          {cards.map((card, index) => (
            <motion.li
              key={card.id}
              className="relative grid grid-cols-[3rem_1fr] items-center gap-3 rounded-[1.25rem] bg-surface-paper/78 p-3 shadow-paper md:grid-cols-1 md:gap-2 md:bg-transparent md:p-2 md:shadow-none"
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reducedMotion ? 0 : index * 0.12 }}
            >
              <div className="relative z-10 col-start-1 row-span-2 grid h-11 w-11 place-items-center rounded-full border-4 border-surface-paper bg-party-blue-deep font-display text-xl font-extrabold text-white shadow-sticker md:absolute md:left-2 md:top-2">
                {index + 1}
              </div>
              <div className="absolute right-3 top-3 md:hidden">
                <CompactStepVisual id={card.id} />
              </div>
              <div className="hidden md:block">
                <StepVisual id={card.id} reducedMotion={reducedMotion} />
              </div>
              <div className="min-w-0 pr-11 md:pr-0 md:text-center">
                <h2 className="font-display text-2xl font-extrabold leading-none text-foreground md:text-3xl">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-sm font-bold leading-5 text-muted-foreground md:mt-2 md:leading-6">
                  {card.description}
                </p>
              </div>
              {index < cards.length - 1 ? (
                <ArrowRight className="absolute -bottom-4 left-5 h-5 w-5 rotate-90 text-party-orange md:-right-4 md:bottom-auto md:left-auto md:top-[4rem] md:rotate-0" aria-hidden="true" />
              ) : null}
            </motion.li>
          ))}
        </ol>
      </PaperPanel>

      <div className="flex justify-center">
        <Button size="lg" onClick={onContinue} data-testid="instructions-continue" className="w-full sm:w-auto">
          <CheckCircle2 aria-hidden="true" />
          {primaryAction}
        </Button>
      </div>
    </section>
  );
}
