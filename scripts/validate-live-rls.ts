import crypto from "node:crypto";
import { existsSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

type TestResult = {
  area: string;
  test: string;
  identity: string;
  credentialType: "anon/publishable" | "secret/service-role";
  operation: string;
  expected: string;
  actual: string;
  result: "PASS" | "FAIL";
  enforcementLayer:
    "database-enforced" | "server-route-enforced" | "test-setup";
};

type SupabaseResponse = {
  error: { message?: string; code?: string } | null;
  data: unknown;
  count?: number | null;
};

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required env keys: ${missing.join(", ")}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const validationId =
  process.env.LIVE_RLS_VALIDATION_ID || `codex-m5-validation-${Date.now()}`;
const randomUuid = crypto.randomUUID();

function deriveProjectRef(apiUrl: string) {
  try {
    const parsed = new URL(apiUrl);

    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".supabase.co") ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }

    return parsed.hostname.replace(/\.supabase\.co$/, "");
  } catch {
    return null;
  }
}

const projectRef = deriveProjectRef(url);

if (!projectRef) {
  console.error(
    "Supabase API URL format is invalid or not a hosted supabase.co URL.",
  );
  process.exit(1);
}

console.log("Supabase API URL: valid hosted format");
console.log("Supabase project ref: derived");
console.log(
  `Supabase browser credential format: ${
    anonKey.startsWith("sb_publishable_") ? "publishable" : "legacy/other"
  }`,
);
console.log(
  `Supabase server credential format: ${
    serviceRoleKey.startsWith("sb_secret_") ? "secret" : "legacy/other"
  }`,
);
console.log(`Validation id: ${validationId}`);

const anon = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const service = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results: TestResult[] = [];
const cleanupSessionIds: string[] = [];

function describeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
    };
    const parts = [
      typeof candidate.code === "string" ? candidate.code : null,
      typeof candidate.message === "string" ? candidate.message : null,
      typeof candidate.details === "string" ? candidate.details : null,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(": ");
    }
  }

  return "Live RLS validation failed.";
}

function record(result: TestResult) {
  results.push(result);
}

function pass(
  area: string,
  test: string,
  identity: string,
  credentialType: TestResult["credentialType"],
  operation: string,
  expected: string,
  actual: string,
  enforcementLayer: TestResult["enforcementLayer"],
) {
  record({
    area,
    test,
    identity,
    credentialType,
    operation,
    expected,
    actual,
    result: "PASS",
    enforcementLayer,
  });
}

function fail(
  area: string,
  test: string,
  identity: string,
  credentialType: TestResult["credentialType"],
  operation: string,
  expected: string,
  actual: string,
  enforcementLayer: TestResult["enforcementLayer"],
) {
  record({
    area,
    test,
    identity,
    credentialType,
    operation,
    expected,
    actual,
    result: "FAIL",
    enforcementLayer,
  });
}

function rowCount(data: unknown) {
  return Array.isArray(data) ? data.length : data ? 1 : 0;
}

function errorSummary(response: SupabaseResponse) {
  if (!response.error) {
    return `request succeeded with ${rowCount(response.data)} row(s)`;
  }

  return response.error.code
    ? `error ${response.error.code}`
    : "request returned an error";
}

function recordDenied(
  area: string,
  test: string,
  response: SupabaseResponse,
  operation: string,
  expected = "request is denied",
  enforcementLayer: TestResult["enforcementLayer"] = "database-enforced",
) {
  if (response.error) {
    pass(
      area,
      test,
      "anonymous guest",
      "anon/publishable",
      operation,
      expected,
      errorSummary(response),
      enforcementLayer,
    );
    return;
  }

  fail(
    area,
    test,
    "anonymous guest",
    "anon/publishable",
    operation,
    expected,
    errorSummary(response),
    enforcementLayer,
  );
}

function recordNoRows(
  area: string,
  test: string,
  response: SupabaseResponse,
  operation: string,
  expected = "zero rows returned",
) {
  if (!response.error && rowCount(response.data) === 0) {
    pass(
      area,
      test,
      "anonymous guest",
      "anon/publishable",
      operation,
      expected,
      "zero rows returned",
      "database-enforced",
    );
    return;
  }

  fail(
    area,
    test,
    "anonymous guest",
    "anon/publishable",
    operation,
    expected,
    errorSummary(response),
    "database-enforced",
  );
}

function recordExpectedRows(
  area: string,
  test: string,
  response: SupabaseResponse,
  operation: string,
  expectedRows: number,
  expected = `${expectedRows} row(s) returned`,
) {
  if (!response.error && rowCount(response.data) === expectedRows) {
    pass(
      area,
      test,
      "anonymous guest",
      "anon/publishable",
      operation,
      expected,
      `${expectedRows} row(s) returned`,
      "database-enforced",
    );
    return;
  }

  fail(
    area,
    test,
    "anonymous guest",
    "anon/publishable",
    operation,
    expected,
    errorSummary(response),
    "database-enforced",
  );
}

async function countRows(table: string, column: string, value: string) {
  const response = await service
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);

  if (response.error) {
    throw response.error;
  }

  return response.count ?? 0;
}

async function countResponsesForSessions(sessionIds: string[]) {
  const response = await service
    .from("question_responses")
    .select("*", { count: "exact", head: true })
    .in("party_session_id", sessionIds);

  if (response.error) {
    throw response.error;
  }

  return response.count ?? 0;
}

async function createSession(
  publicJoinCode: string,
  isTest: boolean,
  status = "active",
) {
  const inserted = await service
    .from("party_sessions")
    .insert({
      public_join_code: publicJoinCode,
      status,
      phase: "lobby",
      display_locale: "en",
      is_test: isTest,
    })
    .select("id, public_join_code, status, is_test, revision")
    .single();

  if (inserted.error) {
    throw inserted.error;
  }

  cleanupSessionIds.push(inserted.data.id);
  return inserted.data;
}

async function createParticipant(
  sessionId: string,
  displayName: string,
  locale = "en",
) {
  const inserted = await service
    .from("participants")
    .insert({
      party_session_id: sessionId,
      display_name: displayName,
      locale,
      resume_token_hash: crypto.randomBytes(32).toString("hex"),
      is_test: true,
    })
    .select("id, display_name")
    .single();

  if (inserted.error) {
    throw inserted.error;
  }

  return inserted.data;
}

async function expectServiceFailure(
  area: string,
  test: string,
  operation: string,
  request: PromiseLike<SupabaseResponse>,
  expected: string,
) {
  const response = await request;

  if (response.error) {
    pass(
      area,
      test,
      "trusted validation setup",
      "secret/service-role",
      operation,
      expected,
      errorSummary(response),
      "database-enforced",
    );
    return;
  }

  fail(
    area,
    test,
    "trusted validation setup",
    "secret/service-role",
    operation,
    expected,
    errorSummary(response),
    "database-enforced",
  );
}

async function main() {
  const credentialProbe = await anon
    .from("party_sessions")
    .select("id")
    .limit(1);

  if (credentialProbe.error) {
    throw new Error(
      `Anon/publishable credential validation failed or migrations are missing: ${credentialProbe.error.message}`,
    );
  }

  pass(
    "Credentials",
    "browser credential can make harmless request",
    "anonymous guest",
    "anon/publishable",
    "select party_sessions head",
    "request succeeds without exposing secrets",
    "request succeeded",
    "database-enforced",
  );

  const serviceProbe = await service
    .from("party_sessions")
    .select("id")
    .limit(1);

  if (serviceProbe.error) {
    throw new Error(
      `Secret/service-role credential validation failed: ${serviceProbe.error.message}`,
    );
  }

  pass(
    "Credentials",
    "server credential can make harmless setup request",
    "trusted validation setup",
    "secret/service-role",
    "select party_sessions head",
    "request succeeds from test context",
    "request succeeded",
    "test-setup",
  );

  const testSession = await createSession(validationId, true);
  const productionTwin = await createSession(validationId, false);
  const inactiveSession = await createSession(
    `${validationId}-inactive`,
    true,
    "draft",
  );
  const unrelatedSession = await createSession(
    `${validationId}-unrelated`,
    true,
  );
  const participantA = await createParticipant(
    testSession.id,
    `${validationId}-a`,
  );
  const participantB = await createParticipant(
    testSession.id,
    `${validationId}-b`,
    "vi",
  );
  const duplicateName = await createParticipant(
    testSession.id,
    `${validationId}-a`,
  );
  const unrelatedParticipant = await createParticipant(
    unrelatedSession.id,
    `${validationId}-u`,
  );

  if (productionTwin.is_test === false) {
    pass(
      "Session access",
      "scoped duplicate join code setup",
      "trusted validation setup",
      "secret/service-role",
      "insert test and production sessions with the same public_join_code",
      "unique index allows one test and one production session per join code",
      "both scoped sessions inserted",
      "database-enforced",
    );
  }

  if (duplicateName.display_name === participantA.display_name) {
    pass(
      "Participant access",
      "duplicate display name behavior",
      "trusted validation setup",
      "secret/service-role",
      "insert duplicate display_name",
      "duplicate display names are allowed because identity is cookie/token based",
      "duplicate display name inserted",
      "database-enforced",
    );
  } else {
    fail(
      "Participant access",
      "duplicate display name behavior",
      "trusted validation setup",
      "secret/service-role",
      "insert duplicate display_name",
      "duplicate display names are allowed because identity is cookie/token based",
      "duplicate display name changed unexpectedly",
      "database-enforced",
    );
  }

  await expectServiceFailure(
    "Participant access",
    "invalid name check constraint",
    "insert empty display_name",
    service.from("participants").insert({
      party_session_id: testSession.id,
      display_name: "",
      locale: "en",
      resume_token_hash: crypto.randomBytes(32).toString("hex"),
      is_test: true,
    }),
    "database rejects empty names",
  );

  await expectServiceFailure(
    "Participant access",
    "oversized name check constraint",
    "insert 41-character display_name",
    service.from("participants").insert({
      party_session_id: testSession.id,
      display_name: "x".repeat(41),
      locale: "en",
      resume_token_hash: crypto.randomBytes(32).toString("hex"),
      is_test: true,
    }),
    "database rejects oversized names",
  );

  recordExpectedRows(
    "Session access",
    "valid test session lookup",
    await anon
      .from("party_sessions")
      .select("id, public_join_code, status, is_test")
      .eq("id", testSession.id),
    "select active test session shell",
    1,
    "one active test session shell is visible for realtime wake-up",
  );

  recordNoRows(
    "Session access",
    "unknown join code",
    await anon
      .from("party_sessions")
      .select("id")
      .eq("public_join_code", `${validationId}-unknown`),
    "select unknown public_join_code",
  );

  recordNoRows(
    "Session access",
    "inactive session hidden",
    await anon.from("party_sessions").select("id").eq("id", inactiveSession.id),
    "select inactive draft session by id",
    "inactive draft session is hidden from anon",
  );

  recordExpectedRows(
    "Session access",
    "test/prod join-code isolation",
    await anon
      .from("party_sessions")
      .select("id, is_test")
      .eq("public_join_code", validationId)
      .eq("is_test", true),
    "select by join code and is_test=true",
    1,
    "test join-code lookup returns only the test session",
  );

  recordExpectedRows(
    "Session access",
    "production twin isolation",
    await anon
      .from("party_sessions")
      .select("id, is_test")
      .eq("public_join_code", validationId)
      .eq("is_test", false),
    "select by join code and is_test=false",
    1,
    "production join-code lookup returns only the production session",
  );

  recordExpectedRows(
    "Session access",
    "unrelated active shell exposure is narrow",
    await anon
      .from("party_sessions")
      .select("id, public_join_code, status, phase, is_test, revision")
      .eq("id", unrelatedSession.id),
    "select unrelated active session shell columns",
    1,
    "only granted shell columns are visible",
  );

  recordDenied(
    "Session access",
    "ungranted session fields are not selectable",
    await anon
      .from("party_sessions")
      .select("last_command_id")
      .eq("id", testSession.id),
    "select last_command_id",
  );

  recordNoRows(
    "Session access",
    "guessed session UUID access",
    await anon.from("party_sessions").select("id").eq("id", randomUuid),
    "select random session uuid",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot start session",
    await anon
      .from("party_sessions")
      .update({ phase: "question_ready" })
      .eq("id", testSession.id),
    "update phase to question_ready",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot change question",
    await anon
      .from("party_sessions")
      .update({ current_question_id: "q1", current_question_index: 0 })
      .eq("id", testSession.id),
    "update current question fields",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot advance round",
    await anon
      .from("party_sessions")
      .update({ phase: "leaderboard" })
      .eq("id", testSession.id),
    "update phase to leaderboard",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot reset session",
    await anon
      .from("party_sessions")
      .update({ phase: "lobby", revision: 0 })
      .eq("id", testSession.id),
    "reset phase and revision",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot end session",
    await anon
      .from("party_sessions")
      .update({ status: "finished" })
      .eq("id", testSession.id),
    "update status to finished",
  );

  recordExpectedRows(
    "Participant access",
    "safe participant wake-up read",
    await anon
      .from("participants")
      .select("id, party_session_id, display_name, locale, joined_at, is_test")
      .eq("party_session_id", testSession.id),
    "select granted participant columns",
    3,
    "safe participant wake-up columns are visible",
  );

  recordDenied(
    "Participant access",
    "resume token hash is not selectable",
    await anon
      .from("participants")
      .select("resume_token_hash")
      .eq("party_session_id", testSession.id),
    "select resume_token_hash",
    "anon cannot select resume_token_hash",
  );

  recordDenied(
    "Participant access",
    "duplicate participant creation is blocked at direct REST boundary",
    await anon.from("participants").insert({
      party_session_id: testSession.id,
      display_name: `${validationId}-direct`,
      locale: "en",
      resume_token_hash: crypto.randomBytes(32).toString("hex"),
      is_test: true,
    }),
    "insert participant directly",
  );

  recordDenied(
    "Participant access",
    "guest A cannot modify guest B",
    await anon
      .from("participants")
      .update({ display_name: `${validationId}-tamper` })
      .eq("id", participantB.id),
    "update another participant display_name",
  );

  recordDenied(
    "Participant access",
    "guest cannot delete guest B",
    await anon.from("participants").delete().eq("id", participantB.id),
    "delete another participant",
  );

  recordDenied(
    "Participant access",
    "guest cannot assign host privileges",
    await anon
      .from("participants")
      .update({ is_host: true })
      .eq("id", participantA.id),
    "update non-schema is_host field",
    "request is denied or schema rejects host privilege field",
  );

  recordDenied(
    "Participant access",
    "guest cannot change protected ownership fields",
    await anon
      .from("participants")
      .update({ party_session_id: unrelatedSession.id })
      .eq("id", participantA.id),
    "move participant to another session",
  );

  const validResponse = await service
    .from("question_responses")
    .insert({
      party_session_id: testSession.id,
      participant_id: participantA.id,
      question_id: `${validationId}-q1`,
      selected_option_id: "option-a",
      status: "locked_answer",
      submitted_at: new Date().toISOString(),
      locked_at: new Date().toISOString(),
      response_duration_ms: 1200,
      is_correct: false,
      submission_id: `${validationId}-submission-a`,
      is_test: true,
    })
    .select("id")
    .single();

  if (validResponse.error) {
    throw validResponse.error;
  }

  pass(
    "Answers",
    "valid response setup row",
    "trusted validation setup",
    "secret/service-role",
    "insert locked response row",
    "trusted setup can create one valid row for constraint/RLS tests",
    "one response inserted",
    "test-setup",
  );

  recordDenied(
    "Answers",
    "anon cannot read raw responses",
    await anon
      .from("question_responses")
      .select("id")
      .eq("party_session_id", testSession.id),
    "select raw response rows",
    "anon raw response read is denied",
  );

  recordDenied(
    "Answers",
    "answer for another participant is blocked at direct REST boundary",
    await anon.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantB.id,
      question_id: `${validationId}-q2`,
      selected_option_id: "option-a",
      status: "locked_answer",
      is_correct: true,
      submission_id: `${validationId}-tamper-other`,
      is_test: true,
    }),
    "insert response for another participant",
  );

  recordDenied(
    "Answers",
    "client-supplied correctness is blocked",
    await anon.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantA.id,
      question_id: `${validationId}-q2`,
      selected_option_id: "option-a",
      status: "locked_answer",
      is_correct: true,
      submission_id: `${validationId}-tamper-correctness`,
      is_test: true,
    }),
    "insert response with is_correct=true",
  );

  recordDenied(
    "Answers",
    "client-supplied awarded points are rejected",
    await anon.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantA.id,
      question_id: `${validationId}-q3`,
      selected_option_id: "option-a",
      status: "locked_answer",
      is_correct: true,
      points_awarded: 2000,
      scoring_version: "time-v1",
      submission_id: `${validationId}-tamper-score`,
      is_test: true,
    }),
    "insert response with awarded-points payload",
  );

  recordDenied(
    "Answers",
    "cross-session answer submission is blocked at direct REST boundary",
    await anon.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: unrelatedParticipant.id,
      question_id: `${validationId}-q4`,
      selected_option_id: "option-a",
      status: "locked_answer",
      is_correct: true,
      submission_id: `${validationId}-tamper-cross-session`,
      is_test: true,
    }),
    "insert response with participant from another session",
  );

  await expectServiceFailure(
    "Answers",
    "duplicate question response protection",
    "insert second response for same participant/session/question",
    service.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantA.id,
      question_id: `${validationId}-q1`,
      selected_option_id: "option-b",
      status: "locked_answer",
      submitted_at: new Date().toISOString(),
      locked_at: new Date().toISOString(),
      response_duration_ms: 900,
      is_correct: true,
      submission_id: `${validationId}-submission-b`,
      is_test: true,
    }),
    "unique constraint rejects duplicate participant/question response",
  );

  await expectServiceFailure(
    "Answers",
    "replayed submission id protection",
    "insert second response with same submission_id",
    service.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantA.id,
      question_id: `${validationId}-q-replay`,
      selected_option_id: "option-b",
      status: "locked_answer",
      submitted_at: new Date().toISOString(),
      locked_at: new Date().toISOString(),
      response_duration_ms: 900,
      is_correct: true,
      submission_id: `${validationId}-submission-a`,
      is_test: true,
    }),
    "unique constraint rejects replayed submission id",
  );

  recordDenied(
    "Answers",
    "malformed answer is rejected",
    await anon.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantA.id,
      question_id: `${validationId}-q-malformed`,
      selected_option_id: null,
      status: "locked_answer",
      submission_id: `${validationId}-malformed`,
      is_test: true,
    }),
    "insert locked_answer with null selected_option_id",
    "request is denied or check constraint rejects malformed answer",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot alter awarded points",
    await anon
      .from("question_responses")
      .update({ points_awarded: 2000 })
      .eq("id", validResponse.data.id),
    "update response points",
  );

  recordDenied(
    "Host-only operations",
    "guest cannot alter leaderboard",
    await anon.from("question_responses").insert({
      party_session_id: testSession.id,
      participant_id: participantB.id,
      question_id: `${validationId}-leaderboard`,
      selected_option_id: "option-a",
      status: "completed",
      is_correct: true,
      leaderboard_position: 1,
      submission_id: `${validationId}-leaderboard-tamper`,
      is_test: true,
    }),
    "insert leaderboard/status tampering payload",
    "request is denied or schema rejects leaderboard/status fields",
  );

  recordDenied(
    "Host-only operations",
    "anon cannot read host command log",
    await anon
      .from("host_command_log")
      .select("id")
      .eq("party_session_id", testSession.id),
    "select host_command_log",
  );

  recordDenied(
    "Host-only operations",
    "anon cannot write host command log",
    await anon.from("host_command_log").insert({
      party_session_id: testSession.id,
      command_id: `${validationId}-host-tamper`,
      command_type: "FINISH_PARTY",
      expected_revision: 0,
      accepted_revision: 1,
      status: "accepted",
      is_test: true,
    }),
    "insert host command log row",
  );

  recordDenied(
    "Host-only operations",
    "anon cannot execute response touch RPC",
    await anon.rpc("touch_party_session_response", {
      p_session_id: testSession.id,
    }),
    "execute touch_party_session_response",
  );
}

async function cleanup() {
  if (cleanupSessionIds.length === 0) {
    return;
  }

  const cleanupCounts = {
    question_responses: await countResponsesForSessions(cleanupSessionIds),
    participants: 0,
    party_sessions: cleanupSessionIds.length,
  };

  for (const sessionId of cleanupSessionIds) {
    cleanupCounts.participants += await countRows(
      "participants",
      "party_session_id",
      sessionId,
    );
  }

  console.log("Cleanup candidates:");
  for (const [table, count] of Object.entries(cleanupCounts)) {
    console.log(`${table}: ${count}`);
  }

  const ownedSessions = await service
    .from("party_sessions")
    .select("id, public_join_code")
    .in("id", cleanupSessionIds);

  if (ownedSessions.error) {
    throw ownedSessions.error;
  }

  const unsafeSession = ownedSessions.data?.find(
    (session) => !String(session.public_join_code).startsWith(validationId),
  );

  if (unsafeSession) {
    console.log(
      "Cleanup skipped: at least one candidate did not match the validation id.",
    );
    return;
  }

  const cleanupResult = await service
    .from("party_sessions")
    .delete()
    .in("id", cleanupSessionIds);

  if (cleanupResult.error) {
    throw cleanupResult.error;
  }

  console.log("Cleanup completed for validation-owned sessions.");
}

main()
  .catch((error) => {
    fail(
      "Harness",
      "live validation harness",
      "trusted validation setup",
      "secret/service-role",
      "run live RLS validation",
      "harness completes without uncaught errors",
      describeUnknownError(error),
      "test-setup",
    );
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (error) {
      fail(
        "Cleanup",
        "validation-owned test data cleanup",
        "trusted validation setup",
        "secret/service-role",
        "delete validation-owned party_sessions",
        "only validation-owned rows are deleted",
        describeUnknownError(error),
        "test-setup",
      );
    }

    console.table(results);

    if (results.some((result) => result.result === "FAIL")) {
      process.exit(1);
    }
  });
