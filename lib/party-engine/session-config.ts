import type { PartyConfig } from "./types";

export const DEFAULT_SESSION_QUESTION_COUNT = 10;
export const RECOMMENDED_SESSION_QUESTION_COUNTS = [3, 5, 7, 10] as const;

export class PartySessionQuestionCountError extends Error {
  readonly code = "invalid_question_count";

  constructor(
    message: string,
    readonly availableQuestionCount: number,
  ) {
    super(message);
    this.name = "PartySessionQuestionCountError";
  }
}

export function getDefaultSessionQuestionCount(availableQuestionCount: number) {
  return Math.min(
    DEFAULT_SESSION_QUESTION_COUNT,
    Math.max(availableQuestionCount, 0),
  );
}

export function validateSessionQuestionCount(
  questionCount: unknown,
  availableQuestionCount: number,
) {
  if (
    !Number.isInteger(questionCount) ||
    typeof questionCount !== "number" ||
    questionCount < 1 ||
    questionCount > availableQuestionCount
  ) {
    throw new PartySessionQuestionCountError(
      `Question count must be a whole number between 1 and ${availableQuestionCount}.`,
      availableQuestionCount,
    );
  }

  return questionCount;
}

export function createSessionPartyConfig(
  config: PartyConfig,
  questionCount: number,
): PartyConfig {
  const validatedCount = validateSessionQuestionCount(
    questionCount,
    config.questions.length,
  );

  return {
    ...config,
    questions: config.questions.slice(0, validatedCount),
  };
}

export function getAvailableSessionQuestionCounts(
  availableQuestionCount: number,
) {
  const recommended = RECOMMENDED_SESSION_QUESTION_COUNTS.filter(
    (count) => count <= availableQuestionCount,
  );

  if (
    availableQuestionCount > 0 &&
    !recommended.some((count) => count === availableQuestionCount)
  ) {
    return [...recommended, availableQuestionCount].sort((a, b) => a - b);
  }

  return [...recommended];
}
