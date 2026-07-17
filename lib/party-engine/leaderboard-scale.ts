export function niceLeaderboardScale(maxScore: number) {
  const safeMax = Math.max(2_000, Math.ceil(maxScore));
  const magnitude = 10 ** Math.floor(Math.log10(safeMax));
  const normalized = safeMax / magnitude;
  const nice =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 4
          ? 4
          : normalized <= 5
            ? 5
            : 10;
  return nice * magnitude;
}
