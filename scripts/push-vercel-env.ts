import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envPath = ".env.local";
const allowedTargets = new Set(["preview", "development", "production"]);
const target = process.argv.find((arg) => arg.startsWith("--target="))?.split("=")[1] ?? "preview";
const dryRun = process.argv.includes("--dry-run");
const appUrlOverride = process.env.VERCEL_NEXT_PUBLIC_APP_URL;

const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "PARTY_JOIN_CODE",
  "PARTY_SESSION_IS_TEST",
  "HOST_PIN_HASH",
  "HOST_SESSION_SECRET"
] as const;

const serverOnlyKeys = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "HOST_PIN_HASH",
  "HOST_SESSION_SECRET"
]);

if (!allowedTargets.has(target)) {
  console.error("Target must be preview, development, or production.");
  process.exit(1);
}

if (target === "production" && process.env.ALLOW_PRODUCTION_ENV_PUSH !== "true") {
  console.error(
    "Refusing production env push without ALLOW_PRODUCTION_ENV_PUSH=true. Milestone 5 validation should keep test mode enabled."
  );
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error(".env.local is missing. Run npm run prepare:milestone5-env first.");
  process.exit(1);
}

function parseEnv(contents: string) {
  const env = new Map<string, string>();

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    env.set(trimmed.slice(0, equalsIndex), trimmed.slice(equalsIndex + 1));
  }

  return env;
}

function run(command: string, args: string[], input?: string) {
  return spawnSync(command, args, {
    input,
    encoding: "utf8",
    stdio: input === undefined ? ["ignore", "pipe", "pipe"] : ["pipe", "pipe", "pipe"]
  });
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const appUrl = appUrlOverride ?? env.get("NEXT_PUBLIC_APP_URL") ?? "";
const shouldSkipPreviewAppUrl =
  target === "preview" && /^http:\/\/localhost(?::\d+)?\/?$/.test(appUrl);
const missing = requiredKeys.filter((key) => !env.get(key)?.trim());

for (const key of requiredKeys) {
  if (key === "NEXT_PUBLIC_APP_URL" && shouldSkipPreviewAppUrl) {
    console.log("NEXT_PUBLIC_APP_URL: skipped for preview; VERCEL_URL fallback will be used");
  } else {
    console.log(
      `${key}: ${
        key === "NEXT_PUBLIC_APP_URL" && appUrlOverride
          ? "present"
          : env.get(key)?.trim()
            ? "present"
            : "missing"
      }`
    );
  }
}

if (env.get("PARTY_SESSION_IS_TEST") !== "true") {
  console.error("PARTY_SESSION_IS_TEST must remain true for Milestone 5 validation.");
  process.exit(1);
}

if (missing.length > 0) {
  console.error(`Missing required keys: ${missing.join(", ")}`);
  process.exit(1);
}

if (
  target === "production" &&
  !appUrlOverride &&
  /^http:\/\/localhost(?::\d+)?\/?$/.test(appUrl)
) {
  console.error(
    "Production env push requires VERCEL_NEXT_PUBLIC_APP_URL with the final deployed origin."
  );
  process.exit(1);
}

if (dryRun) {
  const pushCount = requiredKeys.length - (shouldSkipPreviewAppUrl ? 1 : 0);
  console.log(`Dry run only. ${pushCount} variables are ready for Vercel ${target}.`);
  process.exit(0);
}

if (!existsSync(".vercel/project.json")) {
  console.error("Vercel project is not linked. Run npx vercel link after logging in.");
  process.exit(1);
}

const whoami = run("npx", ["vercel", "whoami", "--non-interactive"]);

if (whoami.status !== 0) {
  console.error("Vercel CLI is not authenticated. Run npx vercel login first.");
  process.exit(1);
}

for (const key of requiredKeys) {
  if (key === "NEXT_PUBLIC_APP_URL" && shouldSkipPreviewAppUrl) {
    console.log("NEXT_PUBLIC_APP_URL: skipped for preview");
    continue;
  }

  const value = key === "NEXT_PUBLIC_APP_URL" && appUrlOverride ? appUrlOverride : env.get(key);

  if (!value) {
    continue;
  }

  const args = [
    "vercel",
    "env",
    "add",
    key,
    target,
    "--force",
    "--yes",
    "--non-interactive"
  ];

  if (target !== "development" && serverOnlyKeys.has(key)) {
    args.push("--sensitive");
  }

  const result = run("npx", args, value);

  if (result.status !== 0) {
    console.error(`Failed to push ${key} to Vercel ${target}.`);
    process.exit(1);
  }

  console.log(`${key}: pushed to ${target}`);
}
