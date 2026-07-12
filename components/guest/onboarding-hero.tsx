"use client";

import { Gift, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AssetPlaceholder } from "@/components/design/asset-placeholder";
import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { WaveDivider } from "@/components/design/party-motifs";
import { Button } from "@/components/ui/button";

type OnboardingHeroProps = {
  title: string;
  subtitle: string;
  primaryAction: string;
  heroPlaceholderLabel: string;
  heroPlaceholderAlt: string;
  onStart: () => void;
};

export function OnboardingHero({
  title,
  subtitle,
  primaryAction,
  heroPlaceholderLabel,
  heroPlaceholderAlt,
  onStart
}: OnboardingHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="grid min-h-[calc(100vh-2rem)] w-full items-center gap-7 py-12 sm:py-16 lg:grid-cols-[0.95fr_1.05fr]"
      data-testid="onboarding-welcome"
    >
      <section className="space-y-6 text-center lg:text-left">
        <BirthdayBadge tone="yellow" className="mx-auto lg:mx-0">
          <Gift className="h-4 w-4" aria-hidden="true" />
          {subtitle}
        </BirthdayBadge>
        <div className="space-y-4">
          <h1 className="headline-outline font-display text-6xl font-extrabold leading-[0.92] text-foreground sm:text-7xl lg:text-8xl">
            {title}
          </h1>
        </div>
        <div className="flex justify-center lg:justify-start">
          <Button size="lg" onClick={onStart} data-testid="welcome-start">
            <Sparkles aria-hidden="true" />
            {primaryAction}
          </Button>
        </div>
      </section>

      <motion.aside
        className="relative mx-auto w-full max-w-xl"
        animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div
          className="gingham-yellow absolute inset-x-8 top-2 h-24 rounded-[1.5rem] border border-party-orange/25 shadow-outline sm:h-32"
          aria-hidden="true"
        />
        <PaperPanel tone="blue" className="relative mt-8 p-4 sm:p-5">
          <div className="pointer-events-none cow-soft-spots absolute inset-0" aria-hidden="true" />
          <AssetPlaceholder
            label={heroPlaceholderLabel}
            alt={heroPlaceholderAlt}
            ratio="portrait"
            className="min-h-[18rem]"
          />
          <WaveDivider className="mt-5 w-full text-party-blue" />
        </PaperPanel>
      </motion.aside>
    </div>
  );
}
