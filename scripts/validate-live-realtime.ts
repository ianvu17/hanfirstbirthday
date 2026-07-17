import crypto from "node:crypto";
import { existsSync } from "node:fs";

import {
  chromium,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const baseUrl = process.env.LIVE_REALTIME_BASE_URL ?? "http://localhost:3001";
const validationJoinCode =
  process.env.LIVE_REALTIME_JOIN_CODE ?? process.env.PARTY_JOIN_CODE ?? "";
const validationHostPin = process.env.LIVE_REALTIME_HOST_PIN;
const sessionKey = "han-first-birthday:onboarding:v1";
const baseHost = new URL(baseUrl).hostname;
const baseIsSecure = new URL(baseUrl).protocol === "https:";

if (!validationJoinCode.startsWith("codex-m5-")) {
  throw new Error(
    "LIVE_REALTIME_JOIN_CODE must be a codex-m5-* validation code.",
  );
}

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function createHostCookieValue(now = Date.now()) {
  const expiresAt = now + 1000 * 60 * 60 * 12;
  const nonce = crypto.randomBytes(16).toString("base64url");
  const payload = `host:${expiresAt}.${nonce}`;
  const secret =
    process.env.HOST_SESSION_SECRET ||
    process.env.HOST_PIN_HASH ||
    process.env.HOST_PIN ||
    "";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return { value: `${expiresAt}.${nonce}.${signature}`, expiresAt };
}

function watchPage(page: Page, label: string, failures: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      if (/status of (401|409)/.test(message.text())) {
        return;
      }

      failures.push(`${label} console error: ${message.text()}`);
    }
  });
  page.on("requestfailed", (request) => {
    if (request.failure()?.errorText === "net::ERR_ABORTED") {
      return;
    }

    failures.push(
      `${label} request failed: ${request.url()} ${request.failure()?.errorText || ""}`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 500) {
      failures.push(`${label} HTTP ${response.status()}: ${response.url()}`);
    }
  });
}

async function createGuestPage(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  locale: "en" | "vi",
  name: string,
  id: string,
) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  await context.addInitScript(
    ({ sessionKey, name, id }) => {
      window.sessionStorage.setItem(
        sessionKey,
        JSON.stringify({ playerName: name, guestSessionId: id }),
      );
    },
    { sessionKey, name, id },
  );
  const page = await context.newPage();
  await page.goto(`${baseUrl}/${locale}/play`, {
    waitUntil: "domcontentloaded",
  });
  return { context, page };
}

async function snapshot(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/party/session", {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    return response.json();
  });
}

async function hostCommand(page: Page, type: string) {
  const current = await snapshot(page);
  const result = await page.evaluate(
    async ({ type, revision }) => {
      const response = await fetch("/api/party/host/command", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          type,
          expectedRevision: revision,
          commandId: `${type}:${revision}:${globalThis.crypto.randomUUID()}`,
        }),
      });
      return {
        ok: response.ok,
        status: response.status,
        body: await response.json(),
      };
    },
    { type, revision: current.session.revision },
  );

  if (!result.ok || !result.body.ok) {
    throw new Error(
      `Host command ${type} failed with HTTP ${result.status}: ${
        result.body?.error?.message || "unknown error"
      }`,
    );
  }

  return result.body.snapshot;
}

async function authenticateHost(context: BrowserContext) {
  if (!validationHostPin) {
    const hostCookie = createHostCookieValue();
    await context.addCookies([
      {
        name: "han_host_session",
        value: hostCookie.value,
        domain: baseHost,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        secure: baseIsSecure,
        expires: Math.floor(hostCookie.expiresAt / 1000),
      },
    ]);
    return "signed-cookie";
  }

  const loginPage = await context.newPage();
  try {
    await loginPage.goto(`${baseUrl}/en/host`, {
      waitUntil: "domcontentloaded",
    });
    const result = await loginPage.evaluate(
      async ({ pin }) => {
        const response = await fetch("/api/party/host/login", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ pin }),
        });
        return { ok: response.ok, status: response.status };
      },
      { pin: validationHostPin },
    );

    if (!result.ok) {
      throw new Error(`host PIN login failed with HTTP ${result.status}`);
    }
  } finally {
    await loginPage.close();
  }

  return "pin-login";
}

async function extendActiveQuestionDeadline(sessionId: string) {
  const deadline = new Date(Date.now() + 1000 * 60 * 2).toISOString();
  const updated = await service
    .from("party_sessions")
    .update({ question_deadline_at: deadline })
    .eq("id", sessionId);

  if (updated.error) {
    throw updated.error;
  }
}

async function expireActiveQuestionDeadline(sessionId: string) {
  const deadline = new Date(Date.now() - 1000).toISOString();
  const updated = await service
    .from("party_sessions")
    .update({ question_deadline_at: deadline })
    .eq("id", sessionId);

  if (updated.error) {
    throw updated.error;
  }
}

async function responsePost(page: Page, payload: Record<string, unknown>) {
  return page.evaluate(async (payload) => {
    const response = await fetch("/api/party/response", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    };
  }, payload);
}

async function cleanup() {
  const sessions = await service
    .from("party_sessions")
    .select("id, public_join_code")
    .eq("public_join_code", validationJoinCode)
    .eq("is_test", true);

  if (sessions.error) {
    throw sessions.error;
  }

  const ids = (sessions.data || []).map((row) => row.id);
  const counts = {
    question_responses: 0,
    participants: 0,
    party_sessions: ids.length,
  };

  if (ids.length > 0) {
    const responses = await service
      .from("question_responses")
      .select("*", { count: "exact", head: true })
      .in("party_session_id", ids);
    const participants = await service
      .from("participants")
      .select("*", { count: "exact", head: true })
      .in("party_session_id", ids);

    if (responses.error) {
      throw responses.error;
    }
    if (participants.error) {
      throw participants.error;
    }

    counts.question_responses = responses.count || 0;
    counts.participants = participants.count || 0;

    const deleted = await service.from("party_sessions").delete().in("id", ids);
    if (deleted.error) {
      throw deleted.error;
    }
  }

  console.log("Cleanup counts:");
  console.log(`question_responses: ${counts.question_responses}`);
  console.log(`participants: ${counts.participants}`);
  console.log(`party_sessions: ${counts.party_sessions}`);
}

async function main() {
  const browser = await chromium.launch();
  const failures: string[] = [];

  try {
    const displayContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const display = await displayContext.newPage();
    watchPage(display, "display", failures);
    await display.goto(`${baseUrl}/display/party`, {
      waitUntil: "domcontentloaded",
    });
    await expect(display.getByText(/Remote test session/)).toBeVisible({
      timeout: 15000,
    });

    const guestA = await createGuestPage(
      browser,
      "en",
      "Codex Guest A",
      "codex-guest-a",
    );
    const guestB = await createGuestPage(
      browser,
      "vi",
      "Codex Guest B",
      "codex-guest-b",
    );
    watchPage(guestA.page, "guestA", failures);
    watchPage(guestB.page, "guestB", failures);
    await expect(guestA.page.getByText("Codex Guest A")).toBeVisible({
      timeout: 15000,
    });
    await expect(guestB.page.getByText("Codex Guest B")).toBeVisible({
      timeout: 15000,
    });
    await expect(display.getByText(/Participants:\s*2/)).toBeVisible({
      timeout: 15000,
    });

    const unauthorizedHost = await guestA.page.evaluate(async () => {
      const current = await fetch("/api/party/session").then((response) =>
        response.json(),
      );
      const response = await fetch("/api/party/host/command", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          type: "PREPARE_FIRST_QUESTION",
          expectedRevision: current.session.revision,
          commandId: `unauthorized:${globalThis.crypto.randomUUID()}`,
        }),
      });
      return response.status;
    });
    if (unauthorizedHost !== 401) {
      throw new Error(`unauthorized host command returned ${unauthorizedHost}`);
    }

    const forgedHost = await guestA.context
      .addCookies([
        {
          name: "han_host_session",
          value: "forged.cookie.value",
          domain: baseHost,
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
          secure: baseIsSecure,
        },
      ])
      .then(() =>
        guestA.page.evaluate(async () => {
          const current = await fetch("/api/party/session").then((response) =>
            response.json(),
          );
          const response = await fetch("/api/party/host/command", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              accept: "application/json",
            },
            body: JSON.stringify({
              type: "PREPARE_FIRST_QUESTION",
              expectedRevision: current.session.revision,
              commandId: `forged:${globalThis.crypto.randomUUID()}`,
            }),
          });
          return response.status;
        }),
      );
    if (forgedHost !== 401) {
      throw new Error(`forged host cookie command returned ${forgedHost}`);
    }

    const hostContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    await authenticateHost(hostContext);
    const host = await hostContext.newPage();
    watchPage(host, "host", failures);
    await host.goto(`${baseUrl}/en/host`, { waitUntil: "domcontentloaded" });
    await expect(host.getByText(/Han Party Control/)).toBeVisible({
      timeout: 15000,
    });

    await hostCommand(host, "PREPARE_FIRST_QUESTION");
    await expect(display.getByText(/Question ready/)).toBeVisible({
      timeout: 15000,
    });
    const openedSnapshot = await hostCommand(host, "REVEAL_CHOICES");
    await extendActiveQuestionDeadline(openedSnapshot.session.id);
    await expect(
      display.getByText(/Temporary approved-content sample 1/),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      guestA.page.getByText(/Temporary approved-content sample 1/),
    ).toBeVisible({ timeout: 15000 });
    await expect(
      guestB.page.getByText(/Câu hỏi mẫu nội dung đã duyệt 1/),
    ).toBeVisible({ timeout: 15000 });

    const snapA = await snapshot(guestA.page);
    const participantA = snapA.participant.id;
    const questionId = snapA.guest.currentQuestion.id;
    const answerA = await responsePost(guestA.page, {
      selectedOptionId: "option-b",
      submissionId: `${participantA}:${questionId}:option-b`,
      is_correct: true,
      score: 999999,
      is_host: true,
      status: "completed",
      leaderboard_position: 1,
    });
    if (!answerA.ok) {
      throw new Error(`guest A response failed with HTTP ${answerA.status}`);
    }
    await expect(display.getByText(/Submitted:\s*1/)).toBeVisible({
      timeout: 15000,
    });

    const duplicate = await responsePost(guestA.page, {
      selectedOptionId: "option-b",
      submissionId: `${participantA}:${questionId}:option-b`,
      is_correct: true,
      score: 999999,
      is_host: true,
      status: "completed",
      leaderboard_position: 1,
    });
    if (!duplicate.ok) {
      throw new Error(
        `exact duplicate response was not idempotent: ${duplicate.status}`,
      );
    }

    const conflict = await responsePost(guestA.page, {
      selectedOptionId: "option-a",
      submissionId: `${participantA}:${questionId}:option-a`,
    });
    if (conflict.status !== 409) {
      throw new Error(
        `conflicting duplicate response returned ${conflict.status}`,
      );
    }

    const snapB = await snapshot(guestB.page);
    const participantB = snapB.participant.id;
    const answerB = await responsePost(guestB.page, {
      selectedOptionId: "option-a",
      submissionId: `${participantB}:${questionId}:option-a`,
    });
    if (!answerB.ok) {
      throw new Error(`guest B response failed with HTTP ${answerB.status}`);
    }
    await expect(display.getByText(/Submitted:\s*2/)).toBeVisible({
      timeout: 15000,
    });
    await expect(host.getByText(/Submitted/)).toBeVisible({ timeout: 15000 });

    await expireActiveQuestionDeadline(openedSnapshot.session.id);
    await snapshot(host);
    await expect(display.getByText(/Answers locked/)).toBeVisible({
      timeout: 15000,
    });
    const staleAfterLock = await responsePost(guestB.page, {
      selectedOptionId: "option-b",
      submissionId: `late:${Date.now()}`,
    });
    if (staleAfterLock.status !== 409) {
      throw new Error(
        `stale locked response returned ${staleAfterLock.status}`,
      );
    }

    await hostCommand(host, "REVEAL_ANSWER");
    await expect(display.getByText(/Answer reveal/).first()).toBeVisible({
      timeout: 15000,
    });
    await hostCommand(host, "SHOW_LEADERBOARD");
    await expect(display.getByText(/Leaderboard/).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(display.getByText("Codex Guest A")).toBeVisible({
      timeout: 15000,
    });
    await expect(display.getByText("Codex Guest B")).toBeVisible({
      timeout: 15000,
    });

    await guestA.page.reload({ waitUntil: "domcontentloaded" });
    await expect(guestA.page.getByText("Codex Guest A")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      guestA.page.getByText(/Your score:\s*[\d,]+ points/),
    ).toBeVisible({ timeout: 15000 });
    await host.reload({ waitUntil: "domcontentloaded" });
    await expect(host.getByText(/leaderboard/)).toBeVisible({ timeout: 15000 });

    const guestC = await createGuestPage(
      browser,
      "en",
      "Codex Guest C",
      "codex-guest-c",
    );
    watchPage(guestC.page, "guestC", failures);
    await expect(guestC.page.getByText("Codex Guest C")).toBeVisible({
      timeout: 15000,
    });
    await expect(display.getByText(/Participants:\s*3/)).toBeVisible({
      timeout: 15000,
    });

    await guestB.page.goto(`${baseUrl}/vi`, { waitUntil: "domcontentloaded" });
    await guestB.page.goto(`${baseUrl}/vi/play`, {
      waitUntil: "domcontentloaded",
    });
    await expect(guestB.page.getByText("Codex Guest B")).toBeVisible({
      timeout: 15000,
    });

    if (failures.length > 0) {
      throw new Error(failures.join("\n"));
    }

    console.log("multi-client hosted realtime rehearsal: PASS");
  } finally {
    await browser.close();
    await cleanup();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Live realtime validation failed.",
  );
  process.exit(1);
});
