"use client";

import { ArrowLeft, Check, LockKeyhole, Timer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { ParticipantAvatar } from "@/components/party/participant-avatar";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import type { ParticipantAvatarProjection } from "@/lib/party-avatar";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import {
  useGuestProjection,
  usePartyActions
} from "@/lib/party-runtime/runtime-provider";

type GuestControllerProps = {
  locale: Locale;
  guestId: string | null;
  displayName: string | null;
  avatar?: ParticipantAvatarProjection | null;
};

function seconds(remainingMs: number) {
  return Math.ceil(remainingMs / 1000);
}

function phaseLabel(phase: string, copy: ReturnType<typeof getPartyUiCopy>) {
  switch (phase) {
    case "lobby":
      return copy.lobbyTitle;
    case "question_ready":
      return copy.getReady;
    case "question_active":
      return copy.questionActive;
    case "question_locked":
      return copy.answersLocked;
    case "answer_reveal":
      return copy.answerReveal;
    case "leaderboard":
      return copy.leaderboard;
    case "waiting_for_host":
      return copy.waitingHost;
    case "finished":
      return copy.finished;
    default:
      return phase;
  }
}

export function GuestController({ locale, guestId, displayName, avatar }: GuestControllerProps) {
  const copy = getPartyUiCopy(locale);
  const actions = usePartyActions();
  const effectiveGuestId = guestId ?? "missing-guest";
  const projection = useGuestProjection(effectiveGuestId);
  const [draft, setDraft] = useState<{
    questionId: string | null;
    selectedOptionId: string | null;
    error: string;
  }>({ questionId: null, selectedOptionId: null, error: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const question = projection.currentQuestion;

  useEffect(() => {
    if (guestId && displayName) {
      actions.registerGuest(guestId, displayName, locale, avatar);
    }
  }, [actions, avatar, displayName, guestId, locale]);

  const revealMessage = useMemo(() => {
    if (!projection.reveal) {
      return null;
    }

    if (projection.reveal.status === "correct") {
      return copy.correct;
    }

    if (projection.reveal.status === "incorrect") {
      return copy.incorrect;
    }

    return copy.timeout;
  }, [copy, projection.reveal]);

  if (!guestId || !displayName) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone="blue" className="w-full text-center">
          <div className="space-y-5">
            <BirthdayBadge tone="blue">{copy.developmentLabel}</BirthdayBadge>
            <h1 className="font-display text-4xl font-extrabold text-foreground">
              {copy.joinRequiredTitle}
            </h1>
            <p className="text-base font-bold leading-7 text-muted-foreground">
              {copy.joinRequiredDescription}
            </p>
            <Button asChild>
              <Link href={`/${locale}`}>
                <ArrowLeft aria-hidden="true" />
                {copy.backToWelcome}
              </Link>
            </Button>
          </div>
        </PaperPanel>
      </section>
    );
  }

  if (projection.phase === "finished") {
    return (
      <section
        className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center py-4"
        data-testid="guest-controller"
      >
        <PaperPanel tone="celebration" className="w-full text-center">
          <div className="space-y-5">
            <div className="flex justify-center">
              <ParticipantAvatar avatar={avatar} displayName={displayName} size="xl" />
            </div>
            <BirthdayBadge tone="blue">{displayName}</BirthdayBadge>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-foreground">
              {copy.finished}
            </h1>
            <p className="text-lg font-extrabold text-muted-foreground">
              {copy.personalScore}: {projection.score}/{projection.totalQuestions}
            </p>
          </div>
        </PaperPanel>
      </section>
    );
  }

  function submit() {
    const selectedOptionId =
      draft.questionId === question?.id ? draft.selectedOptionId : null;

    if (!question || !selectedOptionId || !guestId) {
      return;
    }

    setIsSubmitting(true);
    const result = actions.submitResponse(
      guestId,
      question.id,
      selectedOptionId,
      `${guestId}:${question.id}:${selectedOptionId}`
    );

    setIsSubmitting(false);

    if (!result.ok) {
      setDraft((current) => ({ ...current, error: result.error.message }));
    }
  }

  const locked = projection.lockedResponse;
  const canChangeSelection = projection.canAnswer && !locked && !isSubmitting;
  const selectedOptionId = draft.questionId === question?.id ? draft.selectedOptionId : null;
  const error = draft.questionId === question?.id ? draft.error : "";
  const showAnswerOptions =
    Boolean(question) && projection.phase !== "question_ready" && projection.phase !== "lobby";
  const showSubmitAction =
    Boolean(question) &&
    showAnswerOptions &&
    projection.phase === "question_active" &&
    !locked &&
    !projection.reveal;
  const statusMessages = [
    error,
    revealMessage,
    locked && !projection.reveal
      ? locked.status === "locked_timeout"
        ? copy.timeout
        : copy.locked
      : "",
    projection.phase === "question_locked" ? copy.waitingReveal : ""
  ].filter((message): message is string => Boolean(message));
  const statusTone =
    error
      ? "border-party-red/30 bg-party-red/10"
      : revealMessage || projection.phase === "question_locked"
        ? "border-party-orange/30 bg-surface-highlight/70"
        : "border-party-blue/25 bg-surface-sky/60";

  return (
    <section
      className="mx-auto flex min-h-0 min-h-[calc(100dvh-var(--safe-page-y)-var(--safe-page-y))] max-w-xl items-center py-0 sm:max-w-3xl sm:py-4"
      data-testid="guest-controller"
    >
      <PaperPanel
        tone="paper"
        className="w-full p-3 [@media(max-height:700px)]:p-2.5 [@media(max-height:620px)]:p-2 sm:p-7"
      >
        <div className="space-y-3 [@media(max-height:700px)]:space-y-2 [@media(max-height:620px)]:space-y-1.5 sm:space-y-5">
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <ParticipantAvatar avatar={avatar} displayName={displayName} size="sm" />
              <BirthdayBadge className="min-h-7 min-w-0 px-2.5 py-0.5" tone="blue">
                <span className="truncate">{displayName}</span>
              </BirthdayBadge>
            </div>
            <BirthdayBadge tone={projection.remainingMs <= 5000 ? "coral" : "yellow"}>
              <Timer className="h-4 w-4" aria-hidden="true" />
              {projection.phase === "question_active"
                ? `${seconds(projection.remainingMs)}s`
                : phaseLabel(projection.phase, copy)}
            </BirthdayBadge>
          </div>

          <div className="space-y-2 [@media(max-height:700px)]:space-y-1">
            <p className="text-sm font-extrabold uppercase text-muted-foreground [@media(max-height:620px)]:text-xs">
              {projection.questionNumber
                ? `${projection.questionNumber}/${projection.totalQuestions}`
                : copy.developmentLabel}
            </p>
            <h1 className="font-display text-[1.55rem] font-extrabold leading-[1.05] text-foreground [@media(max-height:620px)]:text-[1.35rem] [@media(max-height:700px)]:text-[1.45rem] sm:text-5xl">
              {question ? question.prompt[locale] : phaseLabel(projection.phase, copy)}
            </h1>
          </div>

          {question && !showAnswerOptions ? (
            <div className="rounded-[1rem] border border-party-blue/25 bg-surface-sky/55 p-3 text-sm font-extrabold leading-6 text-foreground [@media(max-height:620px)]:p-2.5 [@media(max-height:700px)]:leading-5">
              {copy.waitingChoices}
            </div>
          ) : null}

          {question && showAnswerOptions ? (
            <div
              className="grid gap-2 [@media(max-height:620px)]:gap-1.5 sm:gap-3"
              role="radiogroup"
              aria-label={copy.selectAnswer}
            >
              {question.options.map((option) => {
                const selected = selectedOptionId === option.id;
                const wasLocked = locked?.selectedOptionId === option.id;
                const isCorrect = projection.reveal?.correctOptionId === option.id;
                const isWrongReveal =
                  projection.reveal?.status === "incorrect" &&
                  projection.reveal.selectedOptionId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected || wasLocked}
                    disabled={!canChangeSelection}
                    onClick={() =>
                      setDraft({
                        questionId: question.id,
                        selectedOptionId: option.id,
                        error: ""
                      })
                    }
                    className={`min-h-11 rounded-[1rem] border px-3 py-2 text-left text-sm font-extrabold leading-5 shadow-lift transition [@media(max-height:620px)]:leading-[1.15] sm:min-h-14 sm:px-4 sm:py-3 sm:text-base ${
                      isCorrect
                        ? "border-party-green/50 bg-party-green/18"
                        : isWrongReveal
                          ? "border-party-red/45 bg-party-red/10"
                          : selected || wasLocked
                            ? "border-party-blue-deep bg-surface-sky"
                            : "border-border bg-surface-paper"
                    } disabled:cursor-not-allowed disabled:opacity-90`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      {option.label[locale]}
                      {wasLocked ? <LockKeyhole className="h-5 w-5" aria-hidden="true" /> : null}
                      {selected && !wasLocked ? <Check className="h-5 w-5" aria-hidden="true" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="min-h-11 [@media(max-height:620px)]:min-h-9" aria-live="polite">
            {statusMessages.length > 0 ? (
              <div
                className={`rounded-[1rem] border p-2.5 text-sm font-bold leading-5 sm:p-4 sm:text-base sm:leading-7 ${statusTone}`}
                role={error ? "alert" : "status"}
              >
                {statusMessages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid min-h-11 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm font-bold text-muted-foreground [@media(max-height:620px)]:text-xs">
              {copy.personalScore}: {projection.score}/{projection.totalQuestions}
            </p>
            {showSubmitAction ? (
              <Button
                type="button"
                disabled={!projection.canAnswer || !selectedOptionId || isSubmitting}
                onClick={submit}
                data-testid="guest-submit-answer"
                className="w-full sm:w-auto"
              >
                {isSubmitting ? copy.submitting : copy.submit}
              </Button>
            ) : null}
          </div>
        </div>
      </PaperPanel>
    </section>
  );
}
