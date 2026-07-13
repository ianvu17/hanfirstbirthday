import type {
  GuestProjection,
  SharedPartyProjection
} from "@/lib/party-engine";
import type { Locale } from "@/lib/i18n/routing";

export type RemoteConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline"
  | "stale"
  | "error";

export type PartySessionRow = {
  id: string;
  public_join_code: string;
  party_key: string;
  deployment_environment: "development" | "preview" | "production";
  status: "draft" | "active" | "finished" | "archived";
  phase:
    | "lobby"
    | "question_ready"
    | "question_active"
    | "question_locked"
    | "answer_reveal"
    | "leaderboard"
    | "waiting_for_host"
    | "finished";
  current_question_index: number | null;
  current_question_id: string | null;
  question_opened_at: string | null;
  question_deadline_at: string | null;
  question_locked_at: string | null;
  answer_revealed_at: string | null;
  display_locale: Locale;
  is_test: boolean;
  is_current: boolean;
  revision: number;
  last_command_id: string | null;
  session_label: string | null;
  create_idempotency_key: string | null;
  started_at: string | null;
  finished_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ParticipantRow = {
  id: string;
  party_session_id: string;
  display_name: string;
  locale: Locale;
  resume_token_hash: string;
  joined_at: string;
  last_seen_at: string;
  is_test: boolean;
};

export type QuestionResponseRow = {
  id: string;
  party_session_id: string;
  participant_id: string;
  question_id: string;
  selected_option_id: string | null;
  status: "locked_answer" | "locked_timeout";
  submitted_at: string;
  locked_at: string;
  response_duration_ms: number | null;
  is_correct: boolean;
  submission_id: string;
  is_test: boolean;
};

export type SessionHistoryItem = {
  id: string;
  publicJoinCode: string;
  status: PartySessionRow["status"];
  phase: PartySessionRow["phase"];
  revision: number;
  currentQuestionIndex: number | null;
  currentQuestionId: string | null;
  isTest: boolean;
  isCurrent: boolean;
  label: string | null;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  archivedAt: string | null;
  participantCount: number;
  responseCount: number;
  hostCommandCount: number;
};

export type SessionManagementSnapshot = {
  current: RemotePartySnapshot | RemoteNoSessionSnapshot;
  recentSessions: SessionHistoryItem[];
};

export type RemotePartySnapshot = {
  mode: "remote";
  configured: true;
  reason?: never;
  session: {
    id: string;
    publicJoinCode: string;
    partyKey: string;
    deploymentEnvironment: PartySessionRow["deployment_environment"];
    status: PartySessionRow["status"];
    phase: PartySessionRow["phase"];
    revision: number;
    isTest: boolean;
    isCurrent: boolean;
    label: string | null;
    createdAt: string;
    updatedAt: string;
    finishedAt: string | null;
    archivedAt: string | null;
  };
  projection: SharedPartyProjection;
  joinUrl: string;
  connection: RemoteConnectionState;
  serverNow: number;
};

export type RemoteNoSessionSnapshot = {
  mode: "remote";
  configured: true;
  session: null;
  reason: "no_active_session";
  context: {
    partyKey: string;
    deploymentEnvironment: PartySessionRow["deployment_environment"];
    publicJoinCode: string;
    isTest: boolean;
  };
  connection: RemoteConnectionState;
  serverNow: number;
};

export type RemoteGuestSnapshot = RemotePartySnapshot & {
  guest: GuestProjection | null;
  participant: {
    id: string;
    displayName: string;
    locale: Locale;
  } | null;
};

export type RemoteApiErrorCode =
  | "supabase_not_configured"
  | "no_active_session"
  | "party_not_found"
  | "join_closed"
  | "invalid_name"
  | "invalid_locale"
  | "invalid_participant_session"
  | "host_unauthorized"
  | "host_session_expired"
  | "stale_revision"
  | "invalid_transition"
  | "question_not_active"
  | "deadline_reached"
  | "response_already_locked"
  | "temporary_server_failure"
  | "content_mismatch";

export type RemoteApiError = {
  code: RemoteApiErrorCode;
  message: string;
  revision?: number;
};
