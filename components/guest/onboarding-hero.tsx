"use client";

import { Gift, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { HeroPhotoFrame } from "@/components/design/hero-photo-frame";
import { GiftStack, PartyHat } from "@/components/design/party-motifs";
import { TitleLockup } from "@/components/design/title-lockup";
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
      className="grid min-h-[calc(100vh-2rem)] w-full items-center gap-4 py-8 sm:gap-6 sm:py-14 lg:grid-cols-[0.92fr_1.08fr]"
      data-testid="onboarding-welcome"
    >
      <section className="relative z-10 space-y-5 text-center lg:text-left">
        <BirthdayBadge tone="yellow" className="mx-auto lg:mx-0">
          <Gift className="h-4 w-4" aria-hidden="true" />
          {subtitle}
        </BirthdayBadge>
        <TitleLockup title={title} className="mx-auto max-w-[24rem] lg:mx-0 lg:max-w-[32rem]" />
        <p className="mx-auto max-w-xs text-sm font-extrabold uppercase leading-5 text-party-blue-deep lg:mx-0">
          {heroPlaceholderLabel}
        </p>
      </section>

      <aside className="relative mx-auto w-full max-w-xl">
        <motion.div
          className="relative"
          animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
          transition={
            prefersReducedMotion
              ? undefined
              : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <PartyHat className="absolute -right-1 top-3 z-20 w-16 rotate-12 drop-shadow-md sm:right-10" />
        <HeroPhotoFrame
          label={heroPlaceholderLabel}
          alt={heroPlaceholderAlt}
          className="max-w-[18.5rem] sm:max-w-[22rem]"
        />
          <GiftStack className="absolute -bottom-3 left-0 hidden w-36 -rotate-3 drop-shadow-md sm:block" />
        </motion.div>
        <div className="mt-4 flex justify-center">
          <Button size="lg" onClick={onStart} data-testid="welcome-start">
            <Sparkles aria-hidden="true" />
            {primaryAction}
          </Button>
        </div>
      </aside>
    </div>
  );
}
