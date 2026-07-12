import crypto from "node:crypto";

import {
  buildGuestProjection,
  buildSharedPartyProjection,
  createInitialPartyState,
  getDevelopmentPartyConfig,
  processPartyCommand,
  responseKey,
  type PartyCommand,
  type PartyConfig,
  type PartyState
} from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import type { RuntimePartyCommand } from "@/lib/party-runtime/runtime-contract";
import {
  getDefaultPartyJoinCode,
  getPublicAppUrl,
  isDefaultPartyTestMode
} from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

import type {
  ParticipantRow,
  PartySessionRow,
  QuestionResponseRow,
  RemoteGuestSnapshot,
  RemotePartySnapshot
} from "./types";

type PartyBundle = {
  session: PartySessionRow;
  participants: ParticipantRow[];
  responses: QuestionResponseRow[];
  config: PartyConfig;
};

export type ParticipantSession = {
  participantId: string;
  token: string;
};

const participantCookiePrefix = "participant:";

function msFromIso(value: string | null) {
  return value ? new Date(value).getTime() : null;
}

function isoFromMs(value: number | null) {
  return value === null ? null : new Date(value).toISOString();
}

function normalizeDisplayName(displayName: string) {
  return displayName.replace(/\s+/g, " ").trim();
}

export function createResumeToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashResumeToken(token: string) {
  return crypto.createHash("sha256").update(`${participantCookiePrefix}${token}`).digest("hex");
}

export function createParticipantCookieValue(participantId: string, token: string) {
  return `${participantId}.${token}`;
}

export function parseParticipantCookieValue(value: string | undefined): ParticipantSession | null {
  if (!value) {
    return null;
  }

  const [participantId, token] = value.split(".");

  if (!participantId || !token) {
    return null;
  }

  return { participantId, token };
}

function buildJoinUrl(publicJoinCode: string, locale: Locale = "en") {
  const url = new URL(`/${locale}/play`, getPublicAppUrl());
  url.searchParams.set("join", publicJoinCode);
  return url.toString();
}

function rowToPartyState(bundle: PartyBundle): PartyState {
  const state = createInitialPartyState({
    ...bundle.config,
    fixtureGuests: []
  });
  const sortedParticipants = [...bundle.participants].sort((a, b) =>
    a.joined_at.localeCompare(b.joined_at)
  );
  const guests = Object.fromEntries(
    sortedParticipants.map((participant, index) => [
      participant.id,
      {
        id: participant.id,
        displayName: participant.display_name,
        locale: participant.locale,
        createdOrder: index,
        isFixture: participant.is_test
      }
    ])
  );
  const responses = Object.fromEntries(
    bundle.responses.map((response) => [
      responseKey(response.participant_id, response.question_id),
      {
        guestId: response.participant_id,
        questionId: response.question_id,
        selectedOptionId: response.selected_option_id,
        status: response.status,
        submittedAt: new Date(response.submitted_at).getTime(),
        lockedAt: new Date(response.locked_at).getTime(),
        responseDurationMs: response.response_duration_ms,
        submissionId: response.submission_id,
        isCorrect: response.is_correct
      }
    ])
  );

  return {
    ...state,
    sessionId: bundle.session.id,
    phase: bundle.session.phase,
    currentQuestionIndex: bundle.session.current_question_index,
    currentQuestionId: bundle.session.current_question_id,
    questionOpenedAt: msFromIso(bundle.session.question_opened_at),
    questionDeadlineAt: msFromIso(bundle.session.question_deadline_at),
    questionLockedAt: msFromIso(bundle.session.question_locked_at),
    answerRevealedAt: msFromIso(bundle.session.answer_revealed_at),
    responses,
    guests,
    revision: bundle.session.revision,
    lastAcceptedCommand: bundle.session.last_command_id,
    lastError: null
  };
}

function partyStateToSessionPatch(state: PartyState, status: PartySessionRow["status"]) {
  return {
    status: state.phase === "finished" ? "finished" : status,
    phase: state.phase,
    current_question_index: state.currentQuestionIndex,
    current_question_id: state.currentQuestionId,
    question_opened_at: isoFromMs(state.questionOpenedAt),
    question_deadline_at: isoFromMs(state.questionDeadlineAt),
    question_locked_at: isoFromMs(state.questionLockedAt),
    answer_revealed_at: isoFromMs(state.answerRevealedAt),
    revision: state.revision,
    last_command_id: state.lastAcceptedCommand,
    updated_at: new Date().toISOString()
  };
}

export async function ensureActivePartySession() {
  const supabase = createSupabaseServiceClient();
  const publicJoinCode = getDefaultPartyJoinCode();
  const isTest = isDefaultPartyTestMode();

  const existing = await supabase
    .from("party_sessions")
    .select("*")
    .eq("public_join_code", publicJoinCode)
    .maybeSingle<PartySessionRow>();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    return existing.data;
  }

  const inserted = await supabase
    .from("party_sessions")
    .insert({
      public_join_code: publicJoinCode,
      status: "active",
      phase: "lobby",
      display_locale: "en",
      is_test: isTest
    })
    .select("*")
    .single<PartySessionRow>();

  if (inserted.error) {
    throw inserted.error;
  }

  return inserted.data;
}

export async function loadPartyBundle(sessionId?: string): Promise<PartyBundle> {
  const supabase = createSupabaseServiceClient();
  const session = sessionId
    ? await supabase.from("party_sessions").select("*").eq("id", sessionId).single<PartySessionRow>()
    : { data: await ensureActivePartySession(), error: null };

  if (session.error) {
    throw session.error;
  }

  const [participants, responses] = await Promise.all([
    supabase
      .from("participants")
      .select("*")
      .eq("party_session_id", session.data.id)
      .order("joined_at", { ascending: true })
      .returns<ParticipantRow[]>(),
    supabase
      .from("question_responses")
      .select("*")
      .eq("party_session_id", session.data.id)
      .returns<QuestionResponseRow[]>()
  ]);

  if (participants.error) {
    throw participants.error;
  }

  if (responses.error) {
    throw responses.error;
  }

  return {
    session: session.data,
    participants: participants.data,
    responses: responses.data,
    config: getDevelopmentPartyConfig()
  };
}

async function persistSessionState(
  bundle: PartyBundle,
  state: PartyState,
  expectedRevision: number
) {
  const supabase = createSupabaseServiceClient();
  const updated = await supabase
    .from("party_sessions")
    .update(partyStateToSessionPatch(state, bundle.session.status))
    .eq("id", bundle.session.id)
    .eq("revision", expectedRevision)
    .select("*")
    .maybeSingle<PartySessionRow>();

  if (updated.error) {
    throw updated.error;
  }

  return updated.data;
}

async function persistTimeoutResponses(bundle: PartyBundle, state: PartyState) {
  const questionId = state.currentQuestionId;

  if (!questionId) {
    return;
  }

  const existingKeys = new Set(
    bundle.responses.map((response) =>
      responseKey(response.participant_id, response.question_id)
    )
  );
  const timeoutRows = Object.values(state.responses)
    .filter(
      (response) =>
        response.questionId === questionId &&
        response.status === "locked_timeout" &&
        !existingKeys.has(responseKey(response.guestId, response.questionId))
    )
    .map((response) => ({
      party_session_id: bundle.session.id,
      participant_id: response.guestId,
      question_id: response.questionId,
      selected_option_id: null,
      status: "locked_timeout",
      submitted_at: isoFromMs(response.submittedAt),
      locked_at: isoFromMs(response.lockedAt),
      response_duration_ms: null,
      is_correct: false,
      submission_id: response.submissionId,
      is_test: bundle.session.is_test
    }));

  if (timeoutRows.length === 0) {
    return;
  }

  const supabase = createSupabaseServiceClient();
  const result = await supabase
    .from("question_responses")
    .upsert(timeoutRows, {
      onConflict: "party_session_id,participant_id,question_id",
      ignoreDuplicates: true
    });

  if (result.error) {
    throw result.error;
  }
}

export async function buildRemotePartySnapshot(
  participantSession?: ParticipantSession | null
): Promise<RemotePartySnapshot | RemoteGuestSnapshot> {
  const bundle = await autoLockExpiredQuestion(await loadPartyBundle());
  const state = rowToPartyState(bundle);
  const now = Date.now();
  const base: RemotePartySnapshot = {
    mode: "remote",
    configured: true,
    session: {
      id: bundle.session.id,
      publicJoinCode: bundle.session.public_join_code,
      status: bundle.session.status,
      phase: bundle.session.phase,
      revision: bundle.session.revision,
      isTest: bundle.session.is_test
    },
    projection: buildSharedPartyProjection(state, bundle.config, now),
    joinUrl: buildJoinUrl(bundle.session.public_join_code, bundle.session.display_locale),
    connection: "connected",
    serverNow: now
  };

  if (!participantSession) {
    return base;
  }

  const participant = await validateParticipantSession(
    bundle.session.id,
    participantSession
  );

  return {
    ...base,
    guest: participant
      ? buildGuestProjection(state, bundle.config, participant.id, now)
      : null,
    participant: participant
      ? {
          id: participant.id,
          displayName: participant.display_name,
          locale: participant.locale
        }
      : null
  };
}

export async function validateParticipantSession(
  partySessionId: string,
  participantSession: ParticipantSession | null
) {
  if (!participantSession) {
    return null;
  }

  const supabase = createSupabaseServiceClient();
  const tokenHash = hashResumeToken(participantSession.token);
  const participant = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantSession.participantId)
    .eq("party_session_id", partySessionId)
    .eq("resume_token_hash", tokenHash)
    .maybeSingle<ParticipantRow>();

  if (participant.error) {
    throw participant.error;
  }

  if (!participant.data) {
    return null;
  }

  await supabase
    .from("participants")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", participant.data.id);

  return participant.data;
}

export async function joinActiveParty(displayNameInput: string, locale: Locale) {
  const displayName = normalizeDisplayName(displayNameInput);

  if (!displayName || displayName.length > 40) {
    return {
      ok: false as const,
      error: {
        code: "invalid_name" as const,
        message: "Please enter a display name between 1 and 40 characters."
      }
    };
  }

  const session = await ensureActivePartySession();

  if (session.status !== "active" || session.phase === "finished") {
    return {
      ok: false as const,
      error: {
        code: "join_closed" as const,
        message: "Joining is closed for this party session."
      }
    };
  }

  const supabase = createSupabaseServiceClient();
  const token = createResumeToken();
  const inserted = await supabase
    .from("participants")
    .insert({
      party_session_id: session.id,
      display_name: displayName,
      locale,
      resume_token_hash: hashResumeToken(token),
      is_test: session.is_test
    })
    .select("*")
    .single<ParticipantRow>();

  if (inserted.error) {
    throw inserted.error;
  }

  return {
    ok: true as const,
    participant: inserted.data,
    token,
    snapshot: await buildRemotePartySnapshot({
      participantId: inserted.data.id,
      token
    })
  };
}

export async function submitRemoteResponse(
  participantSession: ParticipantSession | null,
  selectedOptionId: string,
  submissionId: string
) {
  const bundle = await autoLockExpiredQuestion(await loadPartyBundle());
  const participant = await validateParticipantSession(bundle.session.id, participantSession);

  if (!participant) {
    return {
      ok: false as const,
      error: {
        code: "invalid_participant_session" as const,
        message: "Please rejoin the party on this phone."
      }
    };
  }

  const state = rowToPartyState(bundle);
  const questionId = state.currentQuestionId;

  if (!questionId) {
    return {
      ok: false as const,
      error: {
        code: "question_not_active" as const,
        message: "There is no active question right now."
      }
    };
  }

  const command: PartyCommand = {
    type: "SUBMIT_RESPONSE",
    guestId: participant.id,
    questionId,
    selectedOptionId,
    submissionId,
    receivedAt: Date.now()
  };
  const result = processPartyCommand(state, command, bundle.config);

  if (!result.ok) {
    return {
      ok: false as const,
      error: {
        code:
          result.error.code === "deadline_reached"
            ? "deadline_reached"
            : result.error.code === "response_already_locked"
              ? "response_already_locked"
              : "question_not_active",
        message: result.error.message,
        revision: state.revision
      }
    };
  }

  const response = result.state.responses[responseKey(participant.id, questionId)];
  const supabase = createSupabaseServiceClient();
  const inserted = await supabase
    .from("question_responses")
    .insert({
      party_session_id: bundle.session.id,
      participant_id: participant.id,
      question_id: response.questionId,
      selected_option_id: response.selectedOptionId,
      status: response.status,
      submitted_at: isoFromMs(response.submittedAt),
      locked_at: isoFromMs(response.lockedAt),
      response_duration_ms: response.responseDurationMs,
      is_correct: response.isCorrect,
      submission_id: response.submissionId,
      is_test: bundle.session.is_test
    })
    .select("*")
    .maybeSingle<QuestionResponseRow>();

  if (inserted.error) {
    const current = bundle.responses.find(
      (existing) =>
        existing.participant_id === participant.id &&
        existing.question_id === questionId &&
        existing.submission_id === submissionId &&
        existing.selected_option_id === selectedOptionId
    );

    if (!current) {
      return {
        ok: false as const,
        error: {
          code: "response_already_locked" as const,
          message: "This question already has a locked answer.",
          revision: state.revision
        }
      };
    }
  }

  if (inserted.data) {
    await supabase.rpc("touch_party_session_response", {
      p_session_id: bundle.session.id
    });
  }

  return {
    ok: true as const,
    snapshot: await buildRemotePartySnapshot(participantSession)
  };
}

export async function runHostCommand(
  command: RuntimePartyCommand,
  expectedRevision: number,
  commandId: string
) {
  const bundle = await autoLockExpiredQuestion(await loadPartyBundle());
  const state = rowToPartyState(bundle);

  if (state.revision !== expectedRevision) {
    return {
      ok: false as const,
      error: {
        code: "stale_revision" as const,
        message: "Party state changed. Refreshing the host controller.",
        revision: state.revision
      },
      snapshot: await buildRemotePartySnapshot()
    };
  }

  const now = Date.now();
  const timedCommand =
    command.type === "SUBMIT_RESPONSE"
      ? null
      : ({ ...command, now } as PartyCommand);

  if (!timedCommand || timedCommand.type === "REGISTER_GUEST" || timedCommand.type === "RESET_LOCAL_PARTY") {
    return {
      ok: false as const,
      error: {
        code: "invalid_transition" as const,
        message: "That command is not available on the production host controller.",
        revision: state.revision
      },
      snapshot: await buildRemotePartySnapshot()
    };
  }

  const result = processPartyCommand(state, timedCommand, bundle.config);

  if (!result.ok) {
    await recordHostCommand(bundle, commandId, command.type, expectedRevision, null, "rejected", result.error.code);

    return {
      ok: false as const,
      error: {
        code: "invalid_transition" as const,
        message: result.error.message,
        revision: state.revision
      },
      snapshot: await buildRemotePartySnapshot()
    };
  }

  const updated = await persistSessionState(bundle, result.state, expectedRevision);

  if (!updated) {
    return {
      ok: false as const,
      error: {
        code: "stale_revision" as const,
        message: "Party state changed before the command could be saved.",
        revision: state.revision
      },
      snapshot: await buildRemotePartySnapshot()
    };
  }

  await persistTimeoutResponses(bundle, result.state);
  await recordHostCommand(
    bundle,
    commandId,
    command.type,
    expectedRevision,
    result.state.revision,
    "accepted",
    null
  );

  return {
    ok: true as const,
    snapshot: await buildRemotePartySnapshot()
  };
}

async function recordHostCommand(
  bundle: PartyBundle,
  commandId: string,
  commandType: string,
  expectedRevision: number,
  acceptedRevision: number | null,
  status: "accepted" | "duplicate" | "rejected",
  errorCode: string | null
) {
  const supabase = createSupabaseServiceClient();
  await supabase.from("host_command_log").upsert(
    {
      party_session_id: bundle.session.id,
      command_id: commandId,
      command_type: commandType,
      expected_revision: expectedRevision,
      accepted_revision: acceptedRevision,
      status,
      error_code: errorCode,
      is_test: bundle.session.is_test
    },
    { onConflict: "party_session_id,command_id", ignoreDuplicates: true }
  );
}

async function autoLockExpiredQuestion(bundle: PartyBundle): Promise<PartyBundle> {
  if (bundle.session.phase !== "question_active" || !bundle.session.question_deadline_at) {
    return bundle;
  }

  if (Date.now() < new Date(bundle.session.question_deadline_at).getTime()) {
    return bundle;
  }

  const state = rowToPartyState(bundle);
  const result = processPartyCommand(
    state,
    { type: "LOCK_QUESTION", now: Date.now(), reason: "deadline" },
    bundle.config
  );

  if (!result.ok) {
    return bundle;
  }

  const updated = await persistSessionState(bundle, result.state, state.revision);

  if (!updated) {
    return loadPartyBundle(bundle.session.id);
  }

  await persistTimeoutResponses(bundle, result.state);
  return loadPartyBundle(bundle.session.id);
}
