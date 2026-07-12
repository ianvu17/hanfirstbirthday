import assert from "node:assert/strict";
import test from "node:test";
import crypto from "node:crypto";

import {
  createHostSessionCookieValue,
  verifyHostPin,
  verifyHostSessionCookie
} from "../host-auth";
import {
  createParticipantCookieValue,
  createResumeToken,
  hashResumeToken,
  parseParticipantCookieValue
} from "../repository";

test("host PIN verifies against a hash without exposing the raw PIN", () => {
  const previousPin = process.env.HOST_PIN;
  const previousHash = process.env.HOST_PIN_HASH;
  const previousSecret = process.env.HOST_SESSION_SECRET;
  const pin = "123456";

  process.env.HOST_PIN = "";
  process.env.HOST_PIN_HASH = crypto.createHash("sha256").update(pin).digest("hex");
  process.env.HOST_SESSION_SECRET = "test-host-session-secret";

  assert.equal(verifyHostPin(pin), true);
  assert.equal(verifyHostPin("000000"), false);

  process.env.HOST_PIN = previousPin;
  process.env.HOST_PIN_HASH = previousHash;
  process.env.HOST_SESSION_SECRET = previousSecret;
});

test("host session cookie is signed and expires", () => {
  const previousSecret = process.env.HOST_SESSION_SECRET;
  const previousPin = process.env.HOST_PIN;

  process.env.HOST_SESSION_SECRET = "test-host-session-secret";
  process.env.HOST_PIN = "123456";

  const issuedAt = 1_000;
  const cookieValue = createHostSessionCookieValue(issuedAt);

  assert.equal(verifyHostSessionCookie(cookieValue, issuedAt + 100), true);
  assert.equal(verifyHostSessionCookie(`${cookieValue.slice(0, -1)}x`, issuedAt + 100), false);
  assert.equal(verifyHostSessionCookie(cookieValue, issuedAt + 1000 * 60 * 60 * 13), false);

  process.env.HOST_SESSION_SECRET = previousSecret;
  process.env.HOST_PIN = previousPin;
});

test("participant resume cookie keeps opaque identity separate from display name", () => {
  const token = createResumeToken();
  const cookieValue = createParticipantCookieValue("participant-1", token);
  const parsed = parseParticipantCookieValue(cookieValue);

  assert.deepEqual(parsed, {
    participantId: "participant-1",
    token
  });
  assert.notEqual(hashResumeToken(token), token);
  assert.equal(parseParticipantCookieValue("broken-cookie"), null);
});
