"use client";

import { useEffect, useRef, useState } from "react";

export type AuthoritativeCountdownInput = {
  deadlineAt: number | null;
  serverNow: number | null;
  active: boolean;
  tickRateMs?: number;
  maxVisibleMs?: number;
};

export function calculateAuthoritativeRemainingMs({
  deadlineAt,
  serverNow,
  clientNow
}: {
  deadlineAt: number | null;
  serverNow: number | null;
  clientNow: number;
}) {
  if (deadlineAt === null) {
    return 0;
  }

  const clockOffsetMs = serverNow === null ? 0 : serverNow - clientNow;
  return Math.max(0, deadlineAt - (clientNow + clockOffsetMs));
}

export function remainingSecondsFromMs(remainingMs: number) {
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function useAuthoritativeCountdown({
  deadlineAt,
  serverNow,
  active,
  tickRateMs = 200,
  maxVisibleMs = Number.POSITIVE_INFINITY
}: AuthoritativeCountdownInput) {
  const offsetRef = useRef(0);
  const lastSecondRef = useRef(0);
  const deadlineRef = useRef<number | null>(null);
  const [countdownState, setCountdownState] = useState(() => ({
    deadlineAt,
    remainingMs: active
      ? Math.min(
          maxVisibleMs,
          calculateAuthoritativeRemainingMs({ deadlineAt, serverNow, clientNow: Date.now() })
        )
      : 0
  }));

  useEffect(() => {
    const clientNow = Date.now();
    const snapshotOffsetMs = serverNow === null ? 0 : serverNow - clientNow;

    if (!active || deadlineAt === null) {
      offsetRef.current = snapshotOffsetMs;
      deadlineRef.current = deadlineAt;
      lastSecondRef.current = 0;
      return;
    }

    const isNewDeadline = deadlineRef.current !== deadlineAt;
    if (isNewDeadline) {
      // Freeze one server-derived offset for this deadline. Later snapshots
      // reconcile phase and data but cannot make a running clock skip ahead.
      offsetRef.current = snapshotOffsetMs;
    }
    deadlineRef.current = deadlineAt;
    let firstRun = true;

    const recompute = () => {
      const nextRemainingMs = Math.min(
        maxVisibleMs,
        Math.max(0, deadlineAt - (Date.now() + offsetRef.current))
      );
      const nextSecond = remainingSecondsFromMs(nextRemainingMs);

      if (firstRun && isNewDeadline) {
        lastSecondRef.current = nextSecond;
        setCountdownState({ deadlineAt, remainingMs: nextRemainingMs });
        firstRun = false;
        return;
      }

      // Snapshot clock corrections must never make a running countdown visibly increase.
      lastSecondRef.current = Math.min(lastSecondRef.current, nextSecond);
      setCountdownState({
        deadlineAt,
        remainingMs: Math.min(nextRemainingMs, lastSecondRef.current * 1000)
      });
      firstRun = false;
    };

    recompute();
    const interval = window.setInterval(recompute, Math.min(250, Math.max(100, tickRateMs)));

    const refreshImmediately = () => recompute();
    document.addEventListener("visibilitychange", refreshImmediately);
    window.addEventListener("focus", refreshImmediately);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshImmediately);
      window.removeEventListener("focus", refreshImmediately);
    };
  }, [active, deadlineAt, maxVisibleMs, serverNow, tickRateMs]);

  const displayedRemainingMs =
    active && deadlineAt !== null
      ? countdownState.deadlineAt === deadlineAt
        ? countdownState.remainingMs
        : Math.min(maxVisibleMs, Math.max(0, deadlineAt - (serverNow ?? deadlineAt)))
      : 0;

  return {
    remainingMs: displayedRemainingMs,
    remainingSeconds: remainingSecondsFromMs(displayedRemainingMs)
  };
}
