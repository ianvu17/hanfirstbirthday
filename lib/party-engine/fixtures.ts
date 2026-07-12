import fixtureData from "@/content/party-fixtures.json" with { type: "json" };
import type { GuestSession, PartyConfig, PartyQuestion } from "./types";

type RawFixture = typeof fixtureData;

function assertValidFixture(data: RawFixture) {
  const questionIds = new Set<string>();

  for (const question of data.questions) {
    if (!question.enabled) {
      continue;
    }

    if (questionIds.has(question.id)) {
      throw new Error(`Duplicate party fixture question id: ${question.id}`);
    }

    questionIds.add(question.id);

    if (question.options.length < 2) {
      throw new Error(`Party fixture question ${question.id} needs at least two options.`);
    }

    const optionIds = new Set(question.options.map((option) => option.id));

    if (!optionIds.has(question.correctOptionId)) {
      throw new Error(`Party fixture question ${question.id} has an invalid correct option.`);
    }
  }
}

export function getDevelopmentPartyConfig(): PartyConfig {
  assertValidFixture(fixtureData);

  const questions = fixtureData.questions
    .filter((question) => question.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder) as PartyQuestion[];

  return {
    sessionId: "local-development-party",
    questionDurationMs: fixtureData.settings.questionDurationSeconds * 1000,
    questions,
    fixtureGuests: fixtureData.guests as Array<Omit<GuestSession, "createdOrder" | "isFixture">>
  };
}
