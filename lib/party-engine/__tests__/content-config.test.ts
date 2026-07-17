import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import enContent from "@/content/en.json" with { type: "json" };
import viContent from "@/content/vi.json" with { type: "json" };
import {
  buildGuestProjection,
  buildPartyConfigFromContent,
  createInitialPartyState,
  getApprovedPartyConfig,
  getDevelopmentPartyConfig,
  processPartyCommand,
  selectLeaderboardRows,
} from "@/lib/party-engine";
import { getLocalPartyRuntime } from "@/lib/party-runtime/local-runtime";
import type { PartyCommand, PartyState } from "../types";

type MutableContent = typeof enContent;

function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function assertInvalid(
  mutate: (en: MutableContent, vi: MutableContent) => void,
  pattern: RegExp,
) {
  const en = cloneContent(enContent);
  const vi = cloneContent(viContent) as MutableContent;
  mutate(en, vi);
  assert.throws(() => buildPartyConfigFromContent(en, vi), pattern);
}

function mustAccept(state: PartyState, command: PartyCommand) {
  const result = processPartyCommand(state, command, getApprovedPartyConfig());
  assert.equal(result.ok, true, JSON.stringify(result, null, 2));
  return result.state;
}

test("approved content maps authoring questions to runtime PartyQuestion shape", () => {
  const config = buildPartyConfigFromContent(enContent, viContent);
  const first = config.questions[0];

  assert.equal(config.sessionId, "approved-static-party-content");
  assert.equal(config.questionDurationMs, 20_000);
  assert.equal(first.id, "han-test-question-01");
  assert.equal(first.prompt.en, enContent.quiz.questions[0].prompt);
  assert.equal(first.prompt.vi, viContent.quiz.questions[0].prompt);
  assert.deepEqual(
    first.options.map((option) => option.id),
    enContent.quiz.questions[0].answers.map((answer) => answer.id),
  );
  assert.equal(first.options[1].label.en, "Han's first birthday");
  assert.equal(first.options[1].label.vi, "Sinh nhật đầu tiên của Han");
  assert.equal(
    first.correctOptionId,
    enContent.quiz.questions[0].correctAnswerId,
  );
  assert.equal(first.funFact.en, enContent.quiz.questions[0].funFact);
  assert.equal(first.funFact.vi, viContent.quiz.questions[0].funFact);
});

test("approved content filters disabled questions and sorts deterministically", () => {
  const en = cloneContent(enContent);
  const vi = cloneContent(viContent) as MutableContent;
  en.quiz.questions[0].enabled = false;
  vi.quiz.questions[0].enabled = false;
  for (const question of en.quiz.questions.slice(2)) {
    question.enabled = false;
  }
  for (const question of vi.quiz.questions.slice(2)) {
    question.enabled = false;
  }
  en.quiz.questions[1].sortOrder = 10;
  vi.quiz.questions[1].sortOrder = 10;

  const config = buildPartyConfigFromContent(en, vi);

  assert.deepEqual(
    config.questions.map((question) => question.id),
    ["han-test-question-02"],
  );
});

test("approved content rejects mismatched bilingual question IDs", () => {
  assertInvalid((_, vi) => {
    vi.quiz.questions[0].id = "different-id";
  }, /missing from Vietnamese content|missing from English content/);
});

test("approved content rejects mismatched enabled states", () => {
  assertInvalid((_, vi) => {
    vi.quiz.questions[0].enabled = false;
  }, /mismatched enabled states/);
});

test("approved content rejects mismatched sort order", () => {
  assertInvalid((_, vi) => {
    vi.quiz.questions[0].sortOrder = 99;
  }, /mismatched sortOrder/);
});

test("approved content rejects mismatched option IDs", () => {
  assertInvalid((_, vi) => {
    vi.quiz.questions[0].answers[0].id = "different-option";
  }, /mismatched answer option IDs/);
});

test("approved content rejects mismatched correct-answer IDs", () => {
  assertInvalid((_, vi) => {
    vi.quiz.questions[0].correctAnswerId = "option-a";
  }, /mismatched correctAnswerId/);
});

test("approved content rejects a missing correct option", () => {
  assertInvalid((en, vi) => {
    en.quiz.questions[0].correctAnswerId = "missing-option";
    vi.quiz.questions[0].correctAnswerId = "missing-option";
  }, /correctAnswerId does not match/);
});

test("approved content rejects duplicate question IDs", () => {
  assertInvalid((en) => {
    en.quiz.questions[1].id = en.quiz.questions[0].id;
  }, /Duplicate English question id/);
});

test("approved content rejects duplicate option IDs within a question", () => {
  assertInvalid((en) => {
    en.quiz.questions[0].answers[1].id = en.quiz.questions[0].answers[0].id;
  }, /Duplicate English answer id/);
});

test("approved content rejects duplicate enabled sort order", () => {
  assertInvalid((en, vi) => {
    en.quiz.questions[1].sortOrder = en.quiz.questions[0].sortOrder;
    vi.quiz.questions[1].sortOrder = vi.quiz.questions[0].sortOrder;
  }, /Duplicate enabled sortOrder/);
});

test("approved content rejects empty prompts and answer labels", () => {
  assertInvalid((en) => {
    en.quiz.questions[0].prompt = " ";
  }, /English prompt is required/);

  assertInvalid((en) => {
    en.quiz.questions[0].answers[0].label = " ";
  }, /English label is required/);
});

test("approved content rejects fewer than two answers and missing fun facts", () => {
  assertInvalid((en, vi) => {
    en.quiz.questions[0].answers = en.quiz.questions[0].answers.slice(0, 1);
    vi.quiz.questions[0].answers = vi.quiz.questions[0].answers.slice(0, 1);
  }, /needs at least two answers/);

  assertInvalid((en) => {
    en.quiz.questions[0].funFact = " ";
  }, /English funFact is required/);
});

test("approved content rejects invalid or mismatched global duration", () => {
  assertInvalid((en) => {
    en.quiz.settings.questionDurationSeconds = 0;
  }, /Number must be greater than 0|Too small/);

  assertInvalid((_, vi) => {
    vi.quiz.settings.questionDurationSeconds = 25;
  }, /questionDurationSeconds must match/);
});

test("approved config contains no development fixture questions", () => {
  const approved = getApprovedPartyConfig();
  const fixture = getDevelopmentPartyConfig();
  const fixtureIds = new Set(fixture.questions.map((question) => question.id));

  assert.ok(approved.questions.length > 0);
  assert.equal(
    approved.questions.some((question) =>
      question.id.startsWith("dev-question"),
    ),
    false,
  );
  assert.equal(
    approved.questions.some((question) => fixtureIds.has(question.id)),
    false,
  );
});

test("normal local runtime uses approved content while QA and fixture tests remain isolated", () => {
  const runtime = getLocalPartyRuntime();
  const qaHarness = readFileSync(
    "components/party/qa-party-harness.tsx",
    "utf8",
  );
  const fixtureTest = readFileSync(
    "lib/party-engine/__tests__/party-engine.test.ts",
    "utf8",
  );

  assert.equal(runtime.getConfig().questions[0].id, "han-test-question-01");
  assert.equal(qaHarness.includes("getDevelopmentPartyConfig()"), true);
  assert.equal(fixtureTest.includes("getDevelopmentPartyConfig"), true);
});

test("remote runtime repository uses approved content instead of development fixtures", () => {
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");

  assert.equal(repository.includes("getApprovedPartyConfig"), true);
  assert.equal(repository.includes("getDevelopmentPartyConfig"), false);
});

test("approved content preserves scoring, deadline, timeout, and response IDs", () => {
  const config = getApprovedPartyConfig();
  const question = config.questions[0];
  let state = createInitialPartyState({
    ...config,
    fixtureGuests: [
      { id: "approved-guest-1", displayName: "Approved Guest 1", locale: "en" },
      { id: "approved-guest-2", displayName: "Approved Guest 2", locale: "vi" },
    ],
  });

  state = mustAccept(state, { type: "PREPARE_FIRST_QUESTION", now: 0 });
  state = mustAccept(state, { type: "REVEAL_CHOICES", now: 1000 });

  const correct = processPartyCommand(
    state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "approved-guest-1",
      questionId: question.id,
      selectedOptionId: question.correctOptionId,
      submissionId: `approved-guest-1:${question.id}:${question.correctOptionId}`,
      receivedAt: 2000,
    },
    config,
  );
  assert.equal(correct.ok, true);

  const late = processPartyCommand(
    correct.state,
    {
      type: "SUBMIT_RESPONSE",
      guestId: "approved-guest-2",
      questionId: question.id,
      selectedOptionId: question.options[0].id,
      submissionId: `approved-guest-2:${question.id}:${question.options[0].id}`,
      receivedAt: 21_000,
    },
    config,
  );
  assert.equal(late.ok, false);
  assert.equal(late.ok === false && late.error.code, "deadline_reached");

  state = mustAccept(correct.state, {
    type: "LOCK_QUESTION",
    now: 21_000,
    reason: "deadline",
  });
  const rows = selectLeaderboardRows(state);
  const response = Object.values(state.responses).find(
    (item) => item.guestId === "approved-guest-1",
  );
  const timeoutProjection = buildGuestProjection(
    state,
    config,
    "approved-guest-2",
    21_000,
  );

  assert.equal(
    rows.find((row) => row.guestId === "approved-guest-1")?.score,
    1950,
  );
  assert.equal(timeoutProjection.lockedResponse?.status, "locked_timeout");
  assert.equal(response?.questionId, question.id);
  assert.equal(response?.selectedOptionId, question.correctOptionId);
});
