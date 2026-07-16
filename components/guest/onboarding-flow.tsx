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
import { PartyPhotoCard } from "@/components/guest/party-photo-card";
import { ProgressIndicator } from "@/components/guest/progress-indicator";
import { MotionReveal } from "@/components/motion/motion-patterns";
import { Button } from "@/components/ui/button";
import type { BirthdayContent } from "@/lib/content/schema";
import { locales, type Locale } from "@/lib/i18n/routing";
import type { AvatarPresetId, ParticipantAvatarProjection } from "@/lib/party-avatar";
import { preparedAvatarFieldName } from "@/lib/party-avatar-upload";
import {
  buildGuestPlayPath,
  buildGuestWelcomePath
} from "@/lib/party-remote/join-routing";

type OnboardingStep =
  | "welcome"
  | "language"
  | "name"
  | "partyPhoto"
  | "howToPlay"
  | "ready"
  | "quizPlaceholder";

type StoredOnboardingState = {
  step: OnboardingStep;
  selectedLanguage: Locale;
  playerName: string;
  guestSessionId: string | null;
  joinCode: string | null;
  avatar: ParticipantAvatarProjection | null;
};

type OnboardingFlowProps = {
  locale: Locale;
  content: BirthdayContent;
  remoteEnabled?: boolean;
  initialJoinCode?: string;
};

const SESSION_KEY = "han-first-birthday:onboarding:v1";
const maxNameLength = 80;

const progressStepIds = [
  "welcome",
  "language",
  "name",
  "partyPhoto",
  "howToPlay",
  "ready"
] as const;

function isOnboardingStep(value: unknown): value is OnboardingStep {
  return (
    value === "welcome" ||
    value === "language" ||
    value === "name" ||
    value === "partyPhoto" ||
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
    playerName: "",
    guestSessionId: null,
    joinCode: null,
    avatar: null
  };
}

function isStoredAvatar(value: unknown): value is ParticipantAvatarProjection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const avatar = value as Partial<ParticipantAvatarProjection>;

  return (
    (avatar.type === "photo" && typeof avatar.url === "string") ||
    (avatar.type === "preset" && typeof avatar.presetId === "string") ||
    (avatar.type === "fallback" && typeof avatar.initials === "string")
  );
}

function readStoredState(locale: Locale, initialJoinCode?: string): StoredOnboardingState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredOnboardingState>;
    const step = isOnboardingStep(parsed.step) ? parsed.step : "welcome";
    const playerName =
      typeof parsed.playerName === "string" ? parsed.playerName : "";
    const guestSessionId =
      typeof parsed.guestSessionId === "string" ? parsed.guestSessionId : null;
    const joinCode =
      initialJoinCode ??
      (typeof parsed.joinCode === "string" && parsed.joinCode
        ? parsed.joinCode
        : null);
    const avatar = isStoredAvatar(parsed.avatar) ? parsed.avatar : null;

    return {
      step,
      selectedLanguage: locale,
      playerName,
      guestSessionId,
      joinCode,
      avatar
    };
  } catch {
    return null;
  }
}

export function OnboardingFlow({
  locale,
  content,
  remoteEnabled = false,
  initialJoinCode
}: OnboardingFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<StoredOnboardingState>(() => ({
    ...getDefaultState(locale),
    joinCode: initialJoinCode ?? null
  }));
  const [hasHydratedStoredState, setHasHydratedStoredState] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [avatar, setAvatar] = useState<ParticipantAvatarProjection | null>(null);
  const { step, playerName } = state;
  const joinCode = state.joinCode ?? initialJoinCode;

  const progressSteps = useMemo(
    () =>
      progressStepIds.map((id) => ({
        id,
        label: content.screens.onboardingProgress[id]
      })),
    [content]
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const stored = readStoredState(locale, initialJoinCode) ?? getDefaultState(locale);
      const nextState = {
        ...stored,
        selectedLanguage: locale,
        joinCode: initialJoinCode ?? stored.joinCode
      };

      setState(nextState);
      setAvatar(nextState.avatar);
      setHasHydratedStoredState(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, [initialJoinCode, locale]);

  useEffect(() => {
    if (!hasHydratedStoredState) {
      return;
    }

    const nextState: StoredOnboardingState = {
      step: state.step,
      selectedLanguage: locale,
      playerName: state.playerName,
      guestSessionId: state.guestSessionId,
      joinCode: state.joinCode ?? initialJoinCode ?? null,
      avatar
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
  }, [avatar, hasHydratedStoredState, initialJoinCode, locale, state]);

  function goToStep(nextStep: OnboardingStep) {
    setNameError("");
    setState((current) => ({ ...current, step: nextStep, selectedLanguage: locale }));
  }

  function chooseLanguage(nextLocale: Locale) {
    const nextState: StoredOnboardingState = {
      step: "name",
      selectedLanguage: nextLocale,
      playerName,
      guestSessionId: state.guestSessionId,
      joinCode: state.joinCode ?? initialJoinCode ?? null,
      avatar
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
    setNameError("");
    setState(nextState);

    if (nextLocale !== locale) {
      router.push(buildGuestWelcomePath(nextLocale, nextState.joinCode ?? undefined));
    }
  }

  function switchLanguage(nextLocale: Locale) {
    const nextState: StoredOnboardingState = {
      step,
      selectedLanguage: nextLocale,
      playerName,
      guestSessionId: state.guestSessionId,
      joinCode: state.joinCode ?? initialJoinCode ?? null,
      avatar
    };

    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
    setState(nextState);

    if (nextLocale !== locale) {
      router.push(buildGuestWelcomePath(nextLocale, nextState.joinCode ?? undefined));
    }
  }

  async function joinRemoteParty(displayName: string) {
    const response = await fetch("/api/party/join", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        displayName,
        locale,
        joinCode
      })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        payload?.error?.message ?? content.screens.errors.network
      );
    }
  }

  async function submitName() {
    if (isJoining) {
      return;
    }

    const trimmed = normalizeName(playerName);

    if (!trimmed) {
      setNameError(content.screens.guestEntry.validation.required);
      return;
    }

    if (trimmed.length > maxNameLength) {
      setNameError(content.screens.guestEntry.validation.tooLong);
      return;
    }

    if (remoteEnabled) {
      setIsJoining(true);

      try {
        await joinRemoteParty(trimmed);
      } catch (error) {
        setNameError(
          error instanceof Error ? error.message : content.screens.errors.network
        );
        setIsJoining(false);
        return;
      }

      setIsJoining(false);
    }

    setState((current) => ({
      ...current,
      step: "partyPhoto",
      selectedLanguage: locale,
      playerName: trimmed,
      joinCode: current.joinCode ?? initialJoinCode ?? null
    }));
    setNameError("");
  }

  function blobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Could not read avatar."));
      reader.readAsDataURL(blob);
    });
  }

  async function savePhotoAvatar(file: File): Promise<ParticipantAvatarProjection | null> {
    if (!remoteEnabled) {
      const localFallback: ParticipantAvatarProjection = {
        type: "photo",
        url: await blobToDataUrl(file)
      };
      setAvatar(localFallback);
      return localFallback;
    }

    const formData = new FormData();
    formData.append(preparedAvatarFieldName, file);

    const response = await fetch("/api/party/participant/avatar", {
      method: "POST",
      body: formData,
      credentials: "include",
      headers: {
        accept: "application/json"
      }
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? content.screens.partyPhoto.validation.uploadFailed);
    }

    setAvatar(payload.participant.avatar);
    return payload.participant.avatar;
  }

  async function savePresetAvatar(
    presetId: AvatarPresetId
  ): Promise<ParticipantAvatarProjection | null> {
    if (!remoteEnabled) {
      const localFallback: ParticipantAvatarProjection = {
        type: "preset",
        presetId
      };
      setAvatar(localFallback);
      return localFallback;
    }

    const response = await fetch("/api/party/participant/avatar", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        type: "preset",
        presetId
      })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error?.message ?? content.screens.partyPhoto.validation.uploadFailed);
    }

    setAvatar(payload.participant.avatar);
    return payload.participant.avatar;
  }

  const visibleProgressStep = step === "quizPlaceholder" ? "ready" : step;
  const shouldShowProgress = step !== "welcome";
  const shouldShowLanguageSwitcher = shouldShowProgress && step !== "language";

  return (
    <div className="space-y-5">
      {shouldShowProgress ? (
        <div className="grid gap-3 pt-2 md:grid-cols-[1fr_auto] md:items-center">
          <ProgressIndicator steps={progressSteps} currentStep={visibleProgressStep} />
          {shouldShowLanguageSwitcher ? (
            <div
              className="mx-auto flex rounded-[1rem] border border-border bg-surface-paper/80 p-1 shadow-lift md:mx-0"
              data-testid="language-switcher"
            >
              {locales.map((targetLocale) => (
                <Button
                  key={targetLocale}
                  type="button"
                  variant={targetLocale === locale ? "default" : "ghost"}
                  size="sm"
                  onClick={() => switchLanguage(targetLocale)}
                  aria-label={`${content.screens.language.switchLabel}: ${targetLocale.toUpperCase()}`}
                  className="h-9 rounded-[0.75rem] px-3"
                >
                  {targetLocale.toUpperCase()}
                </Button>
              ))}
            </div>
          ) : null}
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
            disabled={isJoining}
            onValueChange={(value) => {
              setState((current) => ({ ...current, playerName: value }));
              setNameError("");
            }}
            onSubmit={submitName}
          />
        ) : null}

        {step === "partyPhoto" ? (
          <PartyPhotoCard
            copy={content.screens.partyPhoto}
            displayName={playerName}
            currentAvatar={avatar}
            onSavePhoto={savePhotoAvatar}
            onSavePreset={savePresetAvatar}
            onContinue={() => goToStep("howToPlay")}
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
            onStartQuiz={() => router.push(buildGuestPlayPath(locale, joinCode))}
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
