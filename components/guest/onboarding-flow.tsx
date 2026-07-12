"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CelebrationBanner,
  QuizPlaceholder
} from "@/components/guest/celebration-banner";
import { GuestNameCard } from "@/components/guest/guest-name-card";
import { InstructionCard } from "@/components/guest/instruction-card";
import { LanguageSelector } from "@/components/guest/language-selector";
import { OnboardingHero } from "@/components/guest/onboarding-hero";
import { ProgressIndicator } from "@/components/guest/progress-indicator";
import { MotionReveal } from "@/components/motion/motion-patterns";
import { Button } from "@/components/ui/button";
import type { BirthdayContent } from "@/lib/content/schema";
import { locales, type Locale } from "@/lib/i18n/routing";

type OnboardingStep =
  | "welcome"
  | "language"
  | "name"
  | "howToPlay"
  | "ready"
  | "quizPlaceholder";

type StoredOnboardingState = {
  step: OnboardingStep;
  selectedLanguage: Locale;
  playerName: string;
};

type OnboardingFlowProps = {
  locale: Locale;
  content: BirthdayContent;
};

const SESSION_KEY = "han-first-birthday:onboarding:v1";
const maxNameLength = 80;

const progressStepIds = [
  "welcome",
  "language",
  "name",
  "howToPlay",
  "ready"
] as const;

function isOnboardingStep(value: unknown): value is OnboardingStep {
  return (
    value === "welcome" ||
    value === "language" ||
    value === "name" ||
    value === "howToPlay" ||
    value === "ready" ||
    value === "quizPlaceholder"
  );
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getDefaultState(locale: Locale): StoredOnboardingState {
  return {
    step: "welcome",
    selectedLanguage: locale,
    playerName: ""
  };
}

function readStoredState(locale: Locale): StoredOnboardingState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredOnboardingState>;
    const step = isOnboardingStep(parsed.step) ? parsed.step : "welcome";
    const playerName =
      typeof parsed.playerName === "string" ? parsed.playerName : "";

    return {
      step,
      selectedLanguage: locale,
      playerName
    };
  } catch {
    return null;
  }
}

export function OnboardingFlow({ locale, content }: OnboardingFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<StoredOnboardingState>(() => {
    if (typeof window === "undefined") {
      return getDefaultState(locale);
    }

    return readStoredState(locale) ?? getDefaultState(locale);
  });
  const [nameError, setNameError] = useState("");
  const { step, playerName } = state;

  const progressSteps = useMemo(
    () =>
      progressStepIds.map((id) => ({
        id,
        label: content.screens.onboardingProgress[id]
      })),
    [content]
  );

  useEffect(() => {
    const nextState: StoredOnboardingState = {
      step: state.step,
      selectedLanguage: locale,
      playerName: state.playerName
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
  }, [locale, state]);

  function goToStep(nextStep: OnboardingStep) {
    setNameError("");
    setState((current) => ({ ...current, step: nextStep, selectedLanguage: locale }));
  }

  function chooseLanguage(nextLocale: Locale) {
    const nextState: StoredOnboardingState = {
      step: "name",
      selectedLanguage: nextLocale,
      playerName
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
    setNameError("");
    setState(nextState);

    if (nextLocale !== locale) {
      router.push(`/${nextLocale}`);
    }
  }

  function switchLanguage(nextLocale: Locale) {
    const nextState: StoredOnboardingState = {
      step,
      selectedLanguage: nextLocale,
      playerName
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
    setState(nextState);

    if (nextLocale !== locale) {
      router.push(`/${nextLocale}`);
    }
  }

  function submitName() {
    const trimmed = normalizeName(playerName);

    if (!trimmed) {
      setNameError(content.screens.guestEntry.validation.required);
      return;
    }

    if (trimmed.length > maxNameLength) {
      setNameError(content.screens.guestEntry.validation.tooLong);
      return;
    }

    setState((current) => ({
      ...current,
      step: "howToPlay",
      selectedLanguage: locale,
      playerName: trimmed
    }));
    setNameError("");
  }

  const visibleProgressStep = step === "quizPlaceholder" ? "ready" : step;
  const shouldShowProgress = step !== "welcome";

  return (
    <div className="space-y-5">
      {shouldShowProgress ? (
        <div className="space-y-4 pt-2">
          <div className="flex justify-center gap-2" data-testid="language-switcher">
            {locales.map((targetLocale) => (
              <Button
                key={targetLocale}
                type="button"
                variant={targetLocale === locale ? "default" : "outline"}
                size="sm"
                onClick={() => switchLanguage(targetLocale)}
                aria-label={`${content.screens.language.switchLabel}: ${targetLocale.toUpperCase()}`}
              >
                {targetLocale.toUpperCase()}
              </Button>
            ))}
          </div>
          <ProgressIndicator steps={progressSteps} currentStep={visibleProgressStep} />
        </div>
      ) : null}

      <MotionReveal key={step} pattern={step === "ready" ? "celebrate" : "page"}>
        {step === "welcome" ? (
          <OnboardingHero
            title={content.screens.welcome.title}
            subtitle={content.screens.welcome.subtitle}
            primaryAction={content.screens.welcome.primaryAction}
            heroPlaceholderLabel={content.screens.welcome.heroPlaceholderLabel}
            heroPlaceholderAlt={content.screens.welcome.heroPlaceholderAlt}
            onStart={() => goToStep("language")}
          />
        ) : null}

        {step === "language" ? (
          <LanguageSelector
            title={content.screens.language.title}
            subtitle={content.screens.language.subtitle}
            englishLabel={content.screens.language.englishLabel}
            englishDescription={content.screens.language.englishDescription}
            vietnameseLabel={content.screens.language.vietnameseLabel}
            vietnameseDescription={content.screens.language.vietnameseDescription}
            selectedLocale={locale}
            onSelect={chooseLanguage}
          />
        ) : null}

        {step === "name" ? (
          <GuestNameCard
            title={content.screens.guestEntry.title}
            description={content.screens.guestEntry.description}
            nameLabel={content.screens.guestEntry.nameLabel}
            namePlaceholder={content.screens.guestEntry.namePlaceholder}
            primaryAction={content.screens.guestEntry.primaryAction}
            value={playerName}
            error={nameError}
            onValueChange={(value) => {
              setState((current) => ({ ...current, playerName: value }));
              setNameError("");
            }}
            onSubmit={submitName}
          />
        ) : null}

        {step === "howToPlay" ? (
          <InstructionCard
            title={content.screens.howToPlay.title}
            subtitle={content.screens.howToPlay.subtitle}
            primaryAction={content.screens.howToPlay.primaryAction}
            cards={content.screens.howToPlay.cards}
            onContinue={() => goToStep("ready")}
          />
        ) : null}

        {step === "ready" ? (
          <CelebrationBanner
            title={content.screens.ready.title}
            subtitle={content.screens.ready.subtitle}
            primaryAction={content.screens.ready.primaryAction}
            guestName={playerName}
            onStartQuiz={() => goToStep("quizPlaceholder")}
          />
        ) : null}

        {step === "quizPlaceholder" ? (
          <QuizPlaceholder
            title={content.screens.quizPlaceholder.title}
            description={content.screens.quizPlaceholder.description}
            backAction={content.screens.quizPlaceholder.backAction}
            onBack={() => goToStep("ready")}
          />
        ) : null}
      </MotionReveal>
    </div>
  );
}
