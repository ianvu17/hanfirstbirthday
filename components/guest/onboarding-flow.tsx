"use client";

import { ArrowLeft } from "lucide-react";
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
import {
  uploadPreparedAvatar,
  type AvatarUploadProgress,
} from "@/lib/party-avatar-upload-client";
import {
  buildGuestPlayPath,
  buildGuestWelcomePath
} from "@/lib/party-remote/join-routing";
import type { RemoteGuestSnapshot } from "@/lib/party-remote/types";

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
  initialParticipant?: {
    id: string;
    displayName: string;
    locale: Locale;
    isReady: boolean;
    avatar: ParticipantAvatarProjection;
  };
};

const SESSION_KEY = "han-first-birthday:onboarding:v1";
const maxNameLength = 40;

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
  initialJoinCode,
  initialParticipant,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [state, setState] = useState<StoredOnboardingState>(() => ({
    ...getDefaultState(locale),
    joinCode: initialJoinCode ?? null
  }));
  const [hasHydratedStoredState, setHasHydratedStoredState] = useState(false);
  const [nameError, setNameError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(
    initialParticipant?.id ?? null,
  );
  const [participantReady, setParticipantReady] = useState(
    initialParticipant?.isReady ?? false,
  );
  const [avatar, setAvatar] = useState<ParticipantAvatarProjection | null>(
    initialParticipant?.avatar ?? null,
  );
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
        step: initialParticipant?.isReady
          ? "ready"
          : stored.step === "quizPlaceholder"
            ? initialParticipant?.avatar
              ? "howToPlay"
              : "partyPhoto"
            : stored.step,
        selectedLanguage: locale,
        playerName: initialParticipant?.displayName ?? stored.playerName,
        joinCode: initialJoinCode ?? stored.joinCode
      };

      setState(nextState);
      setAvatar(initialParticipant?.avatar ?? nextState.avatar);
      setParticipantId(initialParticipant?.id ?? null);
      setParticipantReady(initialParticipant?.isReady ?? false);
      setHasHydratedStoredState(true);
    }, 0);

    return () => window.clearTimeout(handle);
  }, [initialJoinCode, initialParticipant, locale]);

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

  useEffect(() => {
    if (!remoteEnabled || !participantId) {
      return;
    }

    let cancelled = false;

    async function reconcile() {
      const response = await fetch("/api/party/session", {
        headers: { accept: "application/json" },
        cache: "no-store",
      }).catch(() => null);

      if (!response?.ok || cancelled) {
        return;
      }

      const snapshot = (await response.json()) as RemoteGuestSnapshot;

      if (!snapshot.session || !snapshot.participant) {
        return;
      }

      setAvatar(snapshot.participant.avatar);
      setParticipantReady(snapshot.participant.isReady);

      if (snapshot.session.phase !== "lobby") {
        router.replace(
          buildGuestPlayPath(
            snapshot.participant.locale,
            joinCode ?? snapshot.session.publicJoinCode,
          ),
        );
      }
    }

    const interval = window.setInterval(() => void reconcile(), 4_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [joinCode, participantId, remoteEnabled, router]);

  function goToStep(nextStep: OnboardingStep) {
    setNameError("");
    setState((current) => ({ ...current, step: nextStep, selectedLanguage: locale }));
  }

  async function updateRemoteProfile(patch: {
    displayName?: string;
    locale?: Locale;
  }) {
    if (!remoteEnabled || !participantId) {
      return null;
    }

    const response = await fetch("/api/party/participant/profile", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(patch),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(content.screens.errors.network);
    }

    const snapshot = payload as RemoteGuestSnapshot;
    if (snapshot.participant) {
      setParticipantReady(snapshot.participant.isReady);
      setAvatar(snapshot.participant.avatar);
    }
    return snapshot;
  }

  async function updateReadiness(isReady: boolean) {
    if (!remoteEnabled || !participantId) {
      setParticipantReady(isReady);
      return null;
    }

    const response = await fetch("/api/party/participant/readiness", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ isReady }),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(content.screens.errors.network);
    }

    setParticipantReady(isReady);
    return payload as RemoteGuestSnapshot;
  }

  async function chooseLanguage(nextLocale: Locale) {
    if (isProfileUpdating) {
      return;
    }

    const nextState: StoredOnboardingState = {
      step: "name",
      selectedLanguage: nextLocale,
      playerName,
      guestSessionId: state.guestSessionId,
      joinCode: state.joinCode ?? initialJoinCode ?? null,
      avatar
    };

    setIsProfileUpdating(true);

    try {
      await updateRemoteProfile({ locale: nextLocale });
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
      setNameError("");
      setState(nextState);
      setParticipantReady(false);

      if (nextLocale !== locale) {
        router.push(buildGuestWelcomePath(nextLocale, nextState.joinCode ?? undefined));
      }
    } catch (error) {
      setNameError(error instanceof Error ? error.message : content.screens.errors.network);
    } finally {
      setIsProfileUpdating(false);
    }
  }

  async function switchLanguage(nextLocale: Locale) {
    if (isProfileUpdating) {
      return;
    }

    const nextState: StoredOnboardingState = {
      step,
      selectedLanguage: nextLocale,
      playerName,
      guestSessionId: state.guestSessionId,
      joinCode: state.joinCode ?? initialJoinCode ?? null,
      avatar
    };

    setIsProfileUpdating(true);

    try {
      await updateRemoteProfile({ locale: nextLocale });
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextState));
      setState(nextState);
      setParticipantReady(false);

      if (nextLocale !== locale) {
        router.push(buildGuestWelcomePath(nextLocale, nextState.joinCode ?? undefined));
      }
    } catch (error) {
      setNameError(error instanceof Error ? error.message : content.screens.errors.network);
    } finally {
      setIsProfileUpdating(false);
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
        content.screens.errors.network
      );
    }

    const snapshot = payload as RemoteGuestSnapshot;
    if (snapshot.participant) {
      setParticipantId(snapshot.participant.id);
      setParticipantReady(snapshot.participant.isReady);
      setAvatar(snapshot.participant.avatar);
    }
    return snapshot;
  }

  async function submitName() {
    if (isJoining || isProfileUpdating) {
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
        if (participantId) {
          await updateRemoteProfile({ displayName: trimmed });
        } else {
          await joinRemoteParty(trimmed);
        }
        setParticipantReady(false);
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

  async function reconcileParticipant() {
    if (!remoteEnabled || !participantId) {
      return;
    }

    const response = await fetch("/api/party/session", {
      headers: { accept: "application/json" },
      cache: "no-store",
    }).catch(() => null);

    if (!response?.ok) {
      return;
    }

    const snapshot = (await response.json()) as RemoteGuestSnapshot;
    if (snapshot.participant) {
      setAvatar(snapshot.participant.avatar);
      setParticipantReady(snapshot.participant.isReady);
    }
  }

  async function savePhotoAvatar(
    file: File,
    options: {
      signal: AbortSignal;
      onProgress: (progress: AvatarUploadProgress) => void;
    },
  ): Promise<ParticipantAvatarProjection | null> {
    if (!remoteEnabled) {
      const localFallback: ParticipantAvatarProjection = {
        type: "photo",
        url: await blobToDataUrl(file)
      };
      setAvatar(localFallback);
      return localFallback;
    }

    try {
      const payload = await uploadPreparedAvatar(file, options);
      const savedAvatar = payload.participant.avatar as ParticipantAvatarProjection;
      setAvatar(savedAvatar);
      setParticipantReady(false);
      return savedAvatar;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        await reconcileParticipant();
      } else {
        throw new Error(content.screens.partyPhoto.validation.uploadFailed);
      }
      throw error;
    }
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
      throw new Error(content.screens.partyPhoto.validation.uploadFailed);
    }

    setAvatar(payload.participant.avatar);
    setParticipantReady(false);
    return payload.participant.avatar;
  }

  async function goBack() {
    if (isAvatarBusy || isProfileUpdating || isJoining) {
      return;
    }

    const previousStep: Partial<Record<OnboardingStep, OnboardingStep>> = {
      language: "welcome",
      name: "language",
      partyPhoto: "name",
      howToPlay: "partyPhoto",
      ready: "howToPlay",
      quizPlaceholder: "ready",
    };
    const nextStep = previousStep[step];

    if (!nextStep) {
      return;
    }

    if (participantReady) {
      setIsProfileUpdating(true);
      try {
        await updateReadiness(false);
      } catch (error) {
        setNameError(error instanceof Error ? error.message : content.screens.errors.network);
        return;
      } finally {
        setIsProfileUpdating(false);
      }
    }

    goToStep(nextStep);
  }

  async function markReadyAndPlay() {
    if (isProfileUpdating || isJoining) {
      return;
    }

    setIsProfileUpdating(true);
    try {
      await updateReadiness(true);
      router.push(buildGuestPlayPath(locale, joinCode));
    } catch (error) {
      setNameError(error instanceof Error ? error.message : content.screens.errors.network);
    } finally {
      setIsProfileUpdating(false);
    }
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
                  onClick={() => void switchLanguage(targetLocale)}
                  disabled={isProfileUpdating}
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

      {step !== "welcome" ? (
        <div className="flex min-h-11 flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-28 justify-start px-3"
            onClick={() => void goBack()}
            disabled={isAvatarBusy || isProfileUpdating || isJoining}
            data-testid="onboarding-back"
          >
            <ArrowLeft aria-hidden="true" />
            {content.screens.onboardingNavigation.back}
          </Button>
          {isAvatarBusy ? (
            <p className="text-sm font-bold text-muted-foreground" role="status">
              {content.screens.onboardingNavigation.backDuringUpload}
            </p>
          ) : null}
        </div>
      ) : null}

      {nameError && step !== "name" ? (
        <div
          className="rounded-[1rem] border border-party-red/30 bg-party-red/10 px-4 py-3 text-sm font-bold text-foreground"
          role="alert"
          data-testid="onboarding-error"
        >
          {nameError}
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
            onSelect={(nextLocale) => void chooseLanguage(nextLocale)}
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
            disabled={isJoining || isProfileUpdating}
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
            onBusyChange={setIsAvatarBusy}
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
            disabled={isProfileUpdating}
            onStartQuiz={() => void markReadyAndPlay()}
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
