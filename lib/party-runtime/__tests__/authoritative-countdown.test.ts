import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  calculateAuthoritativeRemainingMs,
  remainingSecondsFromMs
} from "../use-authoritative-countdown";

test("authoritative countdown emits every displayed integer from 20 to 0", () => {
  const deadlineAt = 1_020_000;
  const serverNow = 1_000_000;
  const emitted: number[] = [];

  for (let elapsed = 0; elapsed <= 20_000; elapsed += 200) {
    const remainingMs = calculateAuthoritativeRemainingMs({
      deadlineAt,
      serverNow: serverNow + elapsed,
      clientNow: 5_000_000 + elapsed
    });
    const second = remainingSecondsFromMs(remainingMs);
    if (emitted.at(-1) !== second) emitted.push(second);
  }

  assert.deepEqual(emitted, Array.from({ length: 21 }, (_, index) => 20 - index));
});

test("server clock offset ignores an inaccurate device clock", () => {
  assert.equal(
    calculateAuthoritativeRemainingMs({
      deadlineAt: 120_000,
      serverNow: 100_000,
      clientNow: 9_000_000
    }),
    20_000
  );
});

test("countdown clamps zero and hook owns interval and visibility cleanup", () => {
  assert.equal(remainingSecondsFromMs(-10), 0);
  assert.equal(remainingSecondsFromMs(1), 1);

  const source = readFileSync("lib/party-runtime/use-authoritative-countdown.ts", "utf8");
  assert.equal(source.includes("window.setInterval"), true);
  assert.equal(source.includes("window.clearInterval"), true);
  assert.equal(source.includes('document.addEventListener("visibilitychange"'), true);
  assert.equal(source.includes('document.removeEventListener("visibilitychange"'), true);
  assert.equal(source.includes("Math.min(lastSecondRef.current, nextSecond)"), true);
  assert.equal(source.includes("if (isNewDeadline)"), true);
  assert.equal(source.includes("offsetRef.current = snapshotOffsetMs"), true);
});
