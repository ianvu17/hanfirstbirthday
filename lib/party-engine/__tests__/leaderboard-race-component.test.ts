import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync("components/party/leaderboard-race.tsx", "utf8");
const partyScreen = readFileSync(
  "components/party/party-screen-view.tsx",
  "utf8",
);

test("race component has explicit stages, transform bars, and stable participant keys", () => {
  assert.equal(
    component.includes('"intro" | "grow" | "reorder" | "settled"'),
    true,
  );
  assert.equal(component.includes("key={row.guestId}"), true);
  assert.equal(component.includes("animate={{ scaleX: barRatio }}"), true);
  assert.equal(component.includes("row.previousScore"), true);
  assert.equal(component.includes("row.score"), true);
  assert.equal(component.includes("row.pointsGained"), true);
});

test("race count-up uses motion values instead of React state per frame", () => {
  assert.equal(component.includes("useMotionValue"), true);
  assert.equal(component.includes("useTransform"), true);
  assert.equal(component.includes("requestAnimationFrame"), false);
});

test("reduced motion and browser-session replay protection settle safely", () => {
  assert.equal(component.includes("useReducedMotion"), true);
  assert.equal(component.includes("window.sessionStorage"), true);
  assert.equal(
    component.includes("!reducedMotion && !readSeenRaces().has(animationKey)"),
    true,
  );
  assert.equal(partyScreen.includes("animationKey"), true);
});
