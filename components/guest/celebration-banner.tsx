import { ArrowLeft, PartyPopper, Sparkles } from "lucide-react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
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
      className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-3xl flex-col justify-center py-10 text-center"
      data-testid="onboarding-ready"
    >
      <PaperPanel tone="yellow" className="overflow-hidden p-7 sm:p-10">
        <div className="pointer-events-none cow-soft-spots absolute inset-0" aria-hidden="true" />
        <div className="space-y-6">
          <BirthdayBadge tone="coral" className="mx-auto normal-case">
            <PartyPopper className="h-4 w-4" aria-hidden="true" />
            {guestName}
          </BirthdayBadge>
          <div className="space-y-3">
            <h1 className="headline-outline font-display text-6xl font-extrabold leading-none text-foreground sm:text-7xl">
              {title}
            </h1>
            <p className="mx-auto max-w-xl text-xl font-extrabold leading-8 text-foreground">
              {subtitle}
            </p>
          </div>
          <Button size="lg" onClick={onStartQuiz} data-testid="ready-start-quiz">
            <Sparkles aria-hidden="true" />
            {primaryAction}
          </Button>
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
