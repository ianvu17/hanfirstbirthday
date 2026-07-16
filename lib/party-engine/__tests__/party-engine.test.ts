import assert from "node:assert/strict";
import test from "node:test";

import { ManualPartyClock } from "../clock";
import { getDevelopmentPartyConfig } from "../fixtures";
import { processPartyCommand } from "../reducer";
import {
  buildGuestProjection,
  buildSharedPartyProjection,
  selectHostCapabilities,
  selectLeaderboardRows
} from "../selectors";
import { createInitialPartyState } from "../state";
import type { PartyCommand, PartyState } from "../types";
import { LocalPartyRuntime } from "@/lib/party-runtime/runtime-contract";

const config = getDevelopmentPartyConfig();

function mustAccept(state: PartyState, command: PartyCommand) {
  const result = processPartyCommand(state, command, config);

  assert.equal(result.ok, true, JSON.stringify(result, null, 2));

  return result.state;
}

test("leaderboard advances directly to the next question without returning to reveal", () => {
  let state = createInitialPartyState(config);

  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  assert.equal(state.phase, "question_ready");
  assert.equal(state.questionOpenedAt, null);
  assert.equal(state.questionDeadlineAt, null);

  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 100 });
  assert.equal(state.phase, "question_active");
  assert.equal(state.questionDeadlineAt, 20100);

  state = mustAccept(state, { type: "LOCK_QUESTION", now: 20100, reason: "deadline" });
  assert.equal(state.phase, "question_locked");

  state = mustAccept(state, { type: "REVEAL_ANSWER", now: 20200 });
  state = mustAccept(state, { type: "SHOW_LEADERBOARD", now: 20300 });
  state = mustAccept(state, { type: "ADVANCE_FROM_LEADERBOARD", now: 20400 });
  assert.equal(state.currentQuestionIndex, 1);
  assert.equal(state.phase, "question_ready");
  assert.equal(state.questionDeadlineAt, null);
});

test("final leaderboard advances to finished without overflowing the question index", () => {
  const finalIndex = config.questions.length - 1;
  const state: PartyState = {
    ...createInitialPartyState(config),
    phase: "leaderboard",
    currentQuestionIndex: finalIndex,
    currentQuestionId: config.questions[finalIndex].id
  };

  const finished = mustAccept(state, { type: "ADVANCE_FROM_LEADERBOARD", now: 5000 });
  assert.equal(finished.phase, "finished");
  assert.equal(finished.currentQuestionIndex, finalIndex);
  assert.equal(finished.currentQuestionId, config.questions[finalIndex].id);
  assert.equal(selectHostCapabilities(finished).canAdvanceFromLeaderboard, false);
});

test("invalid transitions are rejected with structured errors", () => {
  const state = createInitialPartyState(config);
  const reveal = processPartyCommand(state, { type: "REVEAL_ANSWER", now: 0 }, config);
  const leaderboard = processPartyCommand(
    state,
    { type: "SHOW_LEADERBOARD", now: 0 },
    config
  );

  assert.equal(reveal.ok, false);
  assert.equal(leaderboard.ok, false);
  assert.equal(reveal.ok === false && reveal.error.code, "invalid_phase_transition");
  assert.equal(leaderboard.ok === false && leaderboard.error.code, "invalid_phase_transition");
});

test("guests cannot submit before answer choices are revealed", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });

  const result = processPartyCommand(
    state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "test-guest-01",
      questionId: config.questions[0].id,
      selectedOptionId: "option-b",
      submissionId: "too-soon",
      receivedAt: 500
    },
    config
  );

  assert.equal(result.ok, false);
  assert.equal(result.ok === false && result.error.code, "answer_window_closed");
});

test("submission locks once, exact retry is idempotent, conflicting retry is rejected", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 1000 });

  const questionId = config.questions[0].id;
  const accepted = processPartyCommand(
    state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "test-guest-01",
      questionId,
      selectedOptionId: "option-b",
      submissionId: "same-submit",
      receivedAt: 1500
    },
    config
  );

  assert.equal(accepted.ok, true);
  assert.equal(accepted.state.revision, state.revision + 1);

  const exactRetry = processPartyCommand(
    accepted.state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "test-guest-01",
      questionId,
      selectedOptionId: "option-b",
      submissionId: "same-submit",
      receivedAt: 1600
    },
    config
  );

  assert.equal(exactRetry.ok, true);
  assert.equal(exactRetry.state.revision, accepted.state.revision);

  const conflict = processPartyCommand(
    exactRetry.state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "test-guest-01",
      questionId,
      selectedOptionId: "option-a",
      submissionId: "changed-submit",
      receivedAt: 1700
    },
    config
  );

  assert.equal(conflict.ok, false);
  assert.equal(conflict.ok === false && conflict.error.code, "response_already_locked");
});

test("idempotent retries clear stale local errors without changing revision", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, {
    type: "REGISTER_GUEST",
    guestId: "session-guest",
    displayName: "Session Guest",
    locale: "en",
    now: 0
  });
  const duplicateRegister = processPartyCommand(
    {
      ...state,
      lastError: {
        code: "command_not_allowed",
        message: "Previous local error."
      }
    },
    {
      type: "REGISTER_GUEST",
      guestId: "session-guest",
      displayName: "Session Guest",
      locale: "en",
      now: 1
    },
    config
  );

  assert.equal(duplicateRegister.ok, true);
  assert.equal(duplicateRegister.state.revision, state.revision);
  assert.equal(duplicateRegister.state.lastError, null);

  state = mustAccept(duplicateRegister.state, { type: "PREPARE_FIRST_QUESTION", now: 2 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 3 });
  state = mustAccept(state, {
    type: "SUBMIT_RESPONSE",
    guestId: "session-guest",
    questionId: config.questions[0].id,
    selectedOptionId: "option-b",
    submissionId: "same-submit",
    receivedAt: 4
  });

  const duplicateSubmit = processPartyCommand(
    {
      ...state,
      lastError: {
        code: "response_already_locked",
        message: "Previous local error."
      }
    },
    {
      type: "SUBMIT_RESPONSE",
      guestId: "session-guest",
      questionId: config.questions[0].id,
      selectedOptionId: "option-b",
      submissionId: "same-submit",
      receivedAt: 5
    },
    config
  );

  assert.equal(duplicateSubmit.ok, true);
  assert.equal(duplicateSubmit.state.revision, state.revision);
  assert.equal(duplicateSubmit.state.lastError, null);
});

test("deadline boundary accepts before deadline and rejects at deadline", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 1000 });

  const questionId = config.questions[0].id;
  const before = processPartyCommand(
    state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "test-guest-01",
      questionId,
      selectedOptionId: "option-b",
      submissionId: "before",
      receivedAt: 20999
    },
    config
  );
  const exact = processPartyCommand(
    state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "test-guest-02",
      questionId,
      selectedOptionId: "option-b",
      submissionId: "exact",
      receivedAt: 21000
    },
    config
  );

  assert.equal(before.ok, true);
  assert.equal(exact.ok, false);
  assert.equal(exact.ok === false && exact.error.code, "deadline_reached");
});

test("timeout materializes unanswered guest responses and scoring stays simple", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 100 });
  state = mustAccept(state, {
    type: "SUBMIT_RESPONSE",
    guestId: "test-guest-01",
    questionId: config.questions[0].id,
    selectedOptionId: "option-b",
    submissionId: "correct",
    receivedAt: 150
  });
  state = mustAccept(state, { type: "LOCK_QUESTION", now: 20100, reason: "deadline" });

  const rows = selectLeaderboardRows(state);
  const winner = rows.find((row) => row.guestId === "test-guest-01");
  const timedOut = buildGuestProjection(state, config, "test-guest-02", 20100);

  assert.equal(winner?.score, 1);
  assert.equal(timedOut.lockedResponse?.status, "locked_timeout");
  assert.equal(timedOut.score, 0);
});

test("projections hide correct answer until reveal", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 100 });

  const activeProjection = buildSharedPartyProjection(state, config, 500);
  const activeGuest = buildGuestProjection(state, config, "test-guest-01", 500);
  assert.equal(activeProjection.correctOption, null);
  assert.equal("correctOptionId" in (activeProjection.currentQuestion ?? {}), false);
  assert.equal("correctOptionId" in (activeGuest.currentQuestion ?? {}), false);
  assert.equal(activeGuest.reveal, null);
  assert.ok(activeProjection.answerDistribution.every((row) => row.isCorrect === null));

  state = mustAccept(state, { type: "LOCK_QUESTION", now: 20100, reason: "deadline" });
  state = mustAccept(state, { type: "REVEAL_ANSWER", now: 20200 });

  const revealProjection = buildSharedPartyProjection(state, config, 20200);
  assert.equal(revealProjection.correctOption?.id, config.questions[0].correctOptionId);
  assert.equal(
    revealProjection.answerDistribution.find((row) => row.isCorrect)?.optionId,
    config.questions[0].correctOptionId
  );
});

test("host capabilities are derived from phase", () => {
  let state = createInitialPartyState(config);
  assert.equal(selectHostCapabilities(state).canPrepareFirstQuestion, true);

  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  assert.equal(selectHostCapabilities(state).canRevealChoices, true);
  assert.equal(selectHostCapabilities(state).canOpenQuestion, false);

  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 100 });
  assert.equal(selectHostCapabilities(state).canLockQuestion, false);
});

test("manual host lock is not part of the production flow", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 100 });

  const manualLock = processPartyCommand(
    state,
    { type: "LOCK_QUESTION", now: 500, reason: "host" },
    config
  );

  assert.equal(manualLock.ok, false);
  assert.equal(manualLock.ok === false && manualLock.error.code, "command_not_allowed");
});

test("correct answer cannot be revealed until the deadline closes answering", () => {
  let state = createInitialPartyState(config);
  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 100 });

  const earlyReveal = processPartyCommand(
    state,
    { type: "REVEAL_ANSWER", now: 500 },
    config
  );

  assert.equal(earlyReveal.ok, false);
  assert.equal(earlyReveal.ok === false && earlyReveal.error.code, "invalid_phase_transition");

  state = mustAccept(state, { type: "LOCK_QUESTION", now: 20100, reason: "deadline" });
  state = mustAccept(state, { type: "REVEAL_ANSWER", now: 20200 });
  assert.equal(state.phase, "answer_reveal");
});

test("local runtime schedules one deadline lock with manual clock", () => {
  const clock = new ManualPartyClock(0);
  const runtime = new LocalPartyRuntime(config, clock);
  let notifications = 0;
  runtime.subscribe(() => {
    notifications += 1;
  });

  runtime.dispatch({ type: "PREPARE_FIRST_QUESTION" });
  runtime.dispatch({ type: "REVEAL_CHOICES" });

  clock.advance(config.questionDurationMs - 1);
  assert.equal(runtime.getSnapshot().state.phase, "question_active");

  clock.advance(1);
  assert.equal(runtime.getSnapshot().state.phase, "question_locked");

  clock.advance(1000);
  assert.equal(runtime.getSnapshot().state.phase, "question_locked");
  assert.ok(notifications >= 3);
});
