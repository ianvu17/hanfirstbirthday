import { ArrowLeft, PartyPopper, Sparkles } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { GiftStack, PartyHat, StarCluster } from "@/components/design/party-motifs";
import { Button } from "@/components/ui/button";

type CelebrationBannerProps = {
  title: string;
  subtitle: string;
  primaryAction: string;
  guestName: string;
  onStartQuiz: () => void;
};

type QuizPlaceholderProps = {
  title: string;
  description: string;
  backAction: string;
  onBack: () => void;
};

export function CelebrationBanner({
  title,
  subtitle,
  primaryAction,
  guestName,
  onStartQuiz
}: CelebrationBannerProps) {
  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-4xl flex-col justify-center py-8 text-center"
      data-testid="onboarding-ready"
    >
      <PaperPanel tone="yellow" className="overflow-hidden p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0 cow-soft-spots opacity-60" aria-hidden="true" />
        <StarCluster className="absolute right-3 top-2 w-24 rotate-12 text-party-yellow opacity-85" />
        <PartyHat className="absolute left-4 top-5 hidden w-16 -rotate-12 drop-shadow-md sm:block" />
        <div className="relative grid gap-6 md:grid-cols-[0.78fr_1.22fr] md:items-center">
          <div className="relative order-2 mx-auto w-full max-w-xs md:order-1">
            <div className="paper-stage rounded-[1.45rem] border border-party-orange/25 p-5 shadow-outline">
              <GiftStack className="mx-auto w-52 drop-shadow-md" />
              <BirthdayBadge tone="coral" className="mx-auto mt-2 normal-case">
                <PartyPopper className="h-4 w-4" aria-hidden="true" />
                {guestName}
              </BirthdayBadge>
            </div>
          </div>
          <div className="order-1 space-y-5 md:order-2 md:text-left">
            <div className="space-y-3">
              <h1 className="headline-outline font-display text-6xl font-extrabold leading-none text-foreground sm:text-7xl">
                {title}
              </h1>
              <p className="mx-auto max-w-xl text-xl font-extrabold leading-8 text-foreground md:mx-0">
                {subtitle}
              </p>
            </div>
            <div className="flex justify-center md:justify-start">
              <Button size="lg" onClick={onStartQuiz} data-testid="ready-start-quiz">
                <Sparkles aria-hidden="true" />
                {primaryAction}
              </Button>
            </div>
          </div>
        </div>
      </PaperPanel>
    </section>
  );
}

export function QuizPlaceholder({
  title,
  description,
  backAction,
  onBack
}: QuizPlaceholderProps) {
  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-2xl flex-col justify-center py-10 text-center"
      data-testid="onboarding-quiz-placeholder"
    >
      <PaperPanel tone="blue" className="p-7 sm:p-9">
        <div className="space-y-5">
          <BirthdayBadge tone="blue" className="mx-auto">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {title}
          </BirthdayBadge>
          <p className="mx-auto max-w-lg text-base font-bold leading-7 text-muted-foreground">
            {description}
          </p>
          <Button variant="outline" onClick={onBack} data-testid="placeholder-back">
            <ArrowLeft aria-hidden="true" />
            {backAction}
          </Button>
        </div>
      </PaperPanel>
    </section>
  );
}
