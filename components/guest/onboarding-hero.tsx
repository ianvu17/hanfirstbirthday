"use client";

import { Gift, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { HeroPhotoFrame } from "@/components/design/hero-photo-frame";
import { GiftStack, PartyHat } from "@/components/design/party-motifs";
import { TitleLockup } from "@/components/design/title-lockup";
import { Button } from "@/components/ui/button";
import { hanFirstBirthdayPhoto } from "@/lib/assets/han";

type OnboardingHeroProps = {
  title: string;
  subtitle: string;
  primaryAction: string;
  heroPhotoAlt: string;
  onStart: () => void;
};

export function OnboardingHero({
  title,
  subtitle,
  primaryAction,
  heroPhotoAlt,
  onStart,
}: OnboardingHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className="grid min-h-[calc(100vh-2rem)] w-full items-center gap-4 py-8 [@media(max-width:390px)_and_(max-height:700px)]:min-h-0 [@media(max-width:390px)_and_(max-height:700px)]:gap-1 [@media(max-width:390px)_and_(max-height:700px)]:py-2 sm:gap-6 sm:py-14 lg:grid-cols-[0.92fr_1.08fr]"
      data-testid="onboarding-welcome"
    >
      <section className="relative z-10 space-y-5 text-center [@media(max-width:390px)_and_(max-height:700px)]:space-y-2 lg:text-left">
        <BirthdayBadge tone="yellow" className="mx-auto lg:mx-0">
          <Gift className="h-4 w-4" aria-hidden="true" />
          {subtitle}
        </BirthdayBadge>
        <TitleLockup
          title={title}
          className="mx-auto max-w-[24rem] [@media(max-width:390px)_and_(max-height:700px)]:max-w-[18rem] [@media(max-width:390px)_and_(max-height:700px)]:text-[2.25rem] [@media(max-width:390px)_and_(max-height:700px)]:leading-[0.76] lg:mx-0 lg:max-w-[32rem]"
        />
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
            src={hanFirstBirthdayPhoto.src}
            alt={heroPhotoAlt}
            objectPosition={hanFirstBirthdayPhoto.objectPosition}
            sizes={hanFirstBirthdayPhoto.sizes}
            preload
            className="max-w-[18.5rem] [@media(max-width:390px)_and_(max-height:700px)]:max-w-[15rem] sm:max-w-[22rem]"
          />
          <GiftStack className="absolute -bottom-3 left-0 hidden w-36 -rotate-3 drop-shadow-md sm:block" />
        </motion.div>
        <div className="mt-4 flex justify-center [@media(max-width:390px)_and_(max-height:700px)]:mt-2">
          <Button size="lg" onClick={onStart} data-testid="welcome-start">
            <Sparkles aria-hidden="true" />
            {primaryAction}
          </Button>
        </div>
      </aside>
    </div>
  );
}
