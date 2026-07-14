import enContent from "@/content/en.json" with { type: "json" };
import viContent from "@/content/vi.json" with { type: "json" };
import { ContentSchema, type BirthdayContent } from "@/lib/content/schema";
import type { PartyConfig, PartyOption, PartyQuestion } from "./types";

const approvedSessionId = "approved-static-party-content";

type ContentQuestion = BirthdayContent["quiz"]["questions"][number];

function fail(message: string): never {
  throw new Error(`Approved quiz content invalid: ${message}`);
}

function requireNonEmpty(value: string, label: string) {
  if (value.trim().length === 0) {
    fail(`${label} is required.`);
  }
}

function requireUnique(values: string[], label: string) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      fail(`Duplicate ${label}: ${value}.`);
    }

    seen.add(value);
  }
}

function byId(items: ContentQuestion[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function mapContentQuestionToPartyQuestion(
  enQuestion: ContentQuestion,
  viQuestion: ContentQuestion
): PartyQuestion {
  if (enQuestion.id !== viQuestion.id) {
    fail(`Question id mismatch: ${enQuestion.id} / ${viQuestion.id}.`);
  }

  if (enQuestion.enabled !== viQuestion.enabled) {
    fail(`Question ${enQuestion.id} has mismatched enabled states.`);
  }

  if (enQuestion.sortOrder !== viQuestion.sortOrder) {
    fail(`Question ${enQuestion.id} has mismatched sortOrder values.`);
  }

  if (enQuestion.correctAnswerId !== viQuestion.correctAnswerId) {
    fail(`Question ${enQuestion.id} has mismatched correctAnswerId values.`);
  }

  requireNonEmpty(enQuestion.prompt, `Question ${enQuestion.id} English prompt`);
  requireNonEmpty(viQuestion.prompt, `Question ${enQuestion.id} Vietnamese prompt`);
  requireNonEmpty(enQuestion.funFact, `Question ${enQuestion.id} English funFact`);
  requireNonEmpty(viQuestion.funFact, `Question ${enQuestion.id} Vietnamese funFact`);

  if (enQuestion.answers.length < 2 || viQuestion.answers.length < 2) {
    fail(`Question ${enQuestion.id} needs at least two answers in both locales.`);
  }

  const enOptionIds = enQuestion.answers.map((answer) => answer.id);
  const viOptionIds = viQuestion.answers.map((answer) => answer.id);
  requireUnique(enOptionIds, `English answer id for question ${enQuestion.id}`);
  requireUnique(viOptionIds, `Vietnamese answer id for question ${enQuestion.id}`);

  if (enOptionIds.join("\u0000") !== viOptionIds.join("\u0000")) {
    fail(`Question ${enQuestion.id} has mismatched answer option IDs.`);
  }

  if (!enOptionIds.includes(enQuestion.correctAnswerId)) {
    fail(`Question ${enQuestion.id} correctAnswerId does not match an answer id.`);
  }

  const options: PartyOption[] = enQuestion.answers.map((enAnswer, index) => {
    const viAnswer = viQuestion.answers[index];
    requireNonEmpty(enAnswer.label, `Question ${enQuestion.id} answer ${enAnswer.id} English label`);
    requireNonEmpty(viAnswer.label, `Question ${enQuestion.id} answer ${enAnswer.id} Vietnamese label`);

    return {
      id: enAnswer.id,
      label: {
        en: enAnswer.label,
        vi: viAnswer.label
      }
    };
  });

  return {
    id: enQuestion.id,
    enabled: enQuestion.enabled,
    sortOrder: enQuestion.sortOrder,
    prompt: {
      en: enQuestion.prompt,
      vi: viQuestion.prompt
    },
    options,
    correctOptionId: enQuestion.correctAnswerId,
    funFact: {
      en: enQuestion.funFact,
      vi: viQuestion.funFact
    },
    ...(enQuestion.assetId ? { assetId: enQuestion.assetId } : {})
  };
}

export function validateApprovedQuestionSet(en: BirthdayContent, vi: BirthdayContent) {
  if (en.locale !== "en") {
    fail("English content file must declare locale en.");
  }

  if (vi.locale !== "vi") {
    fail("Vietnamese content file must declare locale vi.");
  }

  const enDuration = en.quiz.settings.questionDurationSeconds;
  const viDuration = vi.quiz.settings.questionDurationSeconds;

  if (enDuration !== viDuration) {
    fail("Quiz questionDurationSeconds must match across locales.");
  }

  const enQuestions = en.quiz.questions;
  const viQuestions = vi.quiz.questions;
  requireUnique(enQuestions.map((question) => question.id), "English question id");
  requireUnique(viQuestions.map((question) => question.id), "Vietnamese question id");

  const enQuestionMap = byId(enQuestions);
  const viQuestionMap = byId(viQuestions);

  for (const question of enQuestions) {
    if (!viQuestionMap.has(question.id)) {
      fail(`Question ${question.id} is missing from Vietnamese content.`);
    }
  }

  for (const question of viQuestions) {
    if (!enQuestionMap.has(question.id)) {
      fail(`Question ${question.id} is missing from English content.`);
    }
  }

  const enabledSortOrders = new Set<number>();

  for (const enQuestion of enQuestions) {
    const viQuestion = viQuestionMap.get(enQuestion.id);

    if (!viQuestion) {
      continue;
    }

    const runtimeQuestion = mapContentQuestionToPartyQuestion(enQuestion, viQuestion);

    if (!runtimeQuestion.enabled) {
      continue;
    }

    if (enabledSortOrders.has(runtimeQuestion.sortOrder)) {
      fail(`Duplicate enabled sortOrder: ${runtimeQuestion.sortOrder}.`);
    }

    enabledSortOrders.add(runtimeQuestion.sortOrder);
  }
}

export function buildPartyConfigFromContent(
  enContentInput: unknown,
  viContentInput: unknown
): PartyConfig {
  const enParsed = ContentSchema.parse(enContentInput);
  const viParsed = ContentSchema.parse(viContentInput);
  validateApprovedQuestionSet(enParsed, viParsed);

  const viQuestionMap = byId(viParsed.quiz.questions);
  const questions = enParsed.quiz.questions
    .map((enQuestion) => mapContentQuestionToPartyQuestion(enQuestion, viQuestionMap.get(enQuestion.id)!))
    .filter((question) => question.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (questions.length === 0) {
    fail("At least one enabled question is required.");
  }

  return {
    sessionId: approvedSessionId,
    questionDurationMs: enParsed.quiz.settings.questionDurationSeconds * 1000,
    questions,
    fixtureGuests: []
  };
}

export function getApprovedPartyConfig(): PartyConfig {
  return buildPartyConfigFromContent(enContent, viContent);
}
