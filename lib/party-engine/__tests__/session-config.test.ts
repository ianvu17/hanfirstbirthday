import assert from "node:assert/strict";
import test from "node:test";

import { getApprovedPartyConfig } from "../content-config";
import {
  createSessionPartyConfig,
  getDefaultSessionQuestionCount,
  validateSessionQuestionCount,
} from "../session-config";
import { createInitialPartyState } from "../state";
import { processPartyCommand } from "../reducer";

test("default session uses ten approved questions", () => {
  const approved = getApprovedPartyConfig();
  const count = getDefaultSessionQuestionCount(approved.questions.length);
  const session = createSessionPartyConfig(approved, count);

  assert.equal(count, 10);
  assert.equal(session.questions.length, 10);
});

test("short sessions select the first N approved questions without reordering", () => {
  const approved = getApprovedPartyConfig();

  for (const count of [3, 5, 7, 10]) {
    const session = createSessionPartyConfig(approved, count);
    assert.deepEqual(
      session.questions.map((question) => question.id),
      approved.questions.slice(0, count).map((question) => question.id),
    );
  }
});

test("question-count validation rejects zero, negative, decimal, and above available", () => {
  for (const value of [0, -1, 3.5, 11, "3", null]) {
    assert.throws(
      () => validateSessionQuestionCount(value, 10),
      /whole number between 1 and 10/,
    );
  }
});

test("default safely uses all enabled questions when fewer than ten exist", () => {
  assert.equal(getDefaultSessionQuestionCount(6), 6);
});

test("question N is final and no question N+1 is prepared", () => {
  const config = createSessionPartyConfig(getApprovedPartyConfig(), 3);
  const state = {
    ...createInitialPartyState(config),
    phase: "leaderboard" as const,
    currentQuestionIndex: 2,
    currentQuestionId: config.questions[2].id,
  };
  const result = processPartyCommand(
    state,
    { type: "ADVANCE_FROM_LEADERBOARD", now: 1_000 },
    config,
  );

  assert.equal(result.ok, true);
  assert.equal(result.state.phase, "finished");
  assert.equal(result.state.currentQuestionIndex, 2);
  assert.equal(result.state.totalQuestions, 3);
});

test("separate session configs do not leak their selected count", () => {
  const approved = getApprovedPartyConfig();
  const three = createSessionPartyConfig(approved, 3);
  const five = createSessionPartyConfig(approved, 5);

  assert.equal(three.questions.length, 3);
  assert.equal(five.questions.length, 5);
  assert.equal(approved.questions.length, 10);
});
