import crypto from "node:crypto";

import {
  buildGuestProjection,
  buildSharedPartyProjection,
  createInitialPartyState,
  getApprovedPartyConfig,
  processPartyCommand,
  responseKey,
  selectLeaderboardRows,
  type PartyCommand,
  type PartyConfig,
  type PartyState
} from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";
import {
  fallbackAvatar,
  getAvatarInitials,
  isAvatarPresetId,
  type AvatarPresetId,
  type ParticipantAvatarProjection
} from "@/lib/party-avatar";
import { buildGuestWelcomePath } from "@/lib/party-remote/join-routing";
import type { RuntimePartyCommand } from "@/lib/party-runtime/runtime-contract";
import {
  getDefaultPartyJoinCode,
  getPartyDeploymentEnvironment,
  getPartyKey,
  getPublicAppUrl,
  isDefaultPartyTestMode
} from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

import type {
  ParticipantRow,
  PartySessionRow,
  QuestionResponseRow,
  RemoteNoSessionSnapshot,
  RemoteGuestSnapshot,
  RemotePartySnapshot,
  SessionHistoryItem
} from "./types";

type PartyBundle = {
  session: PartySessionRow;
  participants: ParticipantRow[];
  responses: QuestionResponseRow[];
  config: PartyConfig;
};

const avatarBucket = "party-avatars";
const avatarInfrastructureMigration = "202607160001_guest_avatar_foundation.sql";
const maxPreparedAvatarBytes = 524288;

export type ParticipantSession = {
  participantId: string;
  token: string;
};

const participantCookiePrefix = "participant:";

export type CertificateAvatar =
  | { type: "photo"; bytes: Uint8Array; mimeType: string }
  | { type: "preset"; presetId: AvatarPresetId }
  | { type: "fallback"; initials: string };

export type WinnerCertificateContext = {
  sessionId: string;
  participantId: string;
  displayName: string;
  locale: Locale;
  score: number;
  rank: 1;
  totalQuestions: number;
  eventDate: string | null;
  avatar: CertificateAvatar;
};

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
  const url = new URL(buildGuestWelcomePath(locale, publicJoinCode), getPublicAppUrl());
  return url.toString();
}

function getPartyContext() {
  return {
    partyKey: getPartyKey(),
    deploymentEnvironment: getPartyDeploymentEnvironment(),
    publicJoinCode: getDefaultPartyJoinCode(),
    isTest: isDefaultPartyTestMode()
  };
}

async function buildParticipantAvatarProjection(
  participant: ParticipantRow
): Promise<ParticipantAvatarProjection> {
  if (participant.avatar_type === "preset" && isAvatarPresetId(participant.avatar_preset_id)) {
    return {
      type: "preset",
      presetId: participant.avatar_preset_id
    };
  }

  if (participant.avatar_type === "photo" && participant.avatar_path) {
    const supabase = createSupabaseServiceClient();
    const signed = await supabase.storage
      .from(avatarBucket)
      .createSignedUrl(participant.avatar_path, 60 * 10);

    if (!signed.error && signed.data?.signedUrl) {
      return {
        type: "photo",
        url: signed.data.signedUrl
      };
    }
  }

  return fallbackAvatar(participant.display_name);
}

async function validateAvatarInfrastructure() {
  const supabase = createSupabaseServiceClient();
  const columns = await supabase
    .from("participants")
    .select("avatar_type, avatar_path, avatar_preset_id, avatar_updated_at")
    .limit(1);

  if (columns.error) {
    return {
      ok: false as const,
      error: {
        code: "avatar_infrastructure_missing" as const,
        message: `Avatar participant columns are missing. Apply Supabase migration ${avatarInfrastructureMigration}.`
      }
    };
  }

  const bucket = await supabase.storage.getBucket(avatarBucket);

  if (bucket.error || !bucket.data) {
    return {
      ok: false as const,
      error: {
        code: "avatar_infrastructure_missing" as const,
        message: `Private Supabase Storage bucket "${avatarBucket}" is missing. Apply Supabase migration ${avatarInfrastructureMigration}.`
      }
    };
  }

  const allowedMimeTypes = bucket.data.allowed_mime_types ?? [];

  if (
    bucket.data.public ||
    (bucket.data.file_size_limit ?? 0) < maxPreparedAvatarBytes ||
    !allowedMimeTypes.includes("image/webp") ||
    !allowedMimeTypes.includes("image/jpeg")
  ) {
    return {
      ok: false as const,
      error: {
        code: "avatar_infrastructure_missing" as const,
        message: `Supabase Storage bucket "${avatarBucket}" is not configured for private WebP/JPEG avatar uploads. Reapply migration ${avatarInfrastructureMigration}.`
      }
    };
  }

  return { ok: true as const };
}

async function applyParticipantAvatarsToLeaderboard(
  projection: ReturnType<typeof buildSharedPartyProjection>,
  participants: ParticipantRow[]
) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const avatarEntries = await Promise.all(
    projection.leaderboard.map(async (row) => {
      const participant = participantMap.get(row.guestId);
      return [
        row.guestId,
        participant ? await buildParticipantAvatarProjection(participant) : fallbackAvatar(row.displayName)
      ] as const;
    })
  );
  const avatarMap = new Map(avatarEntries);

  return {
    ...projection,
    leaderboard: projection.leaderboard.map((row) => ({
      ...row,
      avatar: avatarMap.get(row.guestId) ?? fallbackAvatar(row.displayName)
    }))
  };
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
  const nextStatus = state.phase === "finished" ? "finished" : status;

  return {
    status: nextStatus,
    phase: state.phase,
    current_question_index: state.currentQuestionIndex,
    current_question_id: state.currentQuestionId,
    question_opened_at: isoFromMs(state.questionOpenedAt),
    question_deadline_at: isoFromMs(state.questionDeadlineAt),
    question_locked_at: isoFromMs(state.questionLockedAt),
    answer_revealed_at: isoFromMs(state.answerRevealedAt),
    // Keep a finished session current so display and guest surfaces can retain the
    // authoritative winner celebration and certificate access until it is archived.
    is_current: true,
    started_at: undefined as string | undefined,
    finished_at: nextStatus === "finished" ? new Date().toISOString() : undefined,
    revision: state.revision,
    last_command_id: state.lastAcceptedCommand,
    updated_at: new Date().toISOString()
  };
}

export async function loadCurrentPartySession() {
  const supabase = createSupabaseServiceClient();
  const context = getPartyContext();

  const existing = await supabase
    .from("party_sessions")
    .select("*")
    .eq("party_key", context.partyKey)
    .eq("deployment_environment", context.deploymentEnvironment)
    .eq("is_current", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<PartySessionRow>();

  if (existing.error) {
    throw existing.error;
  }

  return existing.data;
}

export async function createPartySession(
  idempotencyKey: string,
  options: { label?: string | null; archiveExisting?: boolean } = {}
) {
  const supabase = createSupabaseServiceClient();
  const context = getPartyContext();
  const inserted = await supabase.rpc("create_party_session", {
    p_party_key: context.partyKey,
    p_deployment_environment: context.deploymentEnvironment,
    p_public_join_code: context.publicJoinCode,
    p_is_test: context.isTest,
    p_idempotency_key: idempotencyKey,
    p_session_label: options.label ?? null,
    p_archive_existing: options.archiveExisting ?? false
  });

  if (inserted.error) {
    throw inserted.error;
  }

  return inserted.data as PartySessionRow;
}

export async function archivePartySession(sessionId: string) {
  const supabase = createSupabaseServiceClient();
  const context = getPartyContext();
  const archived = await supabase.rpc("archive_party_session", {
    p_session_id: sessionId,
    p_party_key: context.partyKey,
    p_deployment_environment: context.deploymentEnvironment
  });

  if (archived.error) {
    throw archived.error;
  }

  return archived.data as PartySessionRow;
}

export async function listSessionHistory(limit = 12): Promise<SessionHistoryItem[]> {
  const supabase = createSupabaseServiceClient();
  const context = getPartyContext();
  const sessions = await supabase
    .from("party_sessions")
    .select("*")
    .eq("party_key", context.partyKey)
    .eq("deployment_environment", context.deploymentEnvironment)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<PartySessionRow[]>();

  if (sessions.error) {
    throw sessions.error;
  }

  const ids = sessions.data.map((session) => session.id);

  if (ids.length === 0) {
    return [];
  }

  const [participants, responses, commands] = await Promise.all([
    supabase.from("participants").select("party_session_id").in("party_session_id", ids),
    supabase.from("question_responses").select("party_session_id").in("party_session_id", ids),
    supabase.from("host_command_log").select("party_session_id").in("party_session_id", ids)
  ]);

  if (participants.error) {
    throw participants.error;
  }
  if (responses.error) {
    throw responses.error;
  }
  if (commands.error) {
    throw commands.error;
  }

  function counts(rows: { party_session_id: string }[]) {
    const map = new Map<string, number>();

    for (const row of rows) {
      map.set(row.party_session_id, (map.get(row.party_session_id) ?? 0) + 1);
    }

    return map;
  }

  const participantCounts = counts(participants.data ?? []);
  const responseCounts = counts(responses.data ?? []);
  const commandCounts = counts(commands.data ?? []);

  return sessions.data.map((session) => ({
    id: session.id,
    publicJoinCode: session.public_join_code,
    status: session.status,
    phase: session.phase,
    revision: session.revision,
    currentQuestionIndex: session.current_question_index,
    currentQuestionId: session.current_question_id,
    isTest: session.is_test,
    isCurrent: session.is_current,
    label: session.session_label,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    finishedAt: session.finished_at,
    archivedAt: session.archived_at,
    participantCount: participantCounts.get(session.id) ?? 0,
    responseCount: responseCounts.get(session.id) ?? 0,
    hostCommandCount: commandCounts.get(session.id) ?? 0
  }));
}

export async function loadPartyBundle(sessionId?: string): Promise<PartyBundle> {
  const supabase = createSupabaseServiceClient();
  const session = sessionId
    ? await supabase.from("party_sessions").select("*").eq("id", sessionId).single<PartySessionRow>()
    : { data: await loadCurrentPartySession(), error: null };

  if (session.error) {
    throw session.error;
  }

  if (!session.data) {
    throw new Error("no_active_session");
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
    config: getApprovedPartyConfig()
  };
}

async function persistSessionState(
  bundle: PartyBundle,
  state: PartyState,
  expectedRevision: number
) {
  const supabase = createSupabaseServiceClient();
  const patch = partyStateToSessionPatch(state, bundle.session.status);

  if (!bundle.session.started_at && state.phase !== "lobby") {
    patch.started_at = new Date().toISOString();
  }

  const updated = await supabase
    .from("party_sessions")
    .update(patch)
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
): Promise<RemotePartySnapshot | RemoteGuestSnapshot | RemoteNoSessionSnapshot> {
  const session = await loadCurrentPartySession();

  if (!session) {
    const context = getPartyContext();
    return {
      mode: "remote",
      configured: true,
      session: null,
      reason: "no_active_session",
      context,
      connection: "connected",
      serverNow: Date.now()
    };
  }

  const bundle = await autoLockExpiredQuestion(await loadPartyBundle(session.id));
  const state = rowToPartyState(bundle);
  const now = Date.now();
  const sharedProjection = await applyParticipantAvatarsToLeaderboard(
    buildSharedPartyProjection(state, bundle.config, now),
    bundle.participants
  );
  const base: RemotePartySnapshot = {
    mode: "remote",
    configured: true,
    session: {
      id: bundle.session.id,
      publicJoinCode: bundle.session.public_join_code,
      partyKey: bundle.session.party_key,
      deploymentEnvironment: bundle.session.deployment_environment,
      status: bundle.session.status,
      phase: bundle.session.phase,
      revision: bundle.session.revision,
      isTest: bundle.session.is_test,
      isCurrent: bundle.session.is_current,
      label: bundle.session.session_label,
      createdAt: bundle.session.created_at,
      updatedAt: bundle.session.updated_at,
      finishedAt: bundle.session.finished_at,
      archivedAt: bundle.session.archived_at
    },
    projection: sharedProjection,
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
          locale: participant.locale,
          avatar: await buildParticipantAvatarProjection(participant)
        }
      : null
  };
}

function avatarObjectPath(
  participant: ParticipantRow,
  extension: "webp" | "jpg"
) {
  const context = getPartyContext();
  return `${context.deploymentEnvironment}/${participant.party_session_id}/${participant.id}/avatar.${extension}`;
}

export async function updateParticipantPresetAvatar(
  participantSession: ParticipantSession | null,
  presetId: AvatarPresetId
) {
  const currentSession = await loadCurrentPartySession();

  if (!currentSession) {
    return {
      ok: false as const,
      error: {
        code: "party_not_found" as const,
        message: "No active party session is open."
      }
    };
  }

  const participant = await validateParticipantSession(currentSession.id, participantSession);

  if (!participant) {
    return {
      ok: false as const,
      error: {
        code: "invalid_participant_session" as const,
        message: "Please rejoin the party on this phone."
      }
    };
  }

  if (!currentSession.is_current || currentSession.status === "finished") {
    return {
      ok: false as const,
      error: {
        code: "join_closed" as const,
        message: "Avatar changes are closed for this party session."
      }
    };
  }

  const avatarInfrastructure = await validateAvatarInfrastructure();

  if (!avatarInfrastructure.ok) {
    return avatarInfrastructure;
  }

  const supabase = createSupabaseServiceClient();
  const updated = await supabase
    .from("participants")
    .update({
      avatar_type: "preset",
      avatar_path: null,
      avatar_preset_id: presetId,
      avatar_updated_at: new Date().toISOString()
    })
    .eq("id", participant.id)
    .eq("party_session_id", currentSession.id)
    .select("*")
    .single<ParticipantRow>();

  if (updated.error) {
    throw updated.error;
  }

  await supabase.rpc("touch_party_session_response", {
    p_session_id: currentSession.id
  });

  return {
    ok: true as const,
    participant: updated.data,
    avatar: await buildParticipantAvatarProjection(updated.data),
    snapshot: await buildRemotePartySnapshot(participantSession)
  };
}

export async function updateParticipantPhotoAvatar(
  participantSession: ParticipantSession | null,
  bytes: ArrayBuffer,
  mimeType: "image/webp" | "image/jpeg"
) {
  const currentSession = await loadCurrentPartySession();

  if (!currentSession) {
    return {
      ok: false as const,
      error: {
        code: "party_not_found" as const,
        message: "No active party session is open."
      }
    };
  }

  const participant = await validateParticipantSession(currentSession.id, participantSession);

  if (!participant) {
    return {
      ok: false as const,
      error: {
        code: "invalid_participant_session" as const,
        message: "Please rejoin the party on this phone."
      }
    };
  }

  if (!currentSession.is_current || currentSession.status === "finished") {
    return {
      ok: false as const,
      error: {
        code: "join_closed" as const,
        message: "Avatar changes are closed for this party session."
      }
    };
  }

  const avatarInfrastructure = await validateAvatarInfrastructure();

  if (!avatarInfrastructure.ok) {
    return avatarInfrastructure;
  }

  const supabase = createSupabaseServiceClient();
  const extension = mimeType === "image/webp" ? "webp" : "jpg";
  const objectPath = avatarObjectPath(participant, extension);
  const uploaded = await supabase.storage
    .from(avatarBucket)
    .upload(objectPath, bytes, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: true
    });

  if (uploaded.error) {
    return {
      ok: false as const,
      error: {
        code: "avatar_upload_failed" as const,
        message: "We could not save the avatar yet. Please try again."
      }
    };
  }

  const updated = await supabase
    .from("participants")
    .update({
      avatar_type: "photo",
      avatar_path: objectPath,
      avatar_preset_id: null,
      avatar_updated_at: new Date().toISOString()
    })
    .eq("id", participant.id)
    .eq("party_session_id", currentSession.id)
    .select("*")
    .single<ParticipantRow>();

  if (updated.error) {
    return {
      ok: false as const,
      error: {
        code: "avatar_upload_failed" as const,
        message: "We could not save the avatar yet. Please try again."
      }
    };
  }

  await supabase.rpc("touch_party_session_response", {
    p_session_id: currentSession.id
  });

  return {
    ok: true as const,
    participant: updated.data,
    avatar: await buildParticipantAvatarProjection(updated.data),
    snapshot: await buildRemotePartySnapshot(participantSession)
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

export async function loadWinnerCertificateContext(
  participantSession: ParticipantSession | null
): Promise<
  | { ok: true; context: WinnerCertificateContext }
  | {
      ok: false;
      status: 401 | 403 | 409;
      error: "unauthenticated" | "quiz_not_finished" | "not_winner";
    }
> {
  if (!participantSession) {
    return { ok: false, status: 401, error: "unauthenticated" };
  }

  const supabase = createSupabaseServiceClient();
  const participantResult = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantSession.participantId)
    .eq("resume_token_hash", hashResumeToken(participantSession.token))
    .maybeSingle<ParticipantRow>();

  if (participantResult.error) {
    throw participantResult.error;
  }

  const participant = participantResult.data;

  if (!participant) {
    return { ok: false, status: 401, error: "unauthenticated" };
  }

  const sessionResult = await supabase
    .from("party_sessions")
    .select("*")
    .eq("id", participant.party_session_id)
    .eq("party_key", getPartyKey())
    .eq("deployment_environment", getPartyDeploymentEnvironment())
    .maybeSingle<PartySessionRow>();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (!sessionResult.data || sessionResult.data.phase !== "finished") {
    return { ok: false, status: 409, error: "quiz_not_finished" };
  }

  const bundle = await loadPartyBundle(sessionResult.data.id);
  const state = rowToPartyState(bundle);
  const winner = selectLeaderboardRows(state)[0];

  if (!winner || winner.guestId !== participant.id) {
    return { ok: false, status: 403, error: "not_winner" };
  }

  let avatar: CertificateAvatar = {
    type: "fallback",
    initials: getAvatarInitials(participant.display_name)
  };

  if (participant.avatar_type === "preset" && isAvatarPresetId(participant.avatar_preset_id)) {
    avatar = { type: "preset", presetId: participant.avatar_preset_id };
  } else if (participant.avatar_type === "photo" && participant.avatar_path) {
    const downloaded = await supabase.storage.from(avatarBucket).download(participant.avatar_path);

    if (!downloaded.error && downloaded.data) {
      avatar = {
        type: "photo",
        bytes: new Uint8Array(await downloaded.data.arrayBuffer()),
        mimeType: downloaded.data.type || "application/octet-stream"
      };
    } else {
      console.warn("certificate_avatar_fallback", {
        participantId: participant.id,
        reason: "private_avatar_download_failed"
      });
    }
  }

  return {
    ok: true,
    context: {
      sessionId: bundle.session.id,
      participantId: participant.id,
      displayName: participant.display_name,
      locale: participant.locale,
      score: winner.score,
      rank: 1,
      totalQuestions: bundle.config.questions.length,
      eventDate: process.env.CERTIFICATE_EVENT_DATE?.trim() || null,
      avatar
    }
  };
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

  const session = await loadCurrentPartySession();

  if (!session) {
    return {
      ok: false as const,
      error: {
        code: "party_not_found" as const,
        message: "No active party session is open yet."
      }
    };
  }

  if (!session.is_current || session.status !== "active" || session.phase === "finished") {
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
  const currentSession = await loadCurrentPartySession();

  if (!currentSession) {
    return {
      ok: false as const,
      error: {
        code: "party_not_found" as const,
        message: "No active party session is open."
      }
    };
  }

  const bundle = await autoLockExpiredQuestion(await loadPartyBundle(currentSession.id));
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
  const currentSession = await loadCurrentPartySession();

  if (!currentSession) {
    return {
      ok: false as const,
      error: {
        code: "party_not_found" as const,
        message: "No active party session is open.",
        revision: 0
      },
      snapshot: await buildRemotePartySnapshot()
    };
  }

  const bundle = await autoLockExpiredQuestion(await loadPartyBundle(currentSession.id));
  const duplicate = await loadHostCommand(bundle.session.id, commandId);

  if (duplicate) {
    return {
      ok: duplicate.status === "accepted",
      error:
        duplicate.status === "accepted"
          ? undefined
          : {
              code: "invalid_transition" as const,
              message: duplicate.error_code ?? "That host action was already handled.",
              revision: bundle.session.revision
            },
      snapshot: await buildRemotePartySnapshot()
    };
  }

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

  // Leave a short delivery allowance so all room surfaces can receive the
  // authoritative phase before the visible 20-second countdown decreases.
  // Clients cap the allowance at the configured question duration; the
  // persisted deadline remains the only response-acceptance boundary.
  const persistedState =
    command.type === "REVEAL_CHOICES" && result.state.questionDeadlineAt !== null
      ? { ...result.state, questionDeadlineAt: result.state.questionDeadlineAt + 3_000 }
      : result.state;
  const updated = await persistSessionState(bundle, persistedState, expectedRevision);

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

  await persistTimeoutResponses(bundle, persistedState);
  await recordHostCommand(
    bundle,
    commandId,
    command.type,
    expectedRevision,
    persistedState.revision,
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

async function loadHostCommand(partySessionId: string, commandId: string) {
  const supabase = createSupabaseServiceClient();
  const command = await supabase
    .from("host_command_log")
    .select("status, error_code, accepted_revision")
    .eq("party_session_id", partySessionId)
    .eq("command_id", commandId)
    .maybeSingle<{
      status: "accepted" | "duplicate" | "rejected";
      error_code: string | null;
      accepted_revision: number | null;
    }>();

  if (command.error) {
    throw command.error;
  }

  return command.data;
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
