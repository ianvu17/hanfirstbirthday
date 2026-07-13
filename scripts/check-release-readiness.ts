import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const owner = "ianvu17";
const repo = "hanfirstbirthday";
const prNumber = process.argv.find((arg) => arg.startsWith("--pr="))?.split("=")[1] ?? "1";
const previewUrl = process.argv
  .find((arg) => arg.startsWith("--preview-url="))
  ?.split("=")[1]
  ?.replace(/\/$/, "");

const requiredProductionEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "PARTY_JOIN_CODE",
  "PARTY_SESSION_IS_TEST",
  "HOST_PIN_HASH",
  "HOST_SESSION_SECRET"
] as const;

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
  info?: string[];
};

type PrStatus = {
  __typename: string;
  conclusion?: string;
  context?: string;
  name?: string;
  state?: string;
  status?: string;
};

type PrView = {
  state?: string;
  mergeStateStatus?: string;
  headRefOid?: string;
  statusCheckRollup?: PrStatus[];
  url?: string;
};

type VercelEnv = {
  key?: string;
  type?: string;
  target?: string[];
};

type VercelEnvList = {
  envs?: VercelEnv[];
};

type PartySessionResponse = {
  mode?: string;
  configured?: boolean;
  session?: {
    isTest?: boolean;
  };
  joinUrl?: string;
};

type GitHubProtection = {
  data?: {
    repository?: {
      viewerPermission?: string;
      defaultBranchRef?: {
        name?: string;
        branchProtectionRule?: {
          requiresStatusChecks?: boolean;
          requiresStrictStatusChecks?: boolean;
          requiredStatusCheckContexts?: string[];
        } | null;
      } | null;
    } | null;
  };
};

type GitHubRuleset = {
  id?: number;
  name?: string;
  target?: string;
  enforcement?: string;
  conditions?: {
    ref_name?: {
      include?: string[];
    };
  };
  rules?: Array<{
    type?: string;
    parameters?: {
      required_status_checks?: Array<{
        context?: string;
      }>;
      strict_required_status_checks_policy?: boolean;
    };
  }>;
};

function run(command: string, args: string[]) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function parseJsonFromOutput<T>(output: string): T {
  const trimmed = output.trim();
  const jsonStartCandidates = [trimmed.indexOf("{"), trimmed.indexOf("[")]
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);

  if (jsonStartCandidates.length === 0) {
    throw new Error("No JSON object found in command output.");
  }

  return JSON.parse(trimmed.slice(jsonStartCandidates[0])) as T;
}

function parseEnvFile(contents: string) {
  const values = new Map<string, string>();

  for (const line of contents.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    const rawValue = line.slice(equalsIndex + 1).trim();
    const value =
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
        ? rawValue.slice(1, -1)
        : rawValue;

    values.set(line.slice(0, equalsIndex), value);
  }

  return values;
}

function pullEnvValues(environment: "production" | "preview") {
  const dir = mkdtempSync(join(tmpdir(), "han-release-readiness-"));
  const file = join(dir, `${environment}.env`);

  try {
    const result = run("npx", [
      "vercel",
      "env",
      "pull",
      file,
      "--environment",
      environment,
      "--yes",
      "--non-interactive"
    ]);

    if (result.status !== 0) {
      return new Map<string, string>();
    }

    return parseEnvFile(readFileSync(file, "utf8"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function getRulesetDetails(ruleset: GitHubRuleset) {
  if (!ruleset.id) {
    return ruleset;
  }

  const result = run("gh", ["api", `repos/${owner}/${repo}/rulesets/${ruleset.id}`]);

  if (result.status !== 0) {
    return ruleset;
  }

  return parseJsonFromOutput<GitHubRuleset>(result.stdout);
}

function checkGitHubPr(): CheckResult {
  const result = run("gh", [
    "pr",
    "view",
    prNumber,
    "--json",
    "state,mergeStateStatus,headRefOid,statusCheckRollup,url"
  ]);

  if (result.status !== 0) {
    return {
      name: "GitHub PR",
      ok: false,
      detail: result.stderr.trim() || `Unable to inspect PR #${prNumber}.`
    };
  }

  const pr = parseJsonFromOutput<PrView>(result.stdout);
  const rollup = pr.statusCheckRollup ?? [];
  const validateOk = rollup.some(
    (status) => status.name === "Validate" && status.conclusion === "SUCCESS"
  );
  const vercelOk = rollup.some(
    (status) => status.context === "Vercel" && status.state === "SUCCESS"
  );
  const blockers = [
    pr.state === "OPEN" ? "" : `PR state is ${pr.state ?? "unknown"}`,
    pr.mergeStateStatus === "CLEAN"
      ? ""
      : `merge state is ${pr.mergeStateStatus ?? "unknown"}`,
    validateOk ? "" : "Validate check is not successful",
    vercelOk ? "" : "Vercel status is not successful"
  ].filter(Boolean);

  return {
    name: "GitHub PR",
    ok: blockers.length === 0,
    detail:
      blockers.length === 0
        ? `PR #${prNumber} is open, clean, and has passing Validate and Vercel signals (${pr.headRefOid?.slice(0, 7) ?? "unknown SHA"}).`
        : blockers.join("; ")
  };
}

function checkGitHubProtection(): CheckResult {
  const query =
    "query($owner:String!,$name:String!){repository(owner:$owner,name:$name){viewerPermission defaultBranchRef{name branchProtectionRule{requiresStatusChecks requiresStrictStatusChecks requiredStatusCheckContexts}}}}";
  const result = run("gh", [
    "api",
    "graphql",
    "-f",
    `query=${query}`,
    "-f",
    `owner=${owner}`,
    "-f",
    `name=${repo}`
  ]);

  if (result.status !== 0) {
    return {
      name: "GitHub main protection",
      ok: false,
      detail: result.stderr.trim() || "Unable to inspect GitHub branch protection."
    };
  }

  const response = parseJsonFromOutput<GitHubProtection>(result.stdout);
  const repository = response.data?.repository;
  const permission = repository?.viewerPermission ?? "unknown";
  const branchRule = repository?.defaultBranchRef?.branchProtectionRule;

  if (branchRule) {
    const contexts = branchRule.requiredStatusCheckContexts ?? [];
    const hasValidate = contexts.includes("Validate");

    return {
      name: "GitHub main protection",
      ok: Boolean(branchRule.requiresStatusChecks && hasValidate),
      detail: branchRule.requiresStatusChecks && hasValidate
        ? `main requires status checks including Validate; strict-up-to-date is ${branchRule.requiresStrictStatusChecks ? "enabled" : "not enabled"}.`
        : `main has a branch rule, but required status checks are incomplete: ${contexts.join(", ") || "none"}.`
    };
  }

  const rulesetsResult = run("gh", ["api", `repos/${owner}/${repo}/rulesets`]);

  if (rulesetsResult.status !== 0) {
    return {
      name: "GitHub main protection",
      ok: false,
      detail: rulesetsResult.stderr.trim() || "Unable to inspect GitHub repository rulesets."
    };
  }

  const rulesets = parseJsonFromOutput<GitHubRuleset[]>(rulesetsResult.stdout).map((ruleset) =>
    getRulesetDetails(ruleset)
  );
  const activeMainRulesets = rulesets.filter((ruleset) => {
    const target = ruleset.target?.toLowerCase();
    const enforcement = ruleset.enforcement?.toLowerCase();
    const includes = ruleset.conditions?.ref_name?.include ?? [];
    const targetsMain =
      includes.length === 0 ||
      includes.includes("~DEFAULT_BRANCH") ||
      includes.includes("refs/heads/main") ||
      includes.includes("main");

    return target === "branch" && enforcement === "active" && targetsMain;
  });

  if (activeMainRulesets.length === 0) {
    return {
      name: "GitHub main protection",
      ok: false,
      detail: `No active branch protection rule or active main branch ruleset is visible. Current permission is ${permission}; admin access may be required.`
    };
  }

  const rulesetsWithValidate = activeMainRulesets.filter((ruleset) =>
    (ruleset.rules ?? []).some((rule) => {
      if (rule.type !== "required_status_checks") {
        return false;
      }

      return (rule.parameters?.required_status_checks ?? []).some(
        (statusCheck) => statusCheck.context === "Validate"
      );
    })
  );

  return {
    name: "GitHub main protection",
    ok: rulesetsWithValidate.length > 0,
    detail:
      rulesetsWithValidate.length > 0
        ? `Active main branch ruleset requires Validate: ${rulesetsWithValidate.map((ruleset) => ruleset.name).join(", ")}.`
        : `Active main branch rulesets are visible, but none require Validate: ${activeMainRulesets.map((ruleset) => ruleset.name).join(", ")}.`
  };
}

function checkVercelProductionEnv(): CheckResult {
  const result = run("npx", ["vercel", "env", "ls", "production", "--format", "json"]);

  if (result.status !== 0) {
    return {
      name: "Vercel Production env",
      ok: false,
      detail: result.stderr.trim() || "Unable to inspect Vercel Production env."
    };
  }

  const envList = parseJsonFromOutput<VercelEnvList>(result.stdout);
  const envs = envList.envs ?? [];
  const presentKeys = new Set(envs.map((env) => env.key).filter(Boolean));
  const missing = requiredProductionEnvKeys.filter((key) => !presentKeys.has(key));
  const hostSessionSecret = envs.find((env) => env.key === "HOST_SESSION_SECRET");
  const partySessionMode = envs.find((env) => env.key === "PARTY_SESSION_IS_TEST");
  const hostPinHash = envs.find((env) => env.key === "HOST_PIN_HASH");
  const nextPublicAppUrl = envs.find((env) => env.key === "NEXT_PUBLIC_APP_URL");
  const partyJoinCode = envs.find((env) => env.key === "PARTY_JOIN_CODE");
  const productionValues = pullEnvValues("production");
  const productionIsTest = productionValues.get("PARTY_SESSION_IS_TEST") ?? "";
  const productionOrigin = productionValues.get("NEXT_PUBLIC_APP_URL") ?? "";
  let originBlocker = "";

  if (productionOrigin) {
    try {
      const url = new URL(productionOrigin);
      const normalizedOrigin = productionOrigin.replace(/\/$/, "");
      const unstablePreviewHost =
        url.hostname.includes("localhost") ||
        url.hostname.includes("127.0.0.1") ||
        url.hostname.includes("-git-") ||
        url.hostname.includes("-f5wol7z9g-");

      if (url.protocol !== "https:" || url.origin !== normalizedOrigin || unstablePreviewHost) {
        originBlocker =
          "Production NEXT_PUBLIC_APP_URL is detected, but it is not a stable HTTPS production origin.";
      }
    } catch {
      originBlocker = "Production NEXT_PUBLIC_APP_URL is detected, but it is not a valid URL.";
    }
  }
  const blockers = [
    missing.length > 0 ? `Missing Production env keys: ${missing.join(", ")}.` : "",
    hostSessionSecret?.target?.includes("preview")
      ? "HOST_SESSION_SECRET also targets Preview; keep Production and Preview host sessions separate."
      : "",
    nextPublicAppUrl?.target?.includes("preview")
      ? "NEXT_PUBLIC_APP_URL also targets Preview; keep the Production origin scoped to Production."
      : "",
    partyJoinCode?.target?.includes("preview")
      ? "PARTY_JOIN_CODE also targets Preview; keep the Production join code scoped to Production."
      : "",
    originBlocker
  ].filter(Boolean);
  const info = [
    "Production with PARTY_SESSION_IS_TEST=true is a supported deployment; the value is metadata for rehearsal/test rows, not the current-session selector.",
    hostPinHash?.target?.includes("preview")
      ? "HOST_PIN_HASH is shared between Preview and Production; accepted for this project."
      : "",
    partySessionMode?.target?.includes("preview")
      ? "PARTY_SESSION_IS_TEST targets both Preview and Production; this is accepted because current sessions are scoped by party key, deployment environment, and is_current."
      : "",
    productionIsTest
      ? `Production PARTY_SESSION_IS_TEST is detected as ${productionIsTest}; readiness does not require switching this value.`
      : "Production PARTY_SESSION_IS_TEST value is sensitive or unavailable; only presence/targeting could be verified.",
    productionOrigin
      ? "Production NEXT_PUBLIC_APP_URL value was detected and has an acceptable origin shape."
      : "Production NEXT_PUBLIC_APP_URL value is sensitive or unavailable; only presence/targeting could be verified.",
    partyJoinCode ? "PARTY_JOIN_CODE is present in Production without printing its value." : ""
  ].filter(Boolean);

  if (blockers.length > 0) {
    return {
      name: "Vercel Production env",
      ok: false,
      detail: blockers.join(" "),
      info
    };
  }

  return {
    name: "Vercel Production env",
    ok: true,
    detail: "All required Production env key names are present with acceptable targeting.",
    info
  };
}

async function checkPreviewRoutes(): Promise<CheckResult> {
  if (!previewUrl) {
    return {
      name: "Vercel preview routes",
      ok: true,
      detail: "Skipped because --preview-url was not provided."
    };
  }

  const routeChecks = await Promise.all(
    ["/en", "/display/party"].map(async (path) => {
      const response = await fetch(`${previewUrl}${path}`, { redirect: "manual" });
      return { path, status: response.status };
    })
  );
  const badRoute = routeChecks.find((route) => route.status !== 200);

  if (badRoute) {
    return {
      name: "Vercel preview routes",
      ok: false,
      detail: `${badRoute.path} returned HTTP ${badRoute.status}.`
    };
  }

  const sessionResponse = await fetch(`${previewUrl}/api/party/session`);

  if (sessionResponse.status !== 200) {
    return {
      name: "Vercel preview routes",
      ok: false,
      detail: `/api/party/session returned HTTP ${sessionResponse.status}.`
    };
  }

  const session = (await sessionResponse.json()) as PartySessionResponse;
  const blockers = [
    session.mode === "remote" ? "" : `mode is ${session.mode ?? "missing"}`,
    session.configured === true ? "" : "remote runtime is not configured",
    session.session?.isTest === true ? "" : `isTest is ${String(session.session?.isTest)}`
  ].filter(Boolean);

  return {
    name: "Vercel preview routes",
    ok: blockers.length === 0,
    detail:
      blockers.length === 0
        ? `/en and /display/party returned 200; /api/party/session is remote test mode with join URL ${session.joinUrl ?? "missing"}.`
        : blockers.join("; ")
  };
}

async function main() {
  const checks = [
    checkGitHubPr(),
    checkGitHubProtection(),
    checkVercelProductionEnv(),
    await checkPreviewRoutes()
  ];

  console.log("Release readiness preflight");

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "BLOCKED"} ${check.name}: ${check.detail}`);

    for (const info of check.info ?? []) {
      console.log(`INFO ${check.name}: ${info}`);
    }
  }

  if (checks.some((check) => !check.ok)) {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
