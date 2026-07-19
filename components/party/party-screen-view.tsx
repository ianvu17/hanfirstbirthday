"use client";

import {
  CheckCircle2,
  Clock,
  MonitorUp,
  QrCode,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { BirthdayBadge } from "@/components/design/birthday-badge";
import { PaperPanel } from "@/components/design/paper-panel";
import { TitleLockup } from "@/components/design/title-lockup";
import { ConnectionStatusBadge } from "@/components/party/connection-status-badge";
import { ParticipantAvatar } from "@/components/party/participant-avatar";
import { LeaderboardRace } from "@/components/party/leaderboard-race";
import { formatPoints, type SharedPartyProjection } from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import type { RemoteConnectionState } from "@/lib/party-remote/types";
import type { PartyUiCopy } from "@/lib/party-runtime/copy";
import { useAuthoritativeCountdown } from "@/lib/party-runtime/use-authoritative-countdown";

export function PartyScreenView({
  locale = "en",
  copy,
  projection,
  serverNow = null,
  joinUrl,
  connection = "connected",
  label,
  animationKey,
}: {
  locale?: Locale;
  copy: PartyUiCopy;
  projection: SharedPartyProjection;
  serverNow?: number | null;
  joinUrl?: string;
  connection?: RemoteConnectionState;
  label: string;
  animationKey?: string;
}) {
  const question = projection.currentQuestion;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const countdown = useAuthoritativeCountdown({
    deadlineAt: projection.questionDeadlineAt,
    serverNow,
    active: projection.phase === "question_active",
    maxVisibleMs: projection.questionDurationMs,
  });

  useEffect(() => {
    let cancelled = false;

    if (!joinUrl) {
      return;
    }

    QRCode.toDataURL(joinUrl, {
      margin: 1,
      width: 360,
      color: { dark: "#2f3f56", light: "#fffaf0" },
    }).then((dataUrl) => {
      if (!cancelled) setQrDataUrl(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <BirthdayBadge tone="blue">
        <MonitorUp className="h-4 w-4" aria-hidden="true" />
        {label}
      </BirthdayBadge>
      <div className="flex flex-wrap gap-2">
        <BirthdayBadge tone="yellow">
          <Users className="h-4 w-4" aria-hidden="true" />
          {copy.participants}: {projection.participantCount}
        </BirthdayBadge>
        <ConnectionStatusBadge connection={connection} copy={copy} prefix />
      </div>
    </div>
  );

  if (projection.phase === "lobby") {
    return (
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-5">
        {header}
        <PaperPanel tone="display" className="overflow-hidden p-7 lg:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <TitleLockup title="WHO IS TURNING ONE?!" />
              <BirthdayBadge tone="coral">{copy.lobbyTitle}</BirthdayBadge>
              <p className="max-w-3xl text-3xl font-extrabold leading-tight text-foreground">
                {copy.lobbyDescription}
              </p>
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
                    <QrCode
                      className="mx-auto h-20 w-20 text-party-blue-deep"
                      aria-hidden="true"
                    />
                    <p className="font-display text-3xl font-extrabold">
                      {copy.qrPlaceholder}
                    </p>
                  </div>
                )}
              </div>
              <p className="break-all text-lg font-extrabold">
                {joinUrl ?? copy.qrPlaceholder}
              </p>
            </div>
          </div>
        </PaperPanel>
      </section>
    );
  }

  if (
    projection.phase === "answer_reveal" ||
    projection.phase === "waiting_for_host"
  ) {
    const correctDistribution = projection.answerDistribution.find(
      (row) => row.isCorrect,
    );

    return (
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-4">
        {header}
        <PaperPanel tone="yellow" className="overflow-hidden p-5 lg:p-8">
          <div className="space-y-4 lg:space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <BirthdayBadge tone="coral">{copy.answerReveal}</BirthdayBadge>
              <BirthdayBadge tone="yellow">
                {projection.questionNumber}/{projection.totalQuestions}
              </BirthdayBadge>
            </div>
            <h1 className="max-w-6xl font-display text-4xl font-extrabold leading-[1.05] text-foreground lg:text-6xl">
              {question?.prompt[locale]}
            </h1>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden rounded-[1.5rem] border-4 border-party-green bg-[#e7f5df] p-5 shadow-[0_12px_0_hsl(var(--party-green)/0.16)] lg:p-7">
                <Sparkles
                  className="absolute right-5 top-5 h-10 w-10 text-party-yellow"
                  aria-hidden="true"
                />
                <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-[#226548] lg:text-base">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                  {copy.correctAnswer}
                </p>
                <p className="mt-2 pr-12 font-display text-4xl font-extrabold leading-tight text-foreground lg:text-6xl">
                  {projection.correctOption?.label[locale]}
                </p>
                <p className="mt-3 font-extrabold text-[#226548]">
                  {correctDistribution?.count ?? 0} {copy.guests}
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-party-orange/30 bg-surface-highlight p-5 shadow-lift lg:p-6">
                <p className="text-sm font-extrabold uppercase tracking-wide text-party-red">
                  {copy.funFact}
                </p>
                <p className="mt-2 text-xl font-extrabold leading-8 text-foreground lg:text-2xl lg:leading-9">
                  {question?.funFact[locale]}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {projection.answerDistribution.map((row) => (
                <div
                  key={row.optionId}
                  className={`grid min-h-20 grid-cols-[1fr_auto] items-center gap-3 rounded-[1rem] border px-4 py-3 font-bold ${
                    row.isCorrect
                      ? "border-party-green/45 bg-[#eef8e9]"
                      : "border-border/80 bg-surface-paper/75 text-muted-foreground"
                  }`}
                >
                  <span className="leading-snug">{row.label[locale]}</span>
                  <span className="font-display text-3xl text-foreground">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm font-extrabold text-muted-foreground">
              {copy.submitted}: {projection.submittedCount} · {copy.timedOut}:{" "}
              {projection.timedOutCount} · {copy.nextUp}
            </p>
          </div>
        </PaperPanel>
      </section>
    );
  }

  if (projection.phase === "leaderboard") {
    return (
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-4">
        {header}
        <LeaderboardRace
          key={
            animationKey ??
            `${projection.currentQuestion?.id ?? "none"}:leaderboard`
          }
          rows={projection.leaderboard}
          animationKey={
            animationKey ??
            `${projection.currentQuestion?.id ?? "none"}:leaderboard`
          }
          locale={locale}
          copy={copy}
        />
      </section>
    );
  }

  if (projection.phase === "finished") {
    const winner = projection.leaderboard[0];

    return (
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-4">
        {header}
        <PaperPanel
          tone="celebration"
          className="relative overflow-hidden p-6 text-center lg:p-10"
        >
          <div
            className="pointer-events-none gingham-yellow absolute inset-0 opacity-35"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-4xl space-y-4">
            <BirthdayBadge tone="yellow" className="mx-auto">
              <Trophy className="h-5 w-5" aria-hidden="true" />
              {copy.mastermindTitle}
            </BirthdayBadge>
            {winner ? (
              <>
                <ParticipantAvatar
                  avatar={winner.avatar}
                  displayName={winner.displayName}
                  size="xl"
                  className="mx-auto h-32 w-32 border-4 shadow-outline lg:h-40 lg:w-40"
                />
                <h1 className="font-display text-6xl font-extrabold leading-none text-foreground lg:text-8xl">
                  {winner.displayName}
                </h1>
                <p className="font-display text-4xl font-extrabold text-party-blue-deep lg:text-5xl">
                  {formatPoints(winner.score, locale)} {copy.points}
                </p>
                <p className="font-bold text-muted-foreground">
                  {winner.correctCount} {copy.correctOutOf}{" "}
                  {projection.totalQuestions}
                </p>
                <p className="text-xl font-extrabold text-muted-foreground lg:text-2xl">
                  {copy.mastermindCelebration}
                </p>
              </>
            ) : (
              <h1 className="font-display text-6xl font-extrabold">
                {copy.finished}
              </h1>
            )}
            <div className="mx-auto grid max-w-3xl gap-2 pt-2 sm:grid-cols-3">
              {projection.leaderboard.slice(0, 3).map((row) => (
                <div
                  key={row.guestId}
                  className="flex items-center gap-3 rounded-[1rem] border border-border bg-surface-paper/90 p-3 text-left shadow-lift"
                >
                  <span className="font-display text-2xl font-extrabold text-party-orange">
                    #{row.rank}
                  </span>
                  <ParticipantAvatar
                    avatar={row.avatar}
                    displayName={row.displayName}
                    size="md"
                  />
                  <span className="min-w-0 flex-1 truncate font-extrabold">
                    {row.displayName}
                  </span>
                  <span className="font-display text-lg font-extrabold text-party-blue-deep">
                    {formatPoints(row.score, locale)}{" "}
                    <span className="text-xs">{copy.points}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PaperPanel>
      </section>
    );
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl content-center gap-4">
      {header}
      <PaperPanel tone="display" className="p-6 lg:p-9">
        <div
          className={`grid gap-6 ${projection.phase === "question_active" ? "lg:grid-cols-[1fr_18rem]" : ""}`}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <BirthdayBadge
                tone={projection.phase === "question_active" ? "coral" : "blue"}
              >
                {projection.phase === "question_ready"
                  ? copy.questionReady
                  : projection.phase === "question_locked"
                    ? copy.answersLocked
                    : copy.questionActive}
              </BirthdayBadge>
              <BirthdayBadge tone="yellow">
                {projection.questionNumber}/{projection.totalQuestions}
              </BirthdayBadge>
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-foreground lg:text-7xl">
              {question?.prompt[locale] ?? copy.getReady}
            </h1>
            {projection.phase === "question_ready" ? (
              <div className="rounded-[1.2rem] border border-party-blue/25 bg-surface-sky/60 p-5 text-2xl font-extrabold">
                {copy.waitingChoices}
              </div>
            ) : null}
            {question &&
            (projection.phase === "question_active" ||
              projection.phase === "question_locked") ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className="rounded-[1.1rem] border border-border bg-surface-paper px-4 py-4 text-xl font-extrabold shadow-lift"
                  >
                    {option.label[locale]}
                  </div>
                ))}
              </div>
            ) : null}
            {projection.phase === "question_locked" ? (
              <div className="rounded-[1.1rem] border border-party-orange/30 bg-surface-highlight p-4 text-xl font-extrabold">
                {copy.waitingReveal} · {copy.submitted}:{" "}
                {projection.submittedCount} · {copy.timedOut}:{" "}
                {projection.timedOutCount}
              </div>
            ) : null}
          </div>
          {projection.phase === "question_active" ? (
            <aside className="grid content-start gap-4">
              <div className="rounded-[1.25rem] border border-party-orange/30 bg-surface-highlight/80 p-5 text-center shadow-lift">
                <Clock
                  className="mx-auto mb-1 h-8 w-8 text-party-orange"
                  aria-hidden="true"
                />
                <p className="text-sm font-extrabold uppercase text-muted-foreground">
                  {copy.time}
                </p>
                <p
                  className="font-display text-7xl font-extrabold leading-none text-foreground"
                  aria-live="off"
                  data-testid="party-countdown"
                >
                  {countdown.remainingSeconds}
                </p>
              </div>
              <BirthdayBadge
                tone="blue"
                className="justify-center py-3 text-base"
              >
                {copy.submitted}: {projection.submittedCount}/
                {projection.participantCount}
              </BirthdayBadge>
            </aside>
          ) : null}
        </div>
      </PaperPanel>
    </section>
  );
}
