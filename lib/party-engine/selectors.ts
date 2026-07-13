import { responseKey } from "./state";
import type {
  HostCapabilities,
  LeaderboardRow,
  LockedResponse,
  PartyConfig,
  PartyOption,
  PartyPhase,
  PartyQuestion,
  PartyState
} from "./types";

export type SharedPartyProjection = {
  phase: PartyPhase;
  revision: number;
  currentQuestion: PartyQuestion | null;
  questionNumber: number | null;
  totalQuestions: number;
  participantCount: number;
  submittedCount: number;
  timedOutCount: number;
  remainingMs: number;
  correctOption: PartyOption | null;
  answerDistribution: Array<{
    optionId: string;
    label: PartyOption["label"];
    count: number;
    isCorrect: boolean;
  }>;
  leaderboard: LeaderboardRow[];
};

export type GuestProjection = {
  phase: PartyPhase;
  guestId: string;
  displayName: string | null;
  currentQuestion: PartyQuestion | null;
  questionNumber: number | null;
  totalQuestions: number;
  remainingMs: number;
  canAnswer: boolean;
  lockedResponse: LockedResponse | null;
  reveal:
    | {
        status: "correct" | "incorrect" | "timed_out";
        correctOptionId: string;
        selectedOptionId: string | null;
      }
    | null;
  score: number;
};

export function selectCurrentQuestion(
  state: PartyState,
  config: PartyConfig
): PartyQuestion | null {
  if (state.currentQuestionIndex === null) {
    return null;
  }

  return config.questions[state.currentQuestionIndex] ?? null;
}

export function selectRemainingMs(state: PartyState, now: number): number {
  if (state.phase !== "question_active" || state.questionDeadlineAt === null) {
    return 0;
  }

  return Math.max(0, state.questionDeadlineAt - now);
}

export function selectSubmittedCount(state: PartyState): number {
  if (!state.currentQuestionId) {
    return 0;
  }

  return Object.values(state.responses).filter(
    (response) =>
      response.questionId === state.currentQuestionId &&
      response.status === "locked_answer"
  ).length;
}

export function selectTimedOutCount(state: PartyState): number {
  if (!state.currentQuestionId) {
    return 0;
  }

  return Object.values(state.responses).filter(
    (response) =>
      response.questionId === state.currentQuestionId &&
      response.status === "locked_timeout"
  ).length;
}

export function selectHostCapabilities(state: PartyState): HostCapabilities {
  return {
    canPrepareFirstQuestion: state.phase === "lobby",
    canRevealChoices: state.phase === "question_ready",
    canOpenQuestion: false,
    canLockQuestion: false,
    canRevealAnswer: state.phase === "question_locked",
    canShowLeaderboard: state.phase === "answer_reveal",
    canCompletePresentation: state.phase === "leaderboard",
    canPrepareNextQuestion:
      state.phase === "waiting_for_host" &&
      state.currentQuestionIndex !== null &&
      state.currentQuestionIndex + 1 < state.totalQuestions,
    canFinishParty:
      state.phase === "lobby" ||
      (state.phase === "waiting_for_host" &&
        state.currentQuestionIndex !== null &&
        state.currentQuestionIndex + 1 >= state.totalQuestions),
    canResetLocalParty: true
  };
}

export function selectGuestResponse(
  state: PartyState,
  guestId: string
): LockedResponse | null {
  if (!state.currentQuestionId) {
    return null;
  }

  return state.responses[responseKey(guestId, state.currentQuestionId)] ?? null;
}

export function selectCanGuestAnswer(state: PartyState, guestId: string, now: number) {
  return (
    state.phase === "question_active" &&
    state.questionDeadlineAt !== null &&
    now < state.questionDeadlineAt &&
    Boolean(state.currentQuestionId) &&
    Boolean(state.guests[guestId]) &&
    !selectGuestResponse(state, guestId)
  );
}

export function selectLeaderboardRows(
  state: PartyState
): LeaderboardRow[] {
  const scoreByGuest = new Map<string, { score: number; answeredCount: number }>();

  for (const guestId of Object.keys(state.guests)) {
    scoreByGuest.set(guestId, { score: 0, answeredCount: 0 });
  }

  for (const response of Object.values(state.responses)) {
    const current = scoreByGuest.get(response.guestId);

    if (!current) {
      continue;
    }

    current.answeredCount += 1;
    current.score += response.isCorrect ? 1 : 0;
  }

  return Object.values(state.guests)
    .map((guest) => {
      const score = scoreByGuest.get(guest.id) ?? { score: 0, answeredCount: 0 };

      return {
        rank: 0,
        guestId: guest.id,
        displayName: guest.displayName,
        score: score.score,
        answeredCount: score.answeredCount,
        isFixture: guest.isFixture
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const guestA = state.guests[a.guestId];
      const guestB = state.guests[b.guestId];

      if (guestA.createdOrder !== guestB.createdOrder) {
        return guestA.createdOrder - guestB.createdOrder;
      }

      return a.displayName.localeCompare(b.displayName);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1
    }));
}

export function buildSharedPartyProjection(
  state: PartyState,
  config: PartyConfig,
  now: number
): SharedPartyProjection {
  const question = selectCurrentQuestion(state, config);
  const correctOption =
    state.phase === "answer_reveal" ||
    state.phase === "leaderboard" ||
    state.phase === "waiting_for_host" ||
    state.phase === "finished"
      ? question?.options.find((option) => option.id === question.correctOptionId) ?? null
      : null;
  const responses = Object.values(state.responses).filter(
    (response) => response.questionId === state.currentQuestionId
  );

  return {
    phase: state.phase,
    revision: state.revision,
    currentQuestion: question,
    questionNumber:
      state.currentQuestionIndex === null ? null : state.currentQuestionIndex + 1,
    totalQuestions: state.totalQuestions,
    participantCount: Object.keys(state.guests).length,
    submittedCount: selectSubmittedCount(state),
    timedOutCount: selectTimedOutCount(state),
    remainingMs: selectRemainingMs(state, now),
    correctOption,
    answerDistribution:
      question?.options.map((option) => ({
        optionId: option.id,
        label: option.label,
        count: responses.filter((response) => response.selectedOptionId === option.id).length,
        isCorrect: option.id === question.correctOptionId
      })) ?? [],
    leaderboard: selectLeaderboardRows(state)
  };
}

export function buildGuestProjection(
  state: PartyState,
  config: PartyConfig,
  guestId: string,
  now: number
): GuestProjection {
  const question = selectCurrentQuestion(state, config);
  const response = selectGuestResponse(state, guestId);
  const shouldReveal =
    state.phase === "answer_reveal" ||
    state.phase === "leaderboard" ||
    state.phase === "waiting_for_host" ||
    state.phase === "finished";

  return {
    phase: state.phase,
    guestId,
    displayName: state.guests[guestId]?.displayName ?? null,
    currentQuestion: question,
    questionNumber:
      state.currentQuestionIndex === null ? null : state.currentQuestionIndex + 1,
    totalQuestions: state.totalQuestions,
    remainingMs: selectRemainingMs(state, now),
    canAnswer: selectCanGuestAnswer(state, guestId, now),
    lockedResponse: response,
    reveal:
      shouldReveal && question && response
        ? {
            status:
              response.status === "locked_timeout"
                ? "timed_out"
                : response.isCorrect
                  ? "correct"
                  : "incorrect",
            correctOptionId: question.correctOptionId,
            selectedOptionId: response.selectedOptionId
          }
        : null,
    score: selectLeaderboardRows(state).find((row) => row.guestId === guestId)?.score ?? 0
  };
}
