import { responseKey } from "./state";
import type {
  HostCapabilities,
  LeaderboardRow,
  LockedResponse,
  PartyConfig,
  PartyOption,
  PartyPhase,
  PartyQuestion,
  PartyState,
} from "./types";

export type SharedPartyProjection = {
  phase: PartyPhase;
  revision: number;
  currentQuestion: PublicPartyQuestion | null;
  questionNumber: number | null;
  totalQuestions: number;
  participantCount: number;
  submittedCount: number;
  timedOutCount: number;
  questionDeadlineAt: number | null;
  questionDurationMs: number;
  remainingMs: number;
  correctOption: PartyOption | null;
  answerDistribution: Array<{
    optionId: string;
    label: PartyOption["label"];
    count: number;
    isCorrect: boolean | null;
  }>;
  leaderboard: LeaderboardRow[];
};

export type GuestProjection = {
  phase: PartyPhase;
  guestId: string;
  displayName: string | null;
  currentQuestion: PublicPartyQuestion | null;
  questionNumber: number | null;
  totalQuestions: number;
  questionDeadlineAt: number | null;
  questionDurationMs: number;
  remainingMs: number;
  canAnswer: boolean;
  lockedResponse: LockedResponse | null;
  reveal: {
    status: "correct" | "incorrect" | "timed_out";
    correctOptionId: string;
    selectedOptionId: string | null;
    pointsAwarded: number;
  } | null;
  score: number;
  correctCount: number;
  pointsGained: number;
  finalRank: number | null;
  winner: Pick<LeaderboardRow, "guestId" | "displayName" | "score"> | null;
};

export type PublicPartyQuestion = Omit<PartyQuestion, "correctOptionId">;

function projectQuestion(
  question: PartyQuestion | null,
): PublicPartyQuestion | null {
  if (!question) return null;
  const { correctOptionId, ...publicQuestion } = question;
  void correctOptionId;
  return publicQuestion;
}

export function selectCurrentQuestion(
  state: PartyState,
  config: PartyConfig,
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
      response.status === "locked_answer",
  ).length;
}

export function selectTimedOutCount(state: PartyState): number {
  if (!state.currentQuestionId) {
    return 0;
  }

  return Object.values(state.responses).filter(
    (response) =>
      response.questionId === state.currentQuestionId &&
      response.status === "locked_timeout",
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
    canAdvanceFromLeaderboard: state.phase === "leaderboard",
    canCompletePresentation: false,
    canPrepareNextQuestion:
      state.phase === "waiting_for_host" &&
      state.currentQuestionIndex !== null &&
      state.currentQuestionIndex + 1 < state.totalQuestions,
    canFinishParty:
      state.phase === "lobby" ||
      (state.phase === "waiting_for_host" &&
        state.currentQuestionIndex !== null &&
        state.currentQuestionIndex + 1 >= state.totalQuestions),
    canResetLocalParty: true,
  };
}

export function selectGuestResponse(
  state: PartyState,
  guestId: string,
): LockedResponse | null {
  if (!state.currentQuestionId) {
    return null;
  }

  return state.responses[responseKey(guestId, state.currentQuestionId)] ?? null;
}

export function selectCanGuestAnswer(
  state: PartyState,
  guestId: string,
  now: number,
) {
  return (
    state.phase === "question_active" &&
    state.questionDeadlineAt !== null &&
    now < state.questionDeadlineAt &&
    Boolean(state.currentQuestionId) &&
    Boolean(state.guests[guestId]) &&
    !selectGuestResponse(state, guestId)
  );
}

export function selectLeaderboardRows(state: PartyState): LeaderboardRow[] {
  type ScoreSummary = {
    score: number;
    answeredCount: number;
    correctCount: number;
    pointsGained: number;
  };
  const scoreByGuest = new Map<string, ScoreSummary>();

  for (const guestId of Object.keys(state.guests)) {
    scoreByGuest.set(guestId, {
      score: 0,
      answeredCount: 0,
      correctCount: 0,
      pointsGained: 0,
    });
  }

  for (const response of Object.values(state.responses)) {
    const current = scoreByGuest.get(response.guestId);

    if (!current) {
      continue;
    }

    current.answeredCount += 1;
    current.correctCount += response.isCorrect ? 1 : 0;
    current.score += response.pointsAwarded;

    if (response.questionId === state.currentQuestionId) {
      current.pointsGained += response.pointsAwarded;
    }
  }

  const fallbackCompare = (
    guestIdA: string,
    displayNameA: string,
    guestIdB: string,
    displayNameB: string,
  ) => {
    const guestA = state.guests[guestIdA];
    const guestB = state.guests[guestIdB];

    if (guestA.createdOrder !== guestB.createdOrder) {
      return guestA.createdOrder - guestB.createdOrder;
    }

    const nameOrder = displayNameA.localeCompare(displayNameB);
    return nameOrder !== 0 ? nameOrder : guestIdA.localeCompare(guestIdB);
  };
  const baseRows = Object.values(state.guests).map((guest) => {
    const score = scoreByGuest.get(guest.id) ?? {
      score: 0,
      answeredCount: 0,
      correctCount: 0,
      pointsGained: 0,
    };

    return {
      rank: 0,
      previousRank: 0,
      guestId: guest.id,
      displayName: guest.displayName,
      score: score.score,
      previousScore: score.score - score.pointsGained,
      pointsGained: score.pointsGained,
      answeredCount: score.answeredCount,
      correctCount: score.correctCount,
      isFixture: guest.isFixture,
      avatar: guest.avatar ?? null,
    };
  });
  const previousRanks = new Map(
    [...baseRows]
      .sort((a, b) => {
        if (b.previousScore !== a.previousScore) {
          return b.previousScore - a.previousScore;
        }

        return fallbackCompare(
          a.guestId,
          a.displayName,
          b.guestId,
          b.displayName,
        );
      })
      .map((row, index) => [row.guestId, index + 1]),
  );

  return baseRows
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return fallbackCompare(
        a.guestId,
        a.displayName,
        b.guestId,
        b.displayName,
      );
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      previousRank: previousRanks.get(row.guestId) ?? index + 1,
    }));
}

export function buildSharedPartyProjection(
  state: PartyState,
  config: PartyConfig,
  now: number,
): SharedPartyProjection {
  const question = selectCurrentQuestion(state, config);
  const shouldReveal =
    state.phase === "answer_reveal" ||
    state.phase === "leaderboard" ||
    state.phase === "waiting_for_host" ||
    state.phase === "finished";
  const correctOption = shouldReveal
    ? (question?.options.find(
        (option) => option.id === question.correctOptionId,
      ) ?? null)
    : null;
  const responses = Object.values(state.responses).filter(
    (response) => response.questionId === state.currentQuestionId,
  );

  return {
    phase: state.phase,
    revision: state.revision,
    currentQuestion: projectQuestion(question),
    questionNumber:
      state.currentQuestionIndex === null
        ? null
        : state.currentQuestionIndex + 1,
    totalQuestions: state.totalQuestions,
    participantCount: Object.keys(state.guests).length,
    submittedCount: selectSubmittedCount(state),
    timedOutCount: selectTimedOutCount(state),
    questionDeadlineAt:
      state.phase === "question_active" ? state.questionDeadlineAt : null,
    questionDurationMs: config.questionDurationMs,
    remainingMs: selectRemainingMs(state, now),
    correctOption,
    answerDistribution:
      question?.options.map((option) => ({
        optionId: option.id,
        label: option.label,
        count: responses.filter(
          (response) => response.selectedOptionId === option.id,
        ).length,
        isCorrect: shouldReveal ? option.id === question.correctOptionId : null,
      })) ?? [],
    leaderboard: selectLeaderboardRows(state),
  };
}

export function buildGuestProjection(
  state: PartyState,
  config: PartyConfig,
  guestId: string,
  now: number,
): GuestProjection {
  const question = selectCurrentQuestion(state, config);
  const response = selectGuestResponse(state, guestId);
  const leaderboard = selectLeaderboardRows(state);
  const shouldReveal =
    state.phase === "answer_reveal" ||
    state.phase === "leaderboard" ||
    state.phase === "waiting_for_host" ||
    state.phase === "finished";

  return {
    phase: state.phase,
    guestId,
    displayName: state.guests[guestId]?.displayName ?? null,
    currentQuestion: projectQuestion(question),
    questionNumber:
      state.currentQuestionIndex === null
        ? null
        : state.currentQuestionIndex + 1,
    totalQuestions: state.totalQuestions,
    questionDeadlineAt:
      state.phase === "question_active" ? state.questionDeadlineAt : null,
    questionDurationMs: config.questionDurationMs,
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
            selectedOptionId: response.selectedOptionId,
            pointsAwarded: response.pointsAwarded,
          }
        : null,
    score: leaderboard.find((row) => row.guestId === guestId)?.score ?? 0,
    correctCount:
      leaderboard.find((row) => row.guestId === guestId)?.correctCount ?? 0,
    pointsGained:
      leaderboard.find((row) => row.guestId === guestId)?.pointsGained ?? 0,
    finalRank:
      state.phase === "finished"
        ? (leaderboard.find((row) => row.guestId === guestId)?.rank ?? null)
        : null,
    winner:
      state.phase === "finished" && leaderboard[0]
        ? {
            guestId: leaderboard[0].guestId,
            displayName: leaderboard[0].displayName,
            score: leaderboard[0].score,
          }
        : null,
  };
}
