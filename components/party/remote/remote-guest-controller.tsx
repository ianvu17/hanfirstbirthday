"use client";

import { ArrowLeft, Download, Timer, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PaperPanel } from "@/components/design/paper-panel";
import { ConnectionStatusBadge } from "@/components/party/connection-status-badge";
import { GuestAnswerOptions } from "@/components/party/guest-answer-options";
import { ParticipantAvatar } from "@/components/party/participant-avatar";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import type { ParticipantAvatarProjection } from "@/lib/party-avatar";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import { useRemotePartySnapshot } from "@/lib/party-remote/use-remote-party";
import { useAuthoritativeCountdown } from "@/lib/party-runtime/use-authoritative-countdown";
import type { RemoteGuestSnapshot, RemoteNoSessionSnapshot } from "@/lib/party-remote/types";

type RemoteGuestControllerProps = {
  locale: Locale;
  displayName: string | null;
  joinCode?: string;
  avatar?: ParticipantAvatarProjection | null;
};

const pendingJoins = new Map<string, Promise<{ ok: boolean; payload: unknown }>>();

function joinKey(displayName: string, locale: Locale, joinCode?: string) {
  return `${locale}:${displayName}:${joinCode ?? ""}`;
}

function joinOnce(displayName: string, locale: Locale, joinCode?: string) {
  const key = joinKey(displayName, locale, joinCode);
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
    body: JSON.stringify({ displayName, locale, joinCode })
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

export function RemoteGuestController({
  locale,
  displayName,
  joinCode,
  avatar
}: RemoteGuestControllerProps) {
  const copy = getPartyUiCopy(locale);
  const { snapshot, connection, error, refresh, applySnapshot } =
    useRemotePartySnapshot<RemoteGuestSnapshot | RemoteNoSessionSnapshot>(true);
  const [joinError, setJoinError] = useState<{
    sessionId: string | null;
    message: string;
  }>({ sessionId: null, message: "" });
  const [isJoining, setIsJoining] = useState(false);
  const [draft, setDraft] = useState<{
    sessionId: string | null;
    questionId: string | null;
    selectedOptionId: string | null;
    error: string;
  }>({ sessionId: null, questionId: null, selectedOptionId: null, error: "" });
  const [submittingState, setSubmittingState] = useState<{
    sessionId: string | null;
    value: boolean;
  }>({ sessionId: null, value: false });
  const projection = snapshot?.session && "guest" in snapshot ? snapshot.guest : null;
  const participant = snapshot?.session && "participant" in snapshot ? snapshot.participant : null;
  const effectiveDisplayName = participant?.displayName ?? displayName;
  const effectiveAvatar = participant?.avatar ?? avatar ?? null;
  const question = projection?.currentQuestion ?? null;
  const sessionId = snapshot?.session?.id ?? null;
  const isSubmitting = submittingState.sessionId === sessionId && submittingState.value;
  const activeJoinError = joinError.sessionId === sessionId ? joinError.message : "";
  const activeDraft =
    draft.sessionId === sessionId
      ? draft
      : { sessionId, questionId: null, selectedOptionId: null, error: "" };
  const countdown = useAuthoritativeCountdown({
    deadlineAt: projection?.questionDeadlineAt ?? null,
    serverNow: snapshot?.serverNow ?? null,
    active: projection?.phase === "question_active"
  });

  useEffect(() => {
    if (!displayName || participant || isJoining || activeJoinError) {
      return;
    }

    const joiningDisplayName = displayName;
    let cancelled = false;

    async function join() {
      setIsJoining(true);
      setJoinError({ sessionId, message: "" });

      try {
        const { ok, payload } = await joinOnce(joiningDisplayName, locale, joinCode);

        if (cancelled) {
          return;
        }

        if (!ok) {
          setJoinError({
            sessionId,
            message:
              (payload as { error?: { message?: string } }).error?.message ??
              copy.joinRequiredDescription
          });
          return;
        }

        applySnapshot(payload as RemoteGuestSnapshot);
      } catch {
        if (!cancelled) {
          setJoinError({ sessionId, message: copy.stale });
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
  }, [
    activeJoinError,
    applySnapshot,
    copy.joinRequiredDescription,
    copy.stale,
    displayName,
    isJoining,
    joinCode,
    locale,
    participant,
    sessionId
  ]);

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
      activeDraft.questionId === question?.id ? activeDraft.selectedOptionId : null;

    if (!question || !selectedOptionId || !participant) {
      return;
    }

    setSubmittingState({ sessionId, value: true });
    setDraft((current) => ({ ...current, sessionId, error: "" }));

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
          sessionId,
          error: payload.error?.message ?? copy.timeout
        }));
        void refresh();
        return;
      }

      applySnapshot(payload as RemoteGuestSnapshot);
    } finally {
      setSubmittingState({ sessionId, value: false });
    }
  }

  if (!effectiveDisplayName && snapshot?.session) {
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

  if (snapshot && !snapshot.session) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone="paper" className="w-full text-center">
          <div className="space-y-4">
            <BirthdayBadge tone="yellow">{copy.remoteProductionSession}</BirthdayBadge>
            <h1 className="font-display text-4xl font-extrabold text-foreground">
              {copy.noActiveSession}
            </h1>
            <p className="font-bold text-muted-foreground">
              {copy.noActiveSessionDescription}
            </p>
          </div>
        </PaperPanel>
      </section>
    );
  }

  if (!projection || !participant) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
          <PaperPanel tone={activeJoinError || error ? "warm" : "paper"} className="w-full text-center">
          <div className="space-y-4">
            <LoadingTreatment />
            <h1 className="font-display text-4xl font-extrabold text-foreground">
              {isJoining ? copy.connecting : copy.lobbyTitle}
            </h1>
            <p className="font-bold text-muted-foreground">
              {activeJoinError || error?.message || copy.guestLobbyDescription}
            </p>
          </div>
        </PaperPanel>
      </section>
    );
  }

  if (projection.phase === "finished") {
    const winner = projection.winner;
    const isWinner = projection.finalRank === 1;

    return (
      <section
        className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center py-4"
        data-testid="guest-controller"
      >
        <PaperPanel tone="celebration" className="w-full text-center">
          <div className="space-y-5">
            <div className="flex justify-center">
              <ParticipantAvatar avatar={effectiveAvatar} displayName={participant.displayName} size="xl" />
            </div>
            <BirthdayBadge tone={isWinner ? "yellow" : "blue"}>
              <Trophy className="h-4 w-4" aria-hidden="true" />
              {isWinner ? copy.mastermindTitle : copy.finalResults}
            </BirthdayBadge>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-foreground">
              {isWinner ? copy.youAreMastermind : copy.thanksForPlaying}
            </h1>
            <p className="text-lg font-extrabold text-muted-foreground">
              {copy.personalScore}: {projection.score}/{projection.totalQuestions}
            </p>
            {!isWinner && winner ? (
              <p className="font-bold text-muted-foreground">
                {copy.winner}: <span className="text-foreground">{winner.displayName}</span>
              </p>
            ) : null}
            {isWinner ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="/api/party/certificate" download>
                  <Download aria-hidden="true" />
                  {copy.downloadCertificate}
                </a>
              </Button>
            ) : null}
          </div>
        </PaperPanel>
      </section>
    );
  }

  const locked = projection.lockedResponse;
  const canChangeSelection = projection.canAnswer && !locked && !isSubmitting;
  const selectedOptionId =
    activeDraft.questionId === question?.id ? activeDraft.selectedOptionId : null;
  const localError = activeDraft.questionId === question?.id ? activeDraft.error : "";
  const showAnswerOptions =
    Boolean(question) && projection.phase !== "question_ready" && projection.phase !== "lobby";
  const showSubmitAction =
    Boolean(question) &&
    showAnswerOptions &&
    projection.phase === "question_active" &&
    !locked &&
    !projection.reveal;
  const connectionMessage =
    connection === "connected" ? "" : `${copy.connection}: ${copy[connection]}`;
  const statusMessages = [
    localError,
    connectionMessage,
    revealMessage,
    locked && !projection.reveal
      ? locked.status === "locked_timeout"
        ? copy.timeout
        : copy.locked
      : "",
    projection.phase === "question_locked" ? copy.waitingReveal : ""
  ].filter((message): message is string => Boolean(message));
  const statusTone =
    localError || connection === "offline" || connection === "error"
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
              <ParticipantAvatar avatar={effectiveAvatar} displayName={participant.displayName} size="sm" />
              <BirthdayBadge className="min-h-7 min-w-0 px-2.5 py-0.5" tone="blue">
                <span className="truncate">{participant.displayName}</span>
              </BirthdayBadge>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <BirthdayBadge tone={countdown.remainingMs <= 5000 ? "coral" : "yellow"}>
                <Timer className="h-4 w-4" aria-hidden="true" />
                {projection.phase === "question_active"
                  ? <span data-testid="party-countdown">{countdown.remainingSeconds}s</span>
                  : phaseLabel(projection.phase, copy)}
              </BirthdayBadge>
              {connection === "connected" ? null : (
                <ConnectionStatusBadge connection={connection} copy={copy} />
              )}
            </div>
          </div>

          <div className="space-y-2 [@media(max-height:700px)]:space-y-1">
            <p className="text-sm font-extrabold uppercase text-muted-foreground [@media(max-height:620px)]:text-xs">
              {projection.questionNumber
                ? `${projection.questionNumber}/${projection.totalQuestions}`
                : copy.lobbyTitle}
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
            <GuestAnswerOptions
              question={question}
              locale={locale}
              copy={copy}
              projection={projection}
              selectedOptionId={selectedOptionId}
              canChangeSelection={canChangeSelection}
              onSelect={(optionId) =>
                setDraft({
                  sessionId,
                  questionId: question.id,
                  selectedOptionId: optionId,
                  error: ""
                })
              }
            />
          ) : null}

          <div className="min-h-11 [@media(max-height:620px)]:min-h-9" aria-live="polite">
            {statusMessages.length > 0 ? (
              <div
                className={`rounded-[1rem] border p-2.5 text-sm font-bold leading-5 sm:p-4 sm:text-base sm:leading-7 ${statusTone}`}
                role={localError ? "alert" : "status"}
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
                disabled={!projection.canAnswer || !selectedOptionId || isSubmitting || connection === "offline"}
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
