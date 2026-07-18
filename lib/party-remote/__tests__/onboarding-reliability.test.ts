import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("onboarding exposes the complete in-app Back map and preserves one participant identity", () => {
  const source = readFileSync("components/guest/onboarding-flow.tsx", "utf8");
  const profileRoute = readFileSync(
    "app/api/party/participant/profile/route.ts",
    "utf8",
  );

  for (const mapping of [
    'language: "welcome"',
    'name: "language"',
    'partyPhoto: "name"',
    'howToPlay: "partyPhoto"',
    'ready: "howToPlay"',
  ]) {
    assert.equal(source.includes(mapping), true);
  }
  assert.equal(source.includes('data-testid="onboarding-back"'), true);
  assert.equal(source.includes('method: "PATCH"'), true);
  assert.equal(source.includes('fetch("/api/party/participant/profile"'), true);
  assert.equal(profileRoute.includes('cookieStore.get("han_participant_session")'), true);
  assert.equal(profileRoute.includes("participantId"), false);
});

test("readiness is authenticated, idempotent, reset by edits, and projected to host", () => {
  const repository = readFileSync("lib/party-remote/repository.ts", "utf8");
  const route = readFileSync(
    "app/api/party/participant/readiness/route.ts",
    "utf8",
  );
  const migration = readFileSync(
    "supabase/migrations/202607180001_participant_readiness.sql",
    "utf8",
  );
  const host = readFileSync(
    "components/party/host/production-host-controller.tsx",
    "utf8",
  );

  assert.equal(migration.includes("is_ready boolean not null default false"), true);
  assert.equal(migration.includes("ready_at timestamptz"), true);
  assert.equal(route.includes('cookieStore.get("han_participant_session")'), true);
  assert.equal(route.includes("participantId"), false);
  assert.equal(repository.includes("participant.is_ready === isReady"), true);
  assert.equal(repository.includes("is_ready: false"), true);
  assert.equal(repository.includes("ready_at: null"), true);
  assert.equal(host.includes('data-testid="host-readiness-list"'), true);
  assert.equal(host.includes("readyParticipantCount"), true);
  assert.equal(host.includes("setConfirmUnreadyStart(true)"), true);
});

test("photo library input is separate from camera and upload uses observable progress plus abort", () => {
  const card = readFileSync("components/guest/party-photo-card.tsx", "utf8");
  const upload = readFileSync("lib/party-avatar-upload-client.ts", "utf8");

  assert.equal(card.includes('accept="image/jpeg,image/png,image/webp"'), true);
  assert.equal(card.includes('capture="user"'), false);
  assert.equal(card.includes('data-testid="avatar-upload-progress"'), true);
  assert.equal(card.includes("uploadControllerRef.current?.abort()"), true);
  assert.equal(card.includes("Boolean(sourceUrl && !preparedPhoto)"), true);
  assert.equal(upload.includes("new XMLHttpRequest()"), true);
  assert.equal(upload.includes("xhr.upload.onprogress"), true);
  assert.equal(upload.includes("event.lengthComputable"), true);
  assert.equal(upload.includes("xhr.abort()"), true);
  assert.equal(upload.includes('percent: 100'), true);
});

test("persisted participant locale is the guest gameplay source of truth", () => {
  const guest = readFileSync(
    "components/party/remote/remote-guest-controller.tsx",
    "utf8",
  );
  const playPage = readFileSync("app/[locale]/play/page.tsx", "utf8");

  assert.equal(guest.includes("participant?.locale ?? locale"), true);
  assert.equal(guest.includes("question.prompt[effectiveLocale]"), true);
  assert.equal(guest.includes("locale={effectiveLocale}"), true);
  assert.equal(playPage.includes("participant.locale !== locale"), true);
  assert.equal(playPage.includes("buildGuestPlayPath(participant.locale"), true);
});
