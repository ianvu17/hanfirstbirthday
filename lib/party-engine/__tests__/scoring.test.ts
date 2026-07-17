import assert from "node:assert/strict";
import test from "node:test";

import {
  BASE_CORRECT_POINTS,
  MAX_TIME_BONUS_POINTS,
  calculateTimeScore,
} from "../scoring";

function correctAt(elapsedMs: number, durationMs = 20_000) {
  return calculateTimeScore({
    isCorrect: true,
    responseReceivedAt: 1_000 + elapsedMs,
    questionOpenedAt: 1_000,
    questionDurationMs: durationMs,
  });
}

test("time-v1 worked scoring examples use integer points", () => {
  assert.equal(correctAt(0).pointsAwarded, 2_000);
  assert.equal(correctAt(5_000).pointsAwarded, 1_750);
  assert.equal(correctAt(10_000).pointsAwarded, 1_500);
  assert.equal(correctAt(15_000).pointsAwarded, 1_250);
  assert.equal(correctAt(19_999).pointsAwarded, 1_000);

  for (const elapsedMs of [0, 1, 5_000, 12_345, 19_999, 20_000]) {
    assert.equal(Number.isInteger(correctAt(elapsedMs).pointsAwarded), true);
  }
});

test("time-v1 clamps defensive clock values and respects score bounds", () => {
  const negativeElapsed = correctAt(-500);
  const afterDuration = correctAt(25_000);

  assert.equal(negativeElapsed.responseTimeMs, 0);
  assert.equal(
    negativeElapsed.pointsAwarded,
    BASE_CORRECT_POINTS + MAX_TIME_BONUS_POINTS,
  );
  assert.equal(afterDuration.responseTimeMs, 20_000);
  assert.equal(afterDuration.pointsAwarded, BASE_CORRECT_POINTS);
});

test("incorrect answers earn zero regardless of speed", () => {
  const score = calculateTimeScore({
    isCorrect: false,
    responseReceivedAt: 1_001,
    questionOpenedAt: 1_000,
    questionDurationMs: 20_000,
  });

  assert.equal(score.responseTimeMs, 1);
  assert.equal(score.pointsAwarded, 0);
});

test("zero or malformed duration falls back to base points for a correct answer", () => {
  assert.equal(correctAt(0, 0).pointsAwarded, BASE_CORRECT_POINTS);
  assert.equal(correctAt(0, Number.NaN).pointsAwarded, BASE_CORRECT_POINTS);
});
