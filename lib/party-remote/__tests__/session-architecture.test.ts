import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getPartyDeploymentEnvironment } from "@/lib/supabase/env";
import {
  resolveRemoteSnapshotTracking,
  type RemoteSnapshotTrackingState
} from "@/lib/party-remote/use-remote-party";

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("deployment environment resolves to explicit Vercel contexts", () => {
  const previousExplicit = process.env.PARTY_DEPLOYMENT_ENVIRONMENT;
  const previousVercel = process.env.VERCEL_ENV;
  const previousNode = process.env.NODE_ENV;

  process.env.PARTY_DEPLOYMENT_ENVIRONMENT = "";
  process.env.VERCEL_ENV = "preview";
  assert.equal(getPartyDeploymentEnvironment(), "preview");

  process.env.VERCEL_ENV = "production";
  assert.equal(getPartyDeploymentEnvironment(), "production");

  process.env.VERCEL_ENV = "unexpected";
  Reflect.deleteProperty(process.env, "NODE_ENV");
  assert.equal(getPartyDeploymentEnvironment(), "development");

  restoreEnv("PARTY_DEPLOYMENT_ENVIRONMENT", previousExplicit);
  restoreEnv("VERCEL_ENV", previousVercel);
  restoreEnv("NODE_ENV", previousNode);
});

test("current session reads are not implemented through ensure-and-insert semantics", () => {
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");
  const loadCurrentStart = repository.indexOf("export async function loadCurrentPartySession");
  const createStart = repository.indexOf("export async function createPartySession");

  assert.notEqual(loadCurrentStart, -1);
  assert.notEqual(createStart, -1);
  assert.equal(repository.includes("export async function ensureActivePartySession"), false);

  const loadCurrentSource = repository.slice(loadCurrentStart, createStart);
  assert.equal(loadCurrentSource.includes('.eq("is_current", true)'), true);
  assert.equal(loadCurrentSource.includes(".insert("), false);
  assert.equal(loadCurrentSource.includes(".rpc(\"create_party_session\""), false);
});

test("host command id is deterministic for retries of the same transition", () => {
  const hostController = readFileSync(
    "components/party/host/production-host-controller.tsx",
    "utf8"
  );

  assert.equal(
    hostController.includes(
      'commandId: `${snapshot.session.id}:${command}:${snapshot.session.revision}`'
    ),
    true
  );
  assert.equal(hostController.includes("commandId: `${command}:${snapshot.session.revision}:${Date.now()}`"), false);
});

function track(
  current: RemoteSnapshotTrackingState,
  sessionId: string | null,
  revision = -1
) {
  return resolveRemoteSnapshotTracking(current, {
    session: sessionId ? { id: sessionId, revision } : null
  });
}

test("remote snapshot tracking accepts higher and equal revisions for the same session", () => {
  const higher = track({ sessionId: "session-a", revision: 3 }, "session-a", 4);
  assert.equal(higher.accept, true);
  assert.deepEqual(higher.next, { sessionId: "session-a", revision: 4 });

  const equal = track(higher.next, "session-a", 4);
  assert.equal(equal.accept, true);
  assert.deepEqual(equal.next, { sessionId: "session-a", revision: 4 });
});

test("remote snapshot tracking rejects lower revisions only within the same session", () => {
  const current = { sessionId: "session-a", revision: 15 };
  const lowerSameSession = track(current, "session-a", 14);

  assert.equal(lowerSameSession.accept, false);
  assert.deepEqual(lowerSameSession.next, current);
});

test("remote snapshot tracking accepts a new session even when its revision is lower", () => {
  const switched = track({ sessionId: "session-a", revision: 15 }, "session-b", 0);

  assert.equal(switched.accept, true);
  assert.deepEqual(switched.next, { sessionId: "session-b", revision: 0 });
});

test("remote snapshot tracking accepts null sessions and later accepts a new session", () => {
  const cleared = track({ sessionId: "session-a", revision: 15 }, null);

  assert.equal(cleared.accept, true);
  assert.deepEqual(cleared.next, { sessionId: null, revision: -1 });

  const joined = track(cleared.next, "session-b", 0);
  assert.equal(joined.accept, true);
  assert.deepEqual(joined.next, { sessionId: "session-b", revision: 0 });
});

test("remote realtime subscriptions are keyed by session id and cleaned up on switch", () => {
  const hook = readFileSync("lib/party-remote/use-remote-party.ts", "utf8");

  assert.equal(hook.includes("const sessionId = snapshot?.session?.id"), true);
  assert.equal(hook.includes(".channel(`party-session:${sessionId}`)"), true);
  assert.equal(hook.includes("filter: `id=eq.${sessionId}`"), true);
  assert.equal(hook.includes("filter: `party_session_id=eq.${sessionId}`"), true);
  assert.equal(hook.includes("void client.removeChannel(channel);"), true);
  assert.equal(
    hook.includes("}, [markReconnectingSoon, refresh, settleLive, snapshot?.session?.id]);"),
    true
  );
});

test("transient realtime status changes are stabilized before becoming visible", () => {
  const hook = readFileSync("lib/party-remote/use-remote-party.ts", "utf8");

  assert.equal(hook.includes("markReconnectingSoon"), true);
  assert.equal(hook.includes("window.setTimeout(() => {\n      reconnectGraceTimerRef.current = null;"), true);
  assert.equal(hook.includes("setConnection(\"stale\")"), false);
  assert.equal(hook.includes("setConnection(window.navigator.onLine ? \"stale\" : \"offline\")"), false);
});

test("old realtime events are wake-up signals only and refresh the current session", () => {
  const hook = readFileSync("lib/party-remote/use-remote-party.ts", "utf8");

  assert.equal(hook.includes("const response = await fetch(\"/api/party/session\""), true);
  assert.equal(hook.includes("applySnapshot(payload as TSnapshot);"), true);
  assert.equal(hook.includes("postgres_changes"), true);
  assert.equal(hook.includes("() => {\n          void refresh();\n        }"), true);
});

test("participant resume tokens are scoped to the current party session", () => {
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");
  const validateStart = repository.indexOf("export async function validateParticipantSession");
  const joinStart = repository.indexOf("export async function joinActiveParty");
  const validateSource = repository.slice(validateStart, joinStart);

  assert.equal(validateSource.includes('.eq("id", participantSession.participantId)'), true);
  assert.equal(validateSource.includes('.eq("party_session_id", partySessionId)'), true);
  assert.equal(validateSource.includes('.eq("resume_token_hash", tokenHash)'), true);
});

test("display name persistence is intentional but separate from participant identity", () => {
  const docs = readFileSync("docs/PARTY_SESSION_ARCHITECTURE.md", "utf8");
  const guestPlay = readFileSync("components/party/guest-play-client.tsx", "utf8");

  assert.equal(docs.includes("intentionally kept in browser `sessionStorage`"), true);
  assert.equal(docs.includes("That stored display name is not participant identity."), true);
  assert.equal(guestPlay.includes("window.sessionStorage.getItem(SESSION_KEY)"), true);
});

test("polling can move an open tab to a different current session without reload", () => {
  const hook = readFileSync("lib/party-remote/use-remote-party.ts", "utf8");
  const switched = track({ sessionId: "session-a", revision: 15 }, "session-b", 0);

  assert.equal(switched.accept, true);
  assert.equal(hook.includes("window.setInterval"), true);
  assert.equal(hook.includes("void refresh();"), true);
  assert.equal(hook.includes("applySnapshot(payload as TSnapshot);"), true);
});

test("QR join codes are validated without adding session-specific QR routing", () => {
  const joinRoute = readFileSync("app/api/party/join/route.ts", "utf8");
  const playRoute = readFileSync("app/[locale]/play/page.tsx", "utf8");
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");
  const buildJoinStart = repository.indexOf("function buildJoinUrl");
  const contextStart = repository.indexOf("function getPartyContext");
  const buildJoinSource = repository.slice(buildJoinStart, contextStart);

  assert.equal(buildJoinSource.includes('url.searchParams.set("join", publicJoinCode)'), true);
  assert.equal(buildJoinSource.includes("party_session_id"), false);
  assert.equal(playRoute.includes("searchParams"), true);
  assert.equal(playRoute.includes("joinCode={joinCode}"), true);
  assert.equal(joinRoute.includes("joinCode"), true);
  assert.equal(joinRoute.includes("parsed.data.joinCode !== partySession.public_join_code"), true);
});
