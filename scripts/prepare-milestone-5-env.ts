import crypto from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const envPath = ".env.local";
const requiredOrder = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "PARTY_JOIN_CODE",
  "PARTY_SESSION_IS_TEST",
  "HOST_PIN_HASH",
  "HOST_PIN",
  "HOST_SESSION_SECRET"
] as const;

type EnvKey = (typeof requiredOrder)[number];

const defaultValues: Partial<Record<EnvKey, string>> = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  PARTY_JOIN_CODE: "han-turns-one",
  PARTY_SESSION_IS_TEST: "true"
};

function parseEnvFile(lines: string[]) {
  const env = new Map<string, string>();
  const lineIndex = new Map<string, number>();

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, equalsIndex);
    const rawValue = trimmed.slice(equalsIndex + 1).trim();
    env.set(key, rawValue);
    lineIndex.set(key, index);
  }

  return { env, lineIndex };
}

function present(value: string | undefined) {
  return value === undefined || value.trim() === "" ? "missing" : "present";
}

const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const lines = existing ? existing.split(/\r?\n/) : [];
const { env, lineIndex } = parseEnvFile(lines);

function setKey(key: EnvKey, value: string) {
  env.set(key, value);

  const existingIndex = lineIndex.get(key);

  if (existingIndex === undefined) {
    lines.push(`${key}=${value}`);
    lineIndex.set(key, lines.length - 1);
    return;
  }

  lines[existingIndex] = `${key}=${value}`;
}

for (const key of requiredOrder) {
  if (!env.has(key)) {
    setKey(key, defaultValues[key] ?? "");
  } else if (!env.get(key)?.trim() && defaultValues[key]) {
    setKey(key, defaultValues[key]);
  }
}

if (!env.get("HOST_SESSION_SECRET")?.trim()) {
  setKey("HOST_SESSION_SECRET", crypto.randomBytes(32).toString("base64url"));
}

writeFileSync(envPath, `${lines.filter((line, index) => line || index < lines.length - 1).join("\n")}\n`, {
  mode: 0o600
});

console.log(`NEXT_PUBLIC_SUPABASE_URL: ${present(env.get("NEXT_PUBLIC_SUPABASE_URL"))}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${present(env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${present(env.get("SUPABASE_SERVICE_ROLE_KEY"))}`);
console.log(`NEXT_PUBLIC_APP_URL: ${present(env.get("NEXT_PUBLIC_APP_URL"))}`);
console.log(`PARTY_JOIN_CODE: ${present(env.get("PARTY_JOIN_CODE"))}`);
console.log(`PARTY_SESSION_IS_TEST: ${present(env.get("PARTY_SESSION_IS_TEST"))}`);
console.log(`HOST_PIN_HASH: ${present(env.get("HOST_PIN_HASH"))}`);
console.log(`HOST_SESSION_SECRET: ${present(env.get("HOST_SESSION_SECRET"))}`);

if (env.get("PARTY_SESSION_IS_TEST") !== "true") {
  console.error("PARTY_SESSION_IS_TEST must remain true for Milestone 5 validation.");
  process.exitCode = 1;
}

const appUrl = env.get("NEXT_PUBLIC_APP_URL") ?? "";
if (!/^http:\/\/localhost(?::\d+)?\/?$/.test(appUrl)) {
  console.error("NEXT_PUBLIC_APP_URL should be a localhost URL for local Milestone 5 validation.");
  process.exitCode = 1;
}
