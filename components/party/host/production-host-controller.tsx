"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LockKeyhole,
  PartyPopper,
} from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PaperPanel } from "@/components/design/paper-panel";
import { ConnectionStatusBadge } from "@/components/party/connection-status-badge";
import { ParticipantAvatar } from "@/components/party/participant-avatar";
import { Button } from "@/components/ui/button";
import {
  getAvailableSessionQuestionCounts,
  getDefaultSessionQuestionCount,
  selectHostCapabilities,
  type HostCapabilities,
  type PartyPhase,
} from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import { useAuthoritativeCountdown } from "@/lib/party-runtime/use-authoritative-countdown";
import type { RuntimePartyCommand } from "@/lib/party-runtime/runtime-contract";
import { useRemotePartySnapshot } from "@/lib/party-remote/use-remote-party";
import type {
  RemoteNoSessionSnapshot,
  RemotePartySnapshot,
  SessionHistoryItem,
  SessionManagementSnapshot,
} from "@/lib/party-remote/types";

type HostStatus = {
  configured: boolean;
  authorized: boolean;
};

function nextAction(
  phase: PartyPhase,
  capabilities: HostCapabilities,
  copy: ReturnType<typeof getPartyUiCopy>,
  isFinalQuestion: boolean,
): {
  label: string;
  command: RuntimePartyCommand["type"];
  confirm?: boolean;
} | null {
  if (capabilities.canPrepareFirstQuestion) {
    return { label: copy.prepareFirst, command: "PREPARE_FIRST_QUESTION" };
  }

  if (capabilities.canRevealChoices) {
    return { label: copy.revealChoices, command: "REVEAL_CHOICES" };
  }

  if (capabilities.canRevealAnswer) {
    return { label: copy.revealAnswer, command: "REVEAL_ANSWER" };
  }

  if (capabilities.canShowLeaderboard) {
    return { label: copy.showLeaderboard, command: "SHOW_LEADERBOARD" };
  }

  if (capabilities.canAdvanceFromLeaderboard) {
    return {
      label: isFinalQuestion ? copy.showWinner : copy.nextQuestion,
      command: "ADVANCE_FROM_LEADERBOARD",
    };
  }

  if (capabilities.canPrepareNextQuestion) {
    return { label: copy.prepareNext, command: "PREPARE_NEXT_QUESTION" };
  }

  if (capabilities.canFinishParty || phase === "lobby") {
    return { label: copy.finishParty, command: "FINISH_PARTY", confirm: true };
  }

  return null;
}

export function ProductionHostController({
  locale,
  availableQuestionCount,
}: {
  locale: Locale;
  availableQuestionCount: number;
}) {
  const copy = getPartyUiCopy(locale);
  const { snapshot, connection, error, refresh, applySnapshot } =
    useRemotePartySnapshot<RemotePartySnapshot | RemoteNoSessionSnapshot>(
      false,
    );
  const [hostStatus, setHostStatus] = useState<HostStatus | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionHistoryItem[]>(
    [],
  );
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [pending, setPending] = useState(false);
  const [commandMessage, setCommandMessage] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmUnreadyStart, setConfirmUnreadyStart] = useState(false);
  const [questionCount, setQuestionCount] = useState(
    getDefaultSessionQuestionCount(availableQuestionCount),
  );
  const questionCountOptions = getAvailableSessionQuestionCounts(
    availableQuestionCount,
  );
  const prefersReducedMotion = useReducedMotion();
  const [readyLeaderboardIdentity, setReadyLeaderboardIdentity] = useState<
    string | null
  >(null);
  const leaderboardPhase = snapshot?.session ? snapshot.projection.phase : null;
  const leaderboardQuestionId = snapshot?.session
    ? (snapshot.projection.currentQuestion?.id ?? null)
    : null;
  const leaderboardSessionId = snapshot?.session?.id ?? null;
  const leaderboardIdentity =
    leaderboardSessionId && leaderboardQuestionId
      ? `${leaderboardSessionId}:${leaderboardQuestionId}`
      : null;
  const leaderboardAnimationReady =
    leaderboardPhase !== "leaderboard" ||
    Boolean(prefersReducedMotion) ||
    readyLeaderboardIdentity === leaderboardIdentity;

  useEffect(() => {
    if (
      leaderboardIdentity &&
      leaderboardPhase === "leaderboard" &&
      !prefersReducedMotion
    ) {
      const timer = window.setTimeout(
        () => setReadyLeaderboardIdentity(leaderboardIdentity),
        2_600,
      );
      return () => window.clearTimeout(timer);
    }
  }, [leaderboardIdentity, prefersReducedMotion, leaderboardPhase]);

  async function loadSessionManagement() {
    const response = await fetch("/api/party/sessions", { cache: "no-store" });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as SessionManagementSnapshot;
    setRecentSessions(payload.recentSessions);
    applySnapshot(payload.current);
  }

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("/api/party/host/status", {
        cache: "no-store",
      });
      const status = (await response.json()) as HostStatus;
      setHostStatus(status);
    }

    void loadStatus();
  }, []);

  useEffect(() => {
    if (!hostStatus?.authorized) {
      return;
    }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      const response = await fetch("/api/party/sessions", {
        cache: "no-store",
      });

      if (!response.ok || cancelled) {
        return;
      }

      const payload = (await response.json()) as SessionManagementSnapshot;
      setRecentSessions(payload.recentSessions);
      applySnapshot(payload.current);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [applySnapshot, hostStatus?.authorized]);

  const capabilities = useMemo(
    () =>
      snapshot?.session
        ? selectHostCapabilities({
            sessionId: snapshot.session.id,
            phase: snapshot.projection.phase,
            currentQuestionIndex:
              snapshot.projection.questionNumber === null
                ? null
                : snapshot.projection.questionNumber - 1,
            currentQuestionId: snapshot.projection.currentQuestion?.id ?? null,
            totalQuestions: snapshot.projection.totalQuestions,
            questionOpenedAt: null,
            questionDeadlineAt: null,
            questionLockedAt: null,
            answerRevealedAt: null,
            responses: {},
            guests: {},
            revision: snapshot.session.revision,
            lastAcceptedCommand: null,
            lastError: null,
          })
        : null,
    [snapshot],
  );
  const action =
    snapshot?.session && capabilities
      ? nextAction(
          snapshot.projection.phase,
          capabilities,
          copy,
          snapshot.projection.questionNumber ===
            snapshot.projection.totalQuestions,
        )
      : null;

  const countdown = useAuthoritativeCountdown({
    deadlineAt: snapshot?.session
      ? snapshot.projection.questionDeadlineAt
      : null,
    serverNow: snapshot?.serverNow ?? null,
    active: snapshot?.session
      ? snapshot.projection.phase === "question_active"
      : false,
    maxVisibleMs: snapshot?.session
      ? snapshot.projection.questionDurationMs
      : undefined,
  });

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setLoginError("");

    const response = await fetch("/api/party/host/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    setPending(false);

    if (!response.ok) {
      const payload = await response.json();
      setLoginError(payload.error?.message ?? "That PIN did not work.");
      return;
    }

    setHostStatus({ configured: true, authorized: true });
    setPin("");
    void loadSessionManagement();
  }

  async function mutateSession(body: Record<string, unknown>) {
    setPending(true);
    setCommandMessage("");

    const response = await fetch("/api/party/sessions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    setPending(false);

    if (!response.ok) {
      setCommandMessage(
        payload.error?.message ?? "That session action was not accepted.",
      );
      return;
    }

    const management = payload as SessionManagementSnapshot;
    setRecentSessions(management.recentSessions);
    applySnapshot(management.current);
    setCommandMessage(copy.connected);
  }

  function createSession() {
    void mutateSession({
      action: "create",
      idempotencyKey: `host-create:${globalThis.crypto.randomUUID()}`,
      label: `Session ${new Date().toLocaleString()}`,
      questionCount,
    });
  }

  function archiveSession(sessionId: string) {
    void mutateSession({
      action: "archive",
      sessionId,
    });
  }

  async function runCommand(command: RuntimePartyCommand["type"]) {
    if (!snapshot?.session) {
      return;
    }

    setPending(true);
    setCommandMessage("");

    const response = await fetch("/api/party/host/command", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        type: command,
        expectedRevision: snapshot.session.revision,
        commandId: `${snapshot.session.id}:${command}:${snapshot.session.revision}`,
      }),
    });
    const payload = await response.json();
    setPending(false);
    setConfirmFinish(false);
    setConfirmUnreadyStart(false);

    if (!response.ok || !payload.ok) {
      setCommandMessage(
        payload.error?.message ?? "That host action was not accepted.",
      );
      if (payload.snapshot) {
        applySnapshot(
          payload.snapshot as RemotePartySnapshot | RemoteNoSessionSnapshot,
        );
      } else {
        void refresh();
      }
      return;
    }

    applySnapshot(
      payload.snapshot as RemotePartySnapshot | RemoteNoSessionSnapshot,
    );
    setCommandMessage(copy.connected);
  }

  if (!hostStatus) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone="admin" className="w-full">
          <LoadingTreatment />
        </PaperPanel>
      </section>
    );
  }

  if (!hostStatus.authorized) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel tone="admin" className="w-full">
          <form className="space-y-5" onSubmit={login}>
            <BirthdayBadge tone={hostStatus.configured ? "blue" : "coral"}>
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              {copy.hostControls}
            </BirthdayBadge>
            <h1 className="font-display text-4xl font-extrabold text-foreground">
              {copy.hostTitle}
            </h1>
            <label className="grid gap-2 text-sm font-extrabold text-foreground">
              {copy.hostPinLabel}
              <input
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="min-h-14 rounded-[1rem] border border-border bg-surface-paper px-4 text-2xl font-extrabold shadow-inner outline-none focus-visible:ring-4 focus-visible:ring-focus-ring/40"
              />
            </label>
            {loginError || !hostStatus.configured ? (
              <p
                className="rounded-[0.9rem] border border-party-red/30 bg-party-red/10 p-3 text-sm font-bold"
                role="alert"
              >
                {loginError || copy.hostPinMissing}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={pending || !pin || !hostStatus.configured}
              className="w-full"
            >
              {pending ? copy.connecting : copy.unlockHost}
            </Button>
          </form>
        </PaperPanel>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center">
        <PaperPanel
          tone={error ? "warm" : "admin"}
          className="w-full text-center"
        >
          <div className="space-y-4">
            <LoadingTreatment />
            <p className="font-bold text-muted-foreground">
              {error?.message ?? copy.connecting}
            </p>
          </div>
        </PaperPanel>
      </section>
    );
  }

  const currentSession = snapshot.session;

  if (!currentSession) {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center pb-[env(safe-area-inset-bottom)]">
        <PaperPanel tone="admin" className="w-full">
          <div className="space-y-5">
            <div>
              <BirthdayBadge tone="yellow">{copy.hostControls}</BirthdayBadge>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-foreground">
                {copy.noActiveSession}
              </h1>
              <p className="mt-2 font-bold leading-7 text-muted-foreground">
                {copy.createNewSessionDescription}
              </p>
            </div>

            {commandMessage ? (
              <div
                className="flex gap-2 rounded-[0.9rem] border border-party-orange/30 bg-surface-highlight/70 p-3 text-sm font-bold"
                role="status"
              >
                <AlertCircle
                  className="h-5 w-5 text-party-red"
                  aria-hidden="true"
                />
                <span>{commandMessage}</span>
              </div>
            ) : null}

            <fieldset className="grid gap-3 rounded-[1rem] border border-party-blue/25 bg-surface-sky/55 p-4">
              <legend className="px-1 font-extrabold text-foreground">
                {copy.questionsThisSession}
              </legend>
              <p className="text-sm font-bold leading-6 text-muted-foreground">
                {copy.questionsThisSessionDescription}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {questionCountOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={questionCount === count}
                    onClick={() => setQuestionCount(count)}
                    className={`min-h-12 rounded-[0.9rem] border px-3 font-display text-xl font-extrabold shadow-lift transition ${
                      questionCount === count
                        ? "border-party-blue-deep bg-party-blue text-white"
                        : "border-border bg-surface-paper text-foreground"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </fieldset>

            <Button
              type="button"
              disabled={pending}
              onClick={createSession}
              className="min-h-16 w-full text-lg"
            >
              <PartyPopper aria-hidden="true" />
              {pending ? copy.submitting : copy.createNewSession}
            </Button>

            <SessionHistory
              copy={copy}
              sessions={recentSessions}
              onArchive={archiveSession}
              pending={pending}
            />
          </div>
        </PaperPanel>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center pb-[env(safe-area-inset-bottom)]">
      <PaperPanel tone="admin" className="w-full">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <BirthdayBadge tone={snapshot.session.isTest ? "yellow" : "blue"}>
                {snapshot.session.isTest
                  ? copy.testSession
                  : copy.productionSession}
              </BirthdayBadge>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-foreground">
                {copy.hostTitle}
              </h1>
            </div>
            <ConnectionStatusBadge connection={connection} copy={copy} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">
                {copy.phase}
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.projection.phase}
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">
                {copy.revision}
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.session.revision}
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">
                {copy.participants}
              </p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.projection.readyParticipantCount} {copy.readyOf}{" "}
                {snapshot.projection.participantCount}
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">
                {snapshot.projection.phase === "question_active"
                  ? copy.time
                  : copy.submitted}
              </p>
              <p className="mt-1 flex items-center gap-2 text-lg font-extrabold text-foreground">
                {snapshot.projection.phase === "question_active" ? (
                  <>
                    <Clock
                      className="h-4 w-4 text-party-orange"
                      aria-hidden="true"
                    />
                    <span data-testid="party-countdown">
                      {countdown.remainingSeconds}s
                    </span>
                  </>
                ) : (
                  snapshot.projection.submittedCount
                )}
              </p>
            </div>
          </div>

          {snapshot.projection.phase === "lobby" ? (
            <div className="grid gap-3 rounded-[1rem] border border-party-blue/25 bg-surface-sky/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-2xl font-extrabold text-foreground">
                  {copy.participants}
                </p>
                <BirthdayBadge tone={snapshot.projection.readyParticipantCount > 0 ? "yellow" : "coral"}>
                  {snapshot.projection.readyParticipantCount}/{snapshot.projection.participantCount}{" "}
                  {copy.ready}
                </BirthdayBadge>
              </div>
              <div className="grid gap-2" data-testid="host-readiness-list">
                {snapshot.projection.participants.map((participant) => (
                  <div
                    key={participant.guestId}
                    className="flex min-h-12 items-center gap-3 rounded-[0.9rem] border border-border bg-surface-paper px-3 py-2 shadow-lift"
                  >
                    <ParticipantAvatar
                      avatar={participant.avatar}
                      displayName={participant.displayName}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1 truncate font-extrabold text-foreground">
                      {participant.displayName}
                    </span>
                    <span className={participant.isReady ? "font-extrabold text-party-green" : "font-bold text-muted-foreground"}>
                      {participant.isReady ? copy.ready : copy.notReady}
                    </span>
                  </div>
                ))}
                {snapshot.projection.participants.length === 0 ? (
                  <p className="text-sm font-bold text-muted-foreground">
                    {copy.guestLobbyDescription}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1rem] border border-party-blue/25 bg-surface-sky/60 p-4">
            <p className="text-sm font-extrabold uppercase text-muted-foreground">
              {copy.currentQuestion}
            </p>
            <p className="mt-2 font-display text-3xl font-extrabold leading-tight text-foreground">
              {snapshot.projection.questionNumber
                ? `${snapshot.projection.questionNumber}/${snapshot.projection.totalQuestions}`
                : copy.lobbyTitle}
            </p>
            <p className="mt-2 text-sm font-bold text-muted-foreground">
              {snapshot.projection.currentQuestion?.prompt[locale] ??
                copy.waitingHost}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm font-bold text-muted-foreground">
            <p>
              {copy.sessionShortId}:{" "}
              <span className="text-foreground">
                {currentSession.id.slice(0, 8)}
              </span>
            </p>
            <p>
              {copy.environment}:{" "}
              <span className="text-foreground">
                {currentSession.deploymentEnvironment}
              </span>
            </p>
            <p>
              {copy.joinCode}:{" "}
              <span className="text-foreground">
                {currentSession.publicJoinCode}
              </span>
            </p>
            <p>
              {copy.created}:{" "}
              <span className="text-foreground">
                {new Date(currentSession.createdAt).toLocaleString()}
              </span>
            </p>
          </div>

          {commandMessage ? (
            <div
              className="flex gap-2 rounded-[0.9rem] border border-party-orange/30 bg-surface-highlight/70 p-3 text-sm font-bold"
              role="status"
            >
              {commandMessage === copy.connected ? (
                <CheckCircle2
                  className="h-5 w-5 text-party-green"
                  aria-hidden="true"
                />
              ) : (
                <AlertCircle
                  className="h-5 w-5 text-party-red"
                  aria-hidden="true"
                />
              )}
              <span>{commandMessage}</span>
            </div>
          ) : null}

          {confirmUnreadyStart && action?.command === "PREPARE_FIRST_QUESTION" ? (
            <div className="grid gap-3 rounded-[1rem] border border-party-orange/30 bg-surface-highlight/70 p-4">
              <p className="font-bold">
                {snapshot.projection.participantCount - snapshot.projection.readyParticipantCount}{" "}
                {copy.startWithUnready}
              </p>
              <Button
                type="button"
                disabled={pending}
                onClick={() => void runCommand("PREPARE_FIRST_QUESTION")}
              >
                {copy.startAnyway}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmUnreadyStart(false)}
              >
                {copy.cancel}
              </Button>
            </div>
          ) : confirmFinish && action?.command === "FINISH_PARTY" ? (
            <div className="grid gap-3 rounded-[1rem] border border-party-red/30 bg-party-red/10 p-4">
              <p className="font-bold">{copy.confirmFinish}</p>
              <Button
                type="button"
                disabled={pending}
                onClick={() => runCommand("FINISH_PARTY")}
              >
                {copy.finishParty}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmFinish(false)}
              >
                {copy.cancel}
              </Button>
            </div>
          ) : snapshot.projection.phase === "question_active" ? (
            <div
              className="rounded-[1rem] border border-party-orange/30 bg-surface-highlight/70 p-4 text-sm font-bold leading-6"
              role="status"
            >
              {copy.answeringInProgress} {copy.submitted}:{" "}
              {snapshot.projection.submittedCount}/
              {snapshot.projection.participantCount}
            </div>
          ) : (
            <Button
              type="button"
              disabled={
                !action ||
                pending ||
                (action?.command === "PREPARE_FIRST_QUESTION" &&
                  snapshot.projection.readyParticipantCount === 0) ||
                !leaderboardAnimationReady ||
                connection === "offline" ||
                connection === "reconnecting"
              }
              onClick={() => {
                if (!action) {
                  return;
                }

                if (action.confirm) {
                  setConfirmFinish(true);
                  return;
                }

                if (
                  action.command === "PREPARE_FIRST_QUESTION" &&
                  snapshot.projection.readyParticipantCount <
                    snapshot.projection.participantCount
                ) {
                  setConfirmUnreadyStart(true);
                  return;
                }

                void runCommand(action.command);
              }}
              className="min-h-16 w-full text-lg"
            >
              <PartyPopper aria-hidden="true" />
              {pending
                ? copy.submitting
                : !leaderboardAnimationReady
                  ? copy.leaderboardAnimating
                  : action?.command === "PREPARE_FIRST_QUESTION"
                    ? copy.startGame
                    : (action?.label ?? copy.waitingHost)}
            </Button>
          )}

          {snapshot.projection.phase === "lobby" &&
          snapshot.projection.readyParticipantCount === 0 ? (
            <p className="text-center text-sm font-bold text-muted-foreground" role="status">
              {copy.startNeedsReady}
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => archiveSession(currentSession.id)}
            >
              {copy.archiveSession}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void loadSessionManagement()}
            >
              {copy.reconnecting}
            </Button>
          </div>

          <SessionHistory
            copy={copy}
            sessions={recentSessions}
            onArchive={archiveSession}
            pending={pending}
          />
        </div>
      </PaperPanel>
    </section>
  );
}

function SessionHistory({
  copy,
  sessions,
  onArchive,
  pending,
}: {
  copy: ReturnType<typeof getPartyUiCopy>;
  sessions: SessionHistoryItem[];
  onArchive: (sessionId: string) => void;
  pending: boolean;
}) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-extrabold text-foreground">
        {copy.sessionHistory}
      </h2>
      <div className="grid gap-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase text-muted-foreground">
                  {copy.sessionShortId} {session.id.slice(0, 8)}
                </p>
                <p className="mt-1 font-extrabold text-foreground">
                  {session.phase} - {session.status}
                  {session.isCurrent ? ` - ${copy.current}` : ""}
                </p>
              </div>
              <BirthdayBadge tone={session.isTest ? "yellow" : "blue"}>
                {session.isTest ? copy.testSession : copy.productionSession}
              </BirthdayBadge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
              <span>
                {copy.participants}: {session.participantCount}
              </span>
              <span>
                {copy.responses}: {session.responseCount}
              </span>
              <span>
                {copy.commands}: {session.hostCommandCount}
              </span>
              <span>
                {copy.revision}: {session.revision}
              </span>
              <span>
                {copy.questionsThisSession}: {session.questionCount}
              </span>
              <span className="col-span-2">
                {copy.created}: {new Date(session.createdAt).toLocaleString()}
              </span>
              {session.finishedAt ? (
                <span className="col-span-2">
                  {copy.finishedAt}:{" "}
                  {new Date(session.finishedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
            {session.status !== "archived" ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => onArchive(session.id)}
                className="mt-3 w-full"
              >
                {copy.archiveSession}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
