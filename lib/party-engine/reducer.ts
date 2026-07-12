import { createInitialPartyState, responseKey } from "./state";
import type {
  GuestSession,
  LockedResponse,
  PartyCommand,
  PartyCommandResult,
  PartyConfig,
  PartyDomainError,
  PartyState
} from "./types";

function domainError(
  code: PartyDomainError["code"],
  message: string,
  context?: PartyDomainError["context"]
): PartyDomainError {
  return { code, message, context };
}

function reject(state: PartyState, error: PartyDomainError): PartyCommandResult {
  return {
    ok: false,
    state: {
      ...state,
      lastError: error
    },
    error
  };
}

function accept(state: PartyState, commandType: PartyCommand["type"]): PartyCommandResult {
  return {
    ok: true,
    state: {
      ...state,
      revision: state.revision + 1,
      lastAcceptedCommand: commandType,
      lastError: null
    }
  };
}

function acceptIdempotent(
  state: PartyState,
  commandType: PartyCommand["type"]
): PartyCommandResult {
  return {
    ok: true,
    state: {
      ...state,
      lastAcceptedCommand: commandType,
      lastError: null
    }
  };
}

function currentQuestion(config: PartyConfig, state: PartyState) {
  if (state.currentQuestionIndex === null) {
    return null;
  }

  return config.questions[state.currentQuestionIndex] ?? null;
}

function materializeTimeouts(state: PartyState, config: PartyConfig, now: number): PartyState {
  const question = currentQuestion(config, state);

  if (!question || state.questionOpenedAt === null) {
    return state;
  }

  const responses = { ...state.responses };

  for (const guest of Object.values(state.guests)) {
    const key = responseKey(guest.id, question.id);

    if (responses[key]) {
      continue;
    }

    responses[key] = {
      guestId: guest.id,
      questionId: question.id,
      selectedOptionId: null,
      status: "locked_timeout",
      submittedAt: now,
      lockedAt: now,
      responseDurationMs: null,
      submissionId: `timeout:${guest.id}:${question.id}`,
      isCorrect: false
    };
  }

  return {
    ...state,
    responses
  };
}

export function processPartyCommand(
  state: PartyState,
  command: PartyCommand,
  config: PartyConfig
): PartyCommandResult {
  if (state.phase === "finished" && command.type !== "RESET_LOCAL_PARTY") {
    return reject(
      state,
      domainError("party_finished", "The party is already finished.", {
        command: command.type
      })
    );
  }

  switch (command.type) {
    case "RESET_LOCAL_PARTY":
      return accept(createInitialPartyState(config), command.type);

    case "REGISTER_GUEST": {
      const displayName = command.displayName.replace(/\s+/g, " ").trim();

      if (!displayName) {
        return reject(
          state,
          domainError("command_not_allowed", "Guest display name is required.")
        );
      }

      const existing = state.guests[command.guestId];
      const nextGuest: GuestSession = {
        id: command.guestId,
        displayName,
        locale: command.locale,
        createdOrder: existing?.createdOrder ?? Object.keys(state.guests).length,
        isFixture: existing?.isFixture ?? false
      };

      if (
        existing &&
        existing.displayName === nextGuest.displayName &&
        existing.locale === nextGuest.locale &&
        existing.isFixture === nextGuest.isFixture
      ) {
        return acceptIdempotent(state, command.type);
      }

      return accept(
        {
          ...state,
          guests: {
            ...state.guests,
            [command.guestId]: nextGuest
          }
        },
        command.type
      );
    }

    case "PREPARE_FIRST_QUESTION":
      if (state.phase !== "lobby") {
        return reject(
          state,
          domainError("invalid_phase_transition", "First question can only be prepared from lobby.")
        );
      }

      if (!config.questions[0]) {
        return reject(state, domainError("question_not_found", "No enabled fixture question exists."));
      }

      return accept(
        {
          ...state,
          phase: "question_ready",
          currentQuestionIndex: 0,
          currentQuestionId: config.questions[0].id,
          questionOpenedAt: null,
          questionDeadlineAt: null,
          questionLockedAt: null,
          answerRevealedAt: null
        },
        command.type
      );

    case "OPEN_QUESTION": {
      if (state.phase !== "question_ready") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Question can only be opened from ready state.")
        );
      }

      const question = currentQuestion(config, state);

      if (!question) {
        return reject(state, domainError("question_not_found", "Current question was not found."));
      }

      return accept(
        {
          ...state,
          phase: "question_active",
          currentQuestionId: question.id,
          questionOpenedAt: command.now,
          questionDeadlineAt: command.now + config.questionDurationMs,
          questionLockedAt: null,
          answerRevealedAt: null
        },
        command.type
      );
    }

    case "LOCK_QUESTION": {
      if (state.phase !== "question_active") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Only an active question can be locked.")
        );
      }

      const lockedState = materializeTimeouts(
        {
          ...state,
          phase: "question_locked",
          questionLockedAt: command.now
        },
        config,
        command.now
      );

      return accept(lockedState, command.type);
    }

    case "REVEAL_ANSWER":
      if (state.phase !== "question_locked") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Answer can only be revealed after lock.")
        );
      }

      return accept(
        {
          ...state,
          phase: "answer_reveal",
          answerRevealedAt: command.now
        },
        command.type
      );

    case "SHOW_LEADERBOARD":
      if (state.phase !== "answer_reveal") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Leaderboard can only be shown after reveal.")
        );
      }

      return accept({ ...state, phase: "leaderboard" }, command.type);

    case "COMPLETE_PRESENTATION":
      if (state.phase !== "leaderboard") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Presentation can only complete from leaderboard.")
        );
      }

      return accept({ ...state, phase: "waiting_for_host" }, command.type);

    case "PREPARE_NEXT_QUESTION": {
      if (state.phase !== "waiting_for_host") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Next question can only be prepared while waiting.")
        );
      }

      const nextIndex = (state.currentQuestionIndex ?? -1) + 1;
      const question = config.questions[nextIndex];

      if (!question) {
        return reject(
          state,
          domainError("question_not_found", "There is no next fixture question.", {
            nextIndex
          })
        );
      }

      return accept(
        {
          ...state,
          phase: "question_ready",
          currentQuestionIndex: nextIndex,
          currentQuestionId: question.id,
          questionOpenedAt: null,
          questionDeadlineAt: null,
          questionLockedAt: null,
          answerRevealedAt: null
        },
        command.type
      );
    }

    case "FINISH_PARTY":
      if (state.phase !== "waiting_for_host" && state.phase !== "lobby") {
        return reject(
          state,
          domainError("invalid_phase_transition", "Party can only finish from lobby or waiting state.")
        );
      }

      return accept({ ...state, phase: "finished" }, command.type);

    case "SUBMIT_RESPONSE": {
      if (state.phase !== "question_active") {
        return reject(
          state,
          domainError("answer_window_closed", "Responses are accepted only while a question is active.")
        );
      }

      const guest = state.guests[command.guestId];

      if (!guest) {
        return reject(
          state,
          domainError("guest_not_registered", "Guest is not registered in the local party runtime.", {
            guestId: command.guestId
          })
        );
      }

      const question = currentQuestion(config, state);

      if (!question || question.id !== command.questionId) {
        return reject(
          state,
          domainError("no_active_question", "Submitted question does not match the active question.")
        );
      }

      if (state.questionOpenedAt === null || state.questionDeadlineAt === null) {
        return reject(state, domainError("no_active_question", "Active question timing is missing."));
      }

      if (command.receivedAt >= state.questionDeadlineAt) {
        return reject(
          state,
          domainError("deadline_reached", "Submission reached the runtime at or after the deadline.", {
            receivedAt: command.receivedAt,
            deadlineAt: state.questionDeadlineAt
          })
        );
      }

      if (!question.options.some((option) => option.id === command.selectedOptionId)) {
        return reject(
          state,
          domainError("invalid_option", "Selected option does not exist for the active question.")
        );
      }

      const key = responseKey(command.guestId, command.questionId);
      const existing = state.responses[key];

      if (existing) {
        if (
          existing.submissionId === command.submissionId &&
          existing.selectedOptionId === command.selectedOptionId
        ) {
          return acceptIdempotent(state, command.type);
        }

        return reject(
          state,
          domainError("response_already_locked", "This question already has a locked response.", {
            guestId: command.guestId,
            questionId: command.questionId
          })
        );
      }

      const response: LockedResponse = {
        guestId: command.guestId,
        questionId: command.questionId,
        selectedOptionId: command.selectedOptionId,
        status: "locked_answer",
        submittedAt: command.receivedAt,
        lockedAt: command.receivedAt,
        responseDurationMs: command.receivedAt - state.questionOpenedAt,
        submissionId: command.submissionId,
        isCorrect: command.selectedOptionId === question.correctOptionId
      };

      return accept(
        {
          ...state,
          responses: {
            ...state.responses,
            [key]: response
          }
        },
        command.type
      );
    }
  }
}
