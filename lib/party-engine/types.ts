import type { Locale } from "@/lib/i18n/routing";

export type PartyPhase =
  | "lobby"
  | "question_ready"
  | "question_active"
  | "question_locked"
  | "answer_reveal"
  | "leaderboard"
  | "waiting_for_host"
  | "finished";

export type LocalizedText = Record<Locale, string>;

export type PartyOption = {
  id: string;
  label: LocalizedText;
};

export type PartyQuestion = {
  id: string;
  enabled: boolean;
  sortOrder: number;
  prompt: LocalizedText;
  options: PartyOption[];
  correctOptionId: string;
  funFact: LocalizedText;
  assetId?: string;
};

export type GuestSession = {
  id: string;
  displayName: string;
  locale: Locale;
  createdOrder: number;
  isFixture: boolean;
};

export type QuestionResponseStatus = "locked_answer" | "locked_timeout";

export type LockedResponse = {
  guestId: string;
  questionId: string;
  selectedOptionId: string | null;
  status: QuestionResponseStatus;
  submittedAt: number;
  lockedAt: number;
  responseDurationMs: number | null;
  submissionId: string;
  isCorrect: boolean;
};

export type PartyState = {
  sessionId: string;
  phase: PartyPhase;
  currentQuestionIndex: number | null;
  currentQuestionId: string | null;
  totalQuestions: number;
  questionOpenedAt: number | null;
  questionDeadlineAt: number | null;
  questionLockedAt: number | null;
  answerRevealedAt: number | null;
  responses: Record<string, LockedResponse>;
  guests: Record<string, GuestSession>;
  revision: number;
  lastAcceptedCommand: string | null;
  lastError: PartyDomainError | null;
};

export type PartyConfig = {
  sessionId: string;
  questionDurationMs: number;
  questions: PartyQuestion[];
  fixtureGuests: Array<Omit<GuestSession, "createdOrder" | "isFixture">>;
};

export type PartyCommand =
  | { type: "REGISTER_GUEST"; guestId: string; displayName: string; locale: Locale; now: number }
  | { type: "PREPARE_FIRST_QUESTION"; now: number }
  | { type: "OPEN_QUESTION"; now: number }
  | { type: "LOCK_QUESTION"; now: number; reason?: "deadline" | "host" }
  | { type: "REVEAL_ANSWER"; now: number }
  | { type: "SHOW_LEADERBOARD"; now: number }
  | { type: "COMPLETE_PRESENTATION"; now: number }
  | { type: "PREPARE_NEXT_QUESTION"; now: number }
  | { type: "FINISH_PARTY"; now: number }
  | {
      type: "SUBMIT_RESPONSE";
      guestId: string;
      questionId: string;
      selectedOptionId: string;
      submissionId: string;
      receivedAt: number;
    }
  | { type: "RESET_LOCAL_PARTY"; now: number };

export type PartyDomainErrorCode =
  | "invalid_phase_transition"
  | "question_not_found"
  | "no_active_question"
  | "answer_window_closed"
  | "response_already_locked"
  | "invalid_option"
  | "guest_not_registered"
  | "deadline_reached"
  | "party_finished"
  | "command_not_allowed";

export type PartyDomainError = {
  code: PartyDomainErrorCode;
  message: string;
  context?: Record<string, string | number | null>;
};

export type PartyCommandResult =
  | {
      ok: true;
      state: PartyState;
    }
  | {
      ok: false;
      state: PartyState;
      error: PartyDomainError;
    };

export type HostCapabilities = {
  canPrepareFirstQuestion: boolean;
  canOpenQuestion: boolean;
  canLockQuestion: boolean;
  canRevealAnswer: boolean;
  canShowLeaderboard: boolean;
  canCompletePresentation: boolean;
  canPrepareNextQuestion: boolean;
  canFinishParty: boolean;
  canResetLocalParty: boolean;
};

export type LeaderboardRow = {
  rank: number;
  guestId: string;
  displayName: string;
  score: number;
  answeredCount: number;
  isFixture: boolean;
};

export type PartySnapshot = {
  state: PartyState;
  now: number;
};
