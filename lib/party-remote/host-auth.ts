import crypto from "node:crypto";

const hostCookiePrefix = "host:";
const hostSessionTtlMs = 1000 * 60 * 60 * 12;

function timingSafeEqualString(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getHostSecret() {
  return process.env.HOST_SESSION_SECRET || process.env.HOST_PIN_HASH || process.env.HOST_PIN || "";
}

export function verifyHostPin(pin: string) {
  const trimmed = pin.trim();
  const hash = crypto.createHash("sha256").update(trimmed).digest("hex");

  if (process.env.HOST_PIN_HASH) {
    return timingSafeEqualString(hash, process.env.HOST_PIN_HASH);
  }

  if (process.env.HOST_PIN) {
    return timingSafeEqualString(trimmed, process.env.HOST_PIN);
  }

  return false;
}

export function createHostSessionCookieValue(now = Date.now()) {
  const expiresAt = now + hostSessionTtlMs;
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `${hostCookiePrefix}${expiresAt}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", getHostSecret())
    .update(payload)
    .digest("base64url");

  return `${expiresAt}.${nonce}.${signature}`;
}

export function verifyHostSessionCookie(value: string | undefined, now = Date.now()) {
  if (!value || !getHostSecret()) {
    return false;
  }

  const [expiresAtRaw, nonce, signature] = value.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || !nonce || !signature || expiresAt <= now) {
    return false;
  }

  const payload = `${hostCookiePrefix}${expiresAt}.${nonce}`;
  const expected = crypto
    .createHmac("sha256", getHostSecret())
    .update(payload)
    .digest("base64url");

  return timingSafeEqualString(signature, expected);
}

export function isHostAuthConfigured() {
  return Boolean(getHostSecret() && (process.env.HOST_PIN_HASH || process.env.HOST_PIN));
}

export function getHostCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(hostSessionTtlMs / 1000)
  };
}
