import assert from "node:assert/strict";
import test from "node:test";

import { processPartyCommand } from "../reducer";
import { selectLeaderboardRows } from "../selectors";
import { createInitialPartyState } from "../state";
import type { PartyCommand, PartyState } from "../types";
import { getDevelopmentPartyConfig } from "../fixtures";
import { niceLeaderboardScale } from "../leaderboard-scale";

const config = getDevelopmentPartyConfig();

function accept(state: PartyState, command: PartyCommand) {
  const result = processPartyCommand(state, command, config);
  assert.equal(result.ok, true, JSON.stringify(result));
  return result.state;
}

test("leaderboard race projects previous score, gained points, and rank movement", () => {
  let state = createInitialPartyState(config);
  state = accept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = accept(state, { type: "REVEAL_CHOICES", now: 1_000 });
  state = accept(state, {
    type: "SUBMIT_RESPONSE",
    guestId: "test-guest-02",
    questionId: config.questions[0].id,
    selectedOptionId: config.questions[0].correctOptionId,
    submissionId: "q1-fast",
    receivedAt: 2_000,
  });

  const first = selectLeaderboardRows(state);
  const leader = first.find((row) => row.guestId === "test-guest-02");
  assert.equal(leader?.previousScore, 0);
  assert.equal(leader?.pointsGained, 1_950);
  assert.equal(leader?.score, 1_950);
  assert.equal(leader?.previousRank, 2);
  assert.equal(leader?.rank, 1);
});

test("exact score ties use guest creation order, then stable identity fallback", () => {
  const state = createInitialPartyState(config);
  const rows = selectLeaderboardRows(state);

  assert.deepEqual(
    rows.map((row) => row.guestId),
    config.fixtureGuests.map((guest) => guest.id),
  );
  assert.deepEqual(
    rows.map((row) => row.rank),
    rows.map((_, index) => index + 1),
  );
});

test("race scale uses stable nice ceilings and never clips the leader", () => {
  assert.equal(niceLeaderboardScale(0), 2_000);
  assert.equal(niceLeaderboardScale(2_000), 2_000);
  assert.equal(niceLeaderboardScale(3_430), 4_000);
  assert.equal(niceLeaderboardScale(8_120), 10_000);
  assert.ok(niceLeaderboardScale(19_999) >= 19_999);
});
