"use client";

import {
  animate,
  LayoutGroup,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PaperPanel } from "@/components/design/paper-panel";
import { ParticipantAvatar } from "@/components/party/participant-avatar";
import {
  formatPoints,
  niceLeaderboardScale,
  type LeaderboardRow,
} from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import type { PartyUiCopy } from "@/lib/party-runtime/copy";

export type LeaderboardRaceStage = "intro" | "grow" | "reorder" | "settled";

const seenStorageKey = "han-leaderboard-races";

function readSeenRaces() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    return new Set<string>(
      JSON.parse(window.sessionStorage.getItem(seenStorageKey) ?? "[]"),
    );
  } catch {
    return new Set<string>();
  }
}

function rememberRace(key: string) {
  const seen = readSeenRaces();
  seen.add(key);
  window.sessionStorage.setItem(
    seenStorageKey,
    JSON.stringify([...seen].slice(-30)),
  );
}

function AnimatedInteger({
  from,
  to,
  stage,
  locale,
}: {
  from: number;
  to: number;
  stage: LeaderboardRaceStage;
  locale: Locale;
}) {
  const value = useMotionValue(stage === "intro" ? from : to);
  const displayValue = useTransform(value, (current) =>
    formatPoints(Math.round(current), locale),
  );

  useEffect(() => {
    if (stage === "intro") {
      value.set(from);
      return;
    }

    const controls = animate(value, to, {
      duration: stage === "grow" ? 1.25 : 0,
      ease: [0.2, 0.8, 0.2, 1],
    });
    return () => controls.stop();
  }, [from, stage, to, value]);

  return <motion.span>{displayValue}</motion.span>;
}

function rankTone(rank: number) {
  if (rank === 1) return "border-party-yellow bg-party-yellow/20";
  if (rank === 2) return "border-party-blue/45 bg-surface-sky/45";
  if (rank === 3) return "border-party-orange/40 bg-party-orange/10";
  return "border-border bg-surface-paper/92";
}

export function LeaderboardRace({
  rows,
  animationKey,
  locale,
  copy,
}: {
  rows: LeaderboardRow[];
  animationKey: string;
  locale: Locale;
  copy: PartyUiCopy;
}) {
  const reducedMotion = useReducedMotion();
  const [shouldAnimate] = useState(
    () => !reducedMotion && !readSeenRaces().has(animationKey),
  );
  const [stage, setStage] = useState<LeaderboardRaceStage>(
    shouldAnimate ? "intro" : "settled",
  );
  const scaleMax = useMemo(
    () => niceLeaderboardScale(Math.max(0, ...rows.map((row) => row.score))),
    [rows],
  );

  useEffect(() => {
    if (!shouldAnimate) {
      if (reducedMotion) rememberRace(animationKey);
      return;
    }
    const grow = window.setTimeout(() => setStage("grow"), 400);
    const reorder = window.setTimeout(() => setStage("reorder"), 1_750);
    const settle = window.setTimeout(() => {
      setStage("settled");
      rememberRace(animationKey);
    }, 2_600);

    return () => {
      window.clearTimeout(grow);
      window.clearTimeout(reorder);
      window.clearTimeout(settle);
    };
  }, [animationKey, reducedMotion, shouldAnimate]);

  const useFinalOrder = stage === "reorder" || stage === "settled";
  const displayedRows = [...rows].sort((a, b) =>
    useFinalOrder ? a.rank - b.rank : a.previousRank - b.previousRank,
  );

  return (
    <div data-testid="leaderboard-race">
      <PaperPanel tone="celebration" className="overflow-hidden p-4 lg:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-party-orange" aria-hidden="true" />
            <h1 className="font-display text-4xl font-extrabold text-foreground lg:text-5xl">
              {copy.leaderboard}
            </h1>
          </div>
          <span
            className="text-sm font-extrabold text-muted-foreground"
            data-testid="leaderboard-race-stage"
          >
            {stage === "settled" ? copy.connected : copy.leaderboardAnimating}
          </span>
        </div>

        <LayoutGroup id={animationKey}>
          <div className="grid gap-[clamp(0.25rem,0.55vh,0.5rem)]">
            {displayedRows.map((row) => {
              const displayedRank = useFinalOrder ? row.rank : row.previousRank;
              const displayedScore =
                stage === "intro" ? row.previousScore : row.score;
              const barRatio =
                scaleMax > 0 ? Math.min(1, displayedScore / scaleMax) : 0;

              return (
                <motion.div
                  layout
                  key={row.guestId}
                  data-participant-id={row.guestId}
                  className={`grid min-h-[clamp(3.1rem,6.2vh,4.15rem)] grid-cols-[2.4rem_3rem_minmax(10rem,1fr)_6.5rem_7rem] items-center gap-3 rounded-[1rem] border px-3 py-1.5 shadow-lift ${rankTone(displayedRank)}`}
                  transition={{
                    layout: {
                      duration: reducedMotion ? 0 : 0.8,
                      ease: [0.2, 0.8, 0.2, 1],
                    },
                  }}
                >
                  <span className="text-center font-display text-2xl font-extrabold text-party-orange">
                    #{displayedRank}
                  </span>
                  <ParticipantAvatar
                    avatar={row.avatar}
                    displayName={row.displayName}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="truncate text-base font-extrabold lg:text-lg">
                        {row.displayName}
                      </span>
                      {row.rank === 1 &&
                      row.previousRank !== 1 &&
                      useFinalOrder ? (
                        <span className="shrink-0 text-xs font-extrabold uppercase text-party-red">
                          {copy.newLeader}
                        </span>
                      ) : null}
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full border border-party-blue/25 bg-surface-paper-deep">
                      <motion.div
                        className="absolute inset-0 origin-left rounded-full bg-party-blue-deep"
                        initial={false}
                        animate={{ scaleX: barRatio }}
                        transition={{
                          duration: reducedMotion
                            ? 0
                            : stage === "grow"
                              ? 1.25
                              : 0.35,
                          ease: [0.2, 0.8, 0.2, 1],
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-right text-sm font-extrabold text-party-red">
                    +{formatPoints(row.pointsGained, locale)}
                    <span className="block text-[0.65rem] uppercase text-muted-foreground">
                      {copy.pointsThisRound}
                    </span>
                  </span>
                  <span className="text-right font-display text-xl font-extrabold text-party-blue-deep">
                    <AnimatedInteger
                      from={row.previousScore}
                      to={row.score}
                      stage={stage}
                      locale={locale}
                    />
                    <span className="ml-1 text-xs font-bold">
                      {copy.points}
                    </span>
                  </span>
                </motion.div>
              );
            })}
          </div>
        </LayoutGroup>
      </PaperPanel>
    </div>
  );
}
