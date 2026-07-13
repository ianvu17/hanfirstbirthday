"use client";

import { ArrowLeft, Check, LockKeyhole, Timer, WifiOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PaperPanel } from "@/components/design/paper-panel";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import { useRemotePartySnapshot } from "@/lib/party-remote/use-remote-party";
import type { RemoteGuestSnapshot } from "@/lib/party-remote/types";

type RemoteGuestControllerProps = {
  locale: Locale;
  displayName: string | null;
};

const pendingJoins = new Map<string, Promise<{ ok: boolean; payload: unknown }>>();

function joinKey(displayName: string, locale: Locale) {
  return `${locale}:${displayName}`;
}

function joinOnce(displayName: string, locale: Locale) {
  const key = joinKey(displayName, locale);
  const pending = pendingJoins.get(key);

  if (pending) {
    return pending;
  }

  const request = fetch("/api/party/join", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({ displayName, locale })
  })
    .then(async (response) => ({
      ok: response.ok,
      payload: await response.json()
    }))
    .finally(() => {
      pendingJoins.delete(key);
    });

  pendingJoins.set(key, request);
  return request;
}

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

export function RemoteGuestController({ locale, displayName }: RemoteGuestControllerProps) {
  const copy = getPartyUiCopy(locale);
  const { snapshot, connection, error, refresh, applySnapshot } =
    useRemotePartySnapshot<RemoteGuestSnapshot>(true);
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [draft, setDraft] = useState<{
    questionId: string | null;
    selectedOptionId: string | null;
    error: string;
  }>({ questionId: null, selectedOptionId: null, error: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const projection = snapshot?.guest ?? null;
  const participant = snapshot?.participant ?? null;
  const question = projection?.currentQuestion ?? null;

  useEffect(() => {
    if (!displayName || participant || isJoining) {
      return;
    }

    const joiningDisplayName = displayName;
    let cancelled = false;

    async function join() {
      setIsJoining(true);
      setJoinError("");

      try {
        const { ok, payload } = await joinOnce(joiningDisplayName, locale);

        if (cancelled) {
          return;
        }

        if (!ok) {
          setJoinError(
            (payload as { error?: { message?: string } }).error?.message ??
              copy.joinRequiredDescription
          );
          return;
        }

        applySnapshot(payload as RemoteGuestSnapshot);
      } catch {
        if (!cancelled) {
          setJoinError(copy.stale);
        }
      } finally {
        if (!cancelled) {
          setIsJoining(false);
        }
      }
    }

    void join();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot, copy.joinRequiredDescription, copy.stale, displayName, isJoining, locale, participant]);

  const revealMessage = useMemo(() => {
    if (!projection?.reveal) {
      return null;
    }

    if (projection.reveal.status === "correct") {
      return copy.correct;
    }

    if (projection.reveal.status === "incorrect") {
      return copy.incorrect;
    }

    return copy.timeout;
  }, [copy, projection?.reveal]);

  async function submit() {
    const selectedOptionId =
      draft.questionId === question?.id ? draft.selectedOptionId : null;

    if (!question || !selectedOptionId || !participant) {
      return;
    }

    setIsSubmitting(true);
    setDraft((current) => ({ ...current, error: "" }));

    try {
      const response = await fetch("/api/party/response", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({
          selectedOptionId,
          submissionId: `${participant.id}:${question.id}:${selectedOptionId}`
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        setDraft((current) => ({
          ...current,
          error: payload.error?.message ?? copy.timeout
        }));
        void refresh();
        return;
      }

      applySnapshot(payload as RemoteGuestSnapshot);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!displayName) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone="blue" className="w-full text-center">
          <div className="space-y-5">
            <BirthdayBadge tone="blue">{copy.connected}</BirthdayBadge>
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

  if (!projection || !participant) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone={joinError || error ? "warm" : "paper"} className="w-full text-center">
          <div className="space-y-4">
            <LoadingTreatment />
            <h1 className="font-display text-4xl font-extrabold text-foreground">
              {isJoining ? copy.connecting : copy.lobbyTitle}
            </h1>
            <p className="font-bold text-muted-foreground">
              {joinError || error?.message || copy.lobbyDescription}
            </p>
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
            <BirthdayBadge tone="blue">{participant.displayName}</BirthdayBadge>
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

  const locked = projection.lockedResponse;
  const canChangeSelection = projection.canAnswer && !locked && !isSubmitting;
  const selectedOptionId = draft.questionId === question?.id ? draft.selectedOptionId : null;
  const localError = draft.questionId === question?.id ? draft.error : "";

  return (
    <section
      className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center py-4"
      data-testid="guest-controller"
    >
      <PaperPanel tone="paper" className="w-full">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BirthdayBadge tone="blue">{participant.displayName}</BirthdayBadge>
            <div className="flex flex-wrap gap-2">
              <BirthdayBadge tone={projection.remainingMs <= 5000 ? "coral" : "yellow"}>
                <Timer className="h-4 w-4" aria-hidden="true" />
                {projection.phase === "question_active"
                  ? `${seconds(projection.remainingMs)}s`
                  : phaseLabel(projection.phase, copy)}
              </BirthdayBadge>
              <BirthdayBadge tone={connection === "connected" ? "blue" : "coral"}>
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                {copy[connection]}
              </BirthdayBadge>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-extrabold uppercase text-muted-foreground">
              {projection.questionNumber
                ? `${projection.questionNumber}/${projection.totalQuestions}`
                : copy.lobbyTitle}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
              {question ? question.prompt[locale] : phaseLabel(projection.phase, copy)}
            </h1>
          </div>

          {question ? (
            <div className="grid gap-3" role="radiogroup" aria-label={copy.selectAnswer}>
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
                    className={`min-h-14 rounded-[1rem] border px-4 py-3 text-left text-base font-extrabold shadow-lift transition ${
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

          {revealMessage ? (
            <div className="rounded-[1rem] border border-party-orange/30 bg-surface-highlight/70 p-4 font-bold leading-7">
              {revealMessage}
            </div>
          ) : null}

          {locked && !projection.reveal ? (
            <div className="rounded-[1rem] border border-party-blue/25 bg-surface-sky/60 p-4 font-bold">
              {locked.status === "locked_timeout" ? copy.timeout : copy.locked}
            </div>
          ) : null}

          {localError ? (
            <p className="rounded-[0.9rem] border border-party-red/30 bg-party-red/10 p-3 text-sm font-bold text-foreground" role="alert">
              {localError}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-sm font-bold text-muted-foreground">
              {copy.personalScore}: {projection.score}/{projection.totalQuestions}
            </p>
            <Button
              type="button"
              disabled={!projection.canAnswer || !selectedOptionId || isSubmitting || connection === "offline"}
              onClick={submit}
              data-testid="guest-submit-answer"
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>
          </div>
        </div>
      </PaperPanel>
    </section>
  );
}
