export const BASE_CORRECT_POINTS = 1_000;
export const MAX_TIME_BONUS_POINTS = 1_000;
export const TIME_SCORING_VERSION = "time-v1" as const;

export type TimeScore = {
  responseTimeMs: number;
  pointsAwarded: number;
  scoringVersion: typeof TIME_SCORING_VERSION;
};

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function calculateTimeScore({
  isCorrect,
  responseReceivedAt,
  questionOpenedAt,
  questionDurationMs,
}: {
  isCorrect: boolean;
  responseReceivedAt: number;
  questionOpenedAt: number;
  questionDurationMs: number;
}): TimeScore {
  const safeOpenedAt = finiteOr(questionOpenedAt, responseReceivedAt);
  const rawElapsedMs = finiteOr(responseReceivedAt - safeOpenedAt, 0);
  const safeDurationMs =
    Number.isFinite(questionDurationMs) && questionDurationMs > 0
      ? questionDurationMs
      : 0;
  const responseTimeMs =
    safeDurationMs > 0
      ? Math.min(Math.max(rawElapsedMs, 0), safeDurationMs)
      : 0;

  if (!isCorrect) {
    return {
      responseTimeMs,
      pointsAwarded: 0,
      scoringVersion: TIME_SCORING_VERSION,
    };
  }

  if (safeDurationMs === 0) {
    return {
      responseTimeMs,
      pointsAwarded: BASE_CORRECT_POINTS,
      scoringVersion: TIME_SCORING_VERSION,
    };
  }

  const remainingRatio = 1 - responseTimeMs / safeDurationMs;
  const timeBonus = Math.round(MAX_TIME_BONUS_POINTS * remainingRatio);

  return {
    responseTimeMs,
    pointsAwarded: BASE_CORRECT_POINTS + timeBonus,
    scoringVersion: TIME_SCORING_VERSION,
  };
}

export function formatPoints(points: number, locale: "en" | "vi" = "en") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-AU", {
    maximumFractionDigits: 0,
  }).format(Math.round(points));
}
