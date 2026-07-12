"use client";

import { Clock, MonitorUp, QrCode, Trophy, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { AssetPlaceholder } from "@/components/design/asset-placeholder";
import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { TitleLockup } from "@/components/design/title-lockup";
import type { SharedPartyProjection } from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import type { PartyUiCopy } from "@/lib/party-runtime/copy";
import type { RemoteConnectionState } from "@/lib/party-remote/types";

function seconds(remainingMs: number) {
  return Math.ceil(remainingMs / 1000);
}

function connectionTone(connection: RemoteConnectionState) {
  return connection === "connected" ? "blue" : connection === "offline" ? "coral" : "yellow";
}

export function PartyScreenView({
  locale = "en",
  copy,
  projection,
  joinUrl,
  connection = "connected",
  label
}: {
  locale?: Locale;
  copy: PartyUiCopy;
  projection: SharedPartyProjection;
  joinUrl?: string;
  connection?: RemoteConnectionState;
  label: string;
}) {
  const question = projection.currentQuestion;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const showReveal =
    projection.phase === "answer_reveal" ||
    projection.phase === "leaderboard" ||
    projection.phase === "waiting_for_host" ||
    projection.phase === "finished";

  useEffect(() => {
    let cancelled = false;

    if (!joinUrl) {
      return;
    }

    QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 360,
      color: {
        dark: "#2f3f56",
        light: "#fffaf0"
      }
    }).then((dataUrl) => {
      if (!cancelled) {
        setQrDataUrl(dataUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BirthdayBadge tone="blue">
          <MonitorUp className="h-4 w-4" aria-hidden="true" />
          {label}
        </BirthdayBadge>
        <div className="flex flex-wrap gap-2">
          <BirthdayBadge tone="yellow">
            {copy.participants}: {projection.participantCount}
          </BirthdayBadge>
          <BirthdayBadge tone={connectionTone(connection)}>
            {connection === "connected" ? (
              <Wifi className="h-4 w-4" aria-hidden="true" />
            ) : (
              <WifiOff className="h-4 w-4" aria-hidden="true" />
            )}
            {copy.connection}: {copy[connection]}
          </BirthdayBadge>
        </div>
      </div>

      {projection.phase === "lobby" ? (
        <PaperPanel tone="display" className="overflow-hidden p-7 lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <TitleLockup title="WHO IS TURNING ONE?!" />
              <div className="space-y-3">
                <BirthdayBadge tone="coral">{copy.lobbyTitle}</BirthdayBadge>
                <p className="max-w-3xl text-3xl font-extrabold leading-tight text-foreground">
                  {copy.lobbyDescription}
                </p>
              </div>
            </div>
            <div className="mx-auto grid w-full max-w-sm gap-3 text-center">
              <div className="grid aspect-square place-items-center rounded-[1.5rem] border-4 border-dashed border-party-blue/45 bg-surface-sky/70 p-4 shadow-outline">
                {joinUrl && qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={copy.qrAlt}
                    className="h-full w-full rounded-[1rem]"
                  />
                ) : (
                  <div className="space-y-3">
                    <QrCode className="mx-auto h-20 w-20 text-party-blue-deep" aria-hidden="true" />
                    <p className="font-display text-3xl font-extrabold text-foreground">
                      {copy.qrPlaceholder}
                    </p>
                  </div>
                )}
              </div>
              <p className="break-all text-lg font-extrabold text-foreground">
                {joinUrl ?? copy.qrPlaceholder}
              </p>
            </div>
          </div>
        </PaperPanel>
      ) : null}

      {projection.phase !== "lobby" && projection.phase !== "finished" ? (
        <PaperPanel tone={showReveal ? "yellow" : "display"} className="p-6 lg:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem] lg:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <BirthdayBadge tone={projection.phase === "question_active" ? "coral" : "blue"}>
                  {projection.phase === "question_ready"
                    ? copy.questionReady
                    : projection.phase === "question_active"
                      ? copy.questionActive
                      : projection.phase === "question_locked"
                        ? copy.answersLocked
                        : projection.phase === "answer_reveal"
                          ? copy.answerReveal
                          : projection.phase === "leaderboard"
                            ? copy.leaderboard
                            : copy.waitingHost}
                </BirthdayBadge>
                {projection.questionNumber ? (
                  <BirthdayBadge tone="yellow">
                    {projection.questionNumber}/{projection.totalQuestions}
                  </BirthdayBadge>
                ) : null}
              </div>

              <h1 className="font-display text-5xl font-extrabold leading-tight text-foreground lg:text-7xl">
                {question
                  ? question.prompt[locale]
                  : projection.phase === "waiting_for_host"
                    ? copy.waitingHost
                    : copy.getReady}
              </h1>

              {question ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {question.options.map((option) => {
                    const isCorrect = showReveal && option.id === question.correctOptionId;

                    return (
                      <div
                        key={option.id}
                        className={`rounded-[1.1rem] border px-4 py-4 text-xl font-extrabold shadow-lift ${
                          isCorrect
                            ? "border-party-green/45 bg-party-green/18 text-foreground"
                            : "border-border bg-surface-paper"
                        }`}
                      >
                        {option.label[locale]}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <aside className="grid gap-4">
              <div className="rounded-[1.25rem] border border-party-orange/30 bg-surface-highlight/80 p-5 text-center shadow-lift">
                <Clock className="mx-auto mb-1 h-8 w-8 text-party-orange" aria-hidden="true" />
                <p className="text-sm font-extrabold uppercase text-muted-foreground">
                  {copy.time}
                </p>
                <p className="font-display text-7xl font-extrabold leading-none text-foreground">
                  {projection.phase === "question_active" ? seconds(projection.remainingMs) : "--"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <BirthdayBadge tone="blue">
                  {copy.submitted}: {projection.submittedCount}
                </BirthdayBadge>
                <BirthdayBadge tone="coral">
                  {copy.timedOut}: {projection.timedOutCount}
                </BirthdayBadge>
              </div>
              <AssetPlaceholder
                ratio="landscape"
                label="Development image placeholder"
                alt="Development-only placeholder frame"
              />
            </aside>
          </div>

          {showReveal && question ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.2rem] border border-party-green/35 bg-party-green/15 p-5">
                <p className="text-sm font-extrabold uppercase text-muted-foreground">
                  {copy.answerReveal}
                </p>
                <p className="font-display text-4xl font-extrabold text-foreground">
                  {projection.correctOption?.label[locale]}
                </p>
                <p className="mt-2 text-lg font-bold leading-7 text-muted-foreground">
                  {question.funFact[locale]}
                </p>
              </div>
              <div className="grid gap-2">
                {projection.answerDistribution.map((row) => (
                  <div
                    key={row.optionId}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[0.9rem] border border-border bg-surface-paper px-4 py-3 font-bold"
                  >
                    <span>{row.label[locale]}</span>
                    <span>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </PaperPanel>
      ) : null}

      {projection.phase === "leaderboard" || projection.phase === "finished" ? (
        <PaperPanel tone="celebration" className="p-6 lg:p-9">
          <div className="mb-5 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-party-orange" aria-hidden="true" />
            <h1 className="font-display text-5xl font-extrabold text-foreground">
              {projection.phase === "finished" ? copy.finished : copy.leaderboard}
            </h1>
          </div>
          <div className="grid gap-3">
            {projection.leaderboard.map((row) => (
              <div
                key={row.guestId}
                className="grid grid-cols-[4rem_1fr_5rem] items-center gap-4 rounded-[1.1rem] border border-border bg-surface-paper px-5 py-4 text-3xl font-extrabold shadow-lift"
              >
                <span className="font-display text-party-orange">#{row.rank}</span>
                <span className="truncate">{row.displayName}</span>
                <span className="text-right font-display text-party-blue-deep">{row.score}</span>
              </div>
            ))}
          </div>
        </PaperPanel>
      ) : null}
    </section>
  );
}
