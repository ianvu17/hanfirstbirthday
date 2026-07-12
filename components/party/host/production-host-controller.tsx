"use client";

import { AlertCircle, CheckCircle2, LockKeyhole, PartyPopper, WifiOff } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { LoadingTreatment } from "@/components/design/loading-treatment";
import { PaperPanel } from "@/components/design/paper-panel";
import { Button } from "@/components/ui/button";
import {
  selectHostCapabilities,
  type HostCapabilities,
  type PartyPhase
} from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import { getPartyUiCopy } from "@/lib/party-runtime/copy";
import type { RuntimePartyCommand } from "@/lib/party-runtime/runtime-contract";
import { useRemotePartySnapshot } from "@/lib/party-remote/use-remote-party";
import type { RemotePartySnapshot } from "@/lib/party-remote/types";

type HostStatus = {
  configured: boolean;
  authorized: boolean;
};

function nextAction(
  phase: PartyPhase,
  capabilities: HostCapabilities,
  copy: ReturnType<typeof getPartyUiCopy>
): { label: string; command: RuntimePartyCommand["type"]; confirm?: boolean } | null {
  if (capabilities.canPrepareFirstQuestion) {
    return { label: copy.prepareFirst, command: "PREPARE_FIRST_QUESTION" };
  }

  if (capabilities.canOpenQuestion) {
    return { label: copy.openQuestion, command: "OPEN_QUESTION" };
  }

  if (capabilities.canLockQuestion) {
    return { label: copy.lockQuestion, command: "LOCK_QUESTION" };
  }

  if (capabilities.canRevealAnswer) {
    return { label: copy.revealAnswer, command: "REVEAL_ANSWER" };
  }

  if (capabilities.canShowLeaderboard) {
    return { label: copy.showLeaderboard, command: "SHOW_LEADERBOARD" };
  }

  if (capabilities.canCompletePresentation) {
    return { label: copy.completePresentation, command: "COMPLETE_PRESENTATION" };
  }

  if (capabilities.canPrepareNextQuestion) {
    return { label: copy.prepareNext, command: "PREPARE_NEXT_QUESTION" };
  }

  if (capabilities.canFinishParty || phase === "lobby") {
    return { label: copy.finishParty, command: "FINISH_PARTY", confirm: true };
  }

  return null;
}

export function ProductionHostController({ locale }: { locale: Locale }) {
  const copy = getPartyUiCopy(locale);
  const { snapshot, connection, error, refresh, applySnapshot } =
    useRemotePartySnapshot<RemotePartySnapshot>(false);
  const [hostStatus, setHostStatus] = useState<HostStatus | null>(null);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [pending, setPending] = useState(false);
  const [commandMessage, setCommandMessage] = useState("");
  const [confirmFinish, setConfirmFinish] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const response = await fetch("/api/party/host/status", { cache: "no-store" });
      setHostStatus(await response.json());
    }

    void loadStatus();
  }, []);

  const capabilities = useMemo(
    () =>
      snapshot
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
            lastError: null
          })
        : null,
    [snapshot]
  );
  const action =
    snapshot && capabilities
      ? nextAction(snapshot.projection.phase, capabilities, copy)
      : null;

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setLoginError("");

    const response = await fetch("/api/party/host/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    });

    setPending(false);

    if (!response.ok) {
      const payload = await response.json();
      setLoginError(payload.error?.message ?? "That PIN did not work.");
      return;
    }

    setHostStatus({ configured: true, authorized: true });
    setPin("");
    void refresh();
  }

  async function runCommand(command: RuntimePartyCommand["type"]) {
    if (!snapshot) {
      return;
    }

    setPending(true);
    setCommandMessage("");

    const response = await fetch("/api/party/host/command", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        type: command,
        expectedRevision: snapshot.session.revision,
        commandId: `${command}:${snapshot.session.revision}:${Date.now()}`
      })
    });
    const payload = await response.json();
    setPending(false);
    setConfirmFinish(false);

    if (!response.ok || !payload.ok) {
      setCommandMessage(payload.error?.message ?? "That host action was not accepted.");
      if (payload.snapshot) {
        applySnapshot(payload.snapshot as RemotePartySnapshot);
      } else {
        void refresh();
      }
      return;
    }

    applySnapshot(payload.snapshot as RemotePartySnapshot);
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
              <p className="rounded-[0.9rem] border border-party-red/30 bg-party-red/10 p-3 text-sm font-bold" role="alert">
                {loginError || copy.hostPinMissing}
              </p>
            ) : null}
            <Button type="submit" disabled={pending || !pin || !hostStatus.configured} className="w-full">
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
        <PaperPanel tone={error ? "warm" : "admin"} className="w-full text-center">
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

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl items-center pb-[env(safe-area-inset-bottom)]">
      <PaperPanel tone="admin" className="w-full">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <BirthdayBadge tone={snapshot.session.isTest ? "yellow" : "blue"}>
                {snapshot.session.isTest ? copy.testSession : copy.productionSession}
              </BirthdayBadge>
              <h1 className="mt-3 font-display text-4xl font-extrabold text-foreground">
                {copy.hostTitle}
              </h1>
            </div>
            <BirthdayBadge tone={connection === "connected" ? "blue" : "coral"}>
              <WifiOff className="h-4 w-4" aria-hidden="true" />
              {copy[connection]}
            </BirthdayBadge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">{copy.phase}</p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.projection.phase}
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">{copy.revision}</p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.session.revision}
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">{copy.participants}</p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.projection.participantCount}
              </p>
            </div>
            <div className="rounded-[1rem] border border-border bg-surface-paper p-4 shadow-lift">
              <p className="text-xs font-extrabold uppercase text-muted-foreground">{copy.submitted}</p>
              <p className="mt-1 text-lg font-extrabold text-foreground">
                {snapshot.projection.submittedCount}
              </p>
            </div>
          </div>

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
              {snapshot.projection.currentQuestion?.prompt[locale] ?? copy.waitingHost}
            </p>
          </div>

          {commandMessage ? (
            <div className="flex gap-2 rounded-[0.9rem] border border-party-orange/30 bg-surface-highlight/70 p-3 text-sm font-bold" role="status">
              {commandMessage === copy.connected ? (
                <CheckCircle2 className="h-5 w-5 text-party-green" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-5 w-5 text-party-red" aria-hidden="true" />
              )}
              <span>{commandMessage}</span>
            </div>
          ) : null}

          {confirmFinish && action?.command === "FINISH_PARTY" ? (
            <div className="grid gap-3 rounded-[1rem] border border-party-red/30 bg-party-red/10 p-4">
              <p className="font-bold">{copy.confirmFinish}</p>
              <Button type="button" disabled={pending} onClick={() => runCommand("FINISH_PARTY")}>
                {copy.finishParty}
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmFinish(false)}>
                {copy.cancel}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              disabled={!action || pending || connection === "offline" || connection === "stale"}
              onClick={() => {
                if (!action) {
                  return;
                }

                if (action.confirm) {
                  setConfirmFinish(true);
                  return;
                }

                void runCommand(action.command);
              }}
              className="min-h-16 w-full text-lg"
            >
              <PartyPopper aria-hidden="true" />
              {pending ? copy.submitting : action?.label ?? copy.waitingHost}
            </Button>
          )}
        </div>
      </PaperPanel>
    </section>
  );
}
