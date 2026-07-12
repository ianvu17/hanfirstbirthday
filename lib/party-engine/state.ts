import type { GuestSession, PartyConfig, PartyState } from "./types";

export function responseKey(guestId: string, questionId: string) {
  return `${guestId}::${questionId}`;
}

export function createInitialPartyState(config: PartyConfig): PartyState {
  const guests = config.fixtureGuests.reduce<Record<string, GuestSession>>(
    (accumulator, guest, index) => {
      accumulator[guest.id] = {
        ...guest,
        createdOrder: index,
        isFixture: true
      };

      return accumulator;
    },
    {}
  );

  return {
    sessionId: config.sessionId,
    phase: "lobby",
    currentQuestionIndex: null,
    currentQuestionId: null,
    totalQuestions: config.questions.length,
    questionOpenedAt: null,
    questionDeadlineAt: null,
    questionLockedAt: null,
    answerRevealedAt: null,
    responses: {},
    guests,
    revision: 0,
    lastAcceptedCommand: null,
    lastError: null
  };
}
