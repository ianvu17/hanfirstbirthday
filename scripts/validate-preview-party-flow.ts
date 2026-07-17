import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";

import { getApprovedPartyConfig } from "../lib/party-engine";

const baseUrl =
  process.env.PREVIEW_PARTY_BASE_URL ??
  "https://hanfirstbirthday-5yl9hh1e3-ianalysed.vercel.app";
const evidenceDir =
  process.env.PREVIEW_PARTY_EVIDENCE_DIR ??
  "docs/evidence/deployed-ux-investigation-20260713-preview-r1";
const sessionStorageKey = "han-first-birthday:onboarding:v1";
const joinCode = process.env.PREVIEW_PARTY_JOIN_CODE ?? "han-turns-one";
const rehearsalQuestionLimit = Number(
  process.env.PREVIEW_PARTY_QUESTION_LIMIT ?? "2",
);
const sessionQuestionCount = Number(
  process.env.PREVIEW_PARTY_SESSION_QUESTION_COUNT ?? "10",
);
const skipViewportMatrix = process.env.PREVIEW_PARTY_SKIP_MATRIX === "true";
const approvedQuestions = getApprovedPartyConfig().questions;

type Locale = "en" | "vi";
type Metrics = Awaited<ReturnType<typeof collectMetrics>>;

const viewports = [
  [320, 568],
  [320, 667],
  [360, 640],
  [360, 740],
  [375, 667],
  [390, 640],
  [390, 844],
  [393, 852],
  [412, 732],
  [412, 915],
] as const;

function parseDotEnv(path: string) {
  const values = new Map<string, string>();
  const text = readFileSync(path, "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");
    values.set(trimmed.slice(0, equalsIndex), trimmed.slice(equalsIndex + 1));
  }

  return values;
}

function getHostPin() {
  if (process.env.LIVE_REALTIME_HOST_PIN) {
    return process.env.LIVE_REALTIME_HOST_PIN;
  }

  if (process.env.HOST_PIN) {
    return process.env.HOST_PIN;
  }

  try {
    return parseDotEnv(".env.local").get("HOST_PIN") ?? "";
  } catch {
    return "";
  }
}

function safeName(value: string) {
  return value
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function installDiagnostics(page: Page, surface: string) {
  await page.addInitScript({ content: "window.__name = (target) => target;" });
  await page.addInitScript(
    ({ surfaceName }) => {
      const labels = [
        "Live",
        "LIVE",
        "Reconnecting",
        "RECONNECTING",
        "Offline",
        "OFFLINE",
        "Resyncing",
        "RESYNCING",
        "Needs attention",
        "NEEDS ATTENTION",
        "Đang trực tuyến",
        "Đang kết nối lại",
        "Mất kết nối",
        "Đang đồng bộ lại",
        "Cần kiểm tra",
      ];
      const trace: Array<Record<string, unknown>> = [];
      let lastVisibleLabel = "";

      function push(type: string, detail: Record<string, unknown> = {}) {
        trace.push({
          type,
          surface: surfaceName,
          at: new Date().toISOString(),
          performanceMs: Math.round(performance.now()),
          route: location.pathname,
          detail,
        });
      }

      Object.defineProperty(window, "__previewPartyTrace", {
        value: trace,
        configurable: true,
      });

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const input = args[0];
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : String(input);
        const started = performance.now();
        push("fetch:start", {
          url: url.replace(/apikey=[^&]+/g, "apikey=[redacted]"),
        });

        try {
          const response = await originalFetch(...args);
          push("fetch:end", {
            url: url.replace(/apikey=[^&]+/g, "apikey=[redacted]"),
            status: response.status,
            ok: response.ok,
            durationMs: Math.round(performance.now() - started),
          });
          return response;
        } catch (error) {
          push("fetch:error", {
            url: url.replace(/apikey=[^&]+/g, "apikey=[redacted]"),
            durationMs: Math.round(performance.now() - started),
            online: navigator.onLine,
            message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      };

      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = class DiagnosticWebSocket extends OriginalWebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          super(url, protocols);
          const scrubbed = String(url).replace(
            /apikey=[^&]+/g,
            "apikey=[redacted]",
          );
          push("websocket:create", { url: scrubbed });
          this.addEventListener("open", () =>
            push("websocket:open", { url: scrubbed }),
          );
          this.addEventListener("close", (event) =>
            push("websocket:close", {
              url: scrubbed,
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            }),
          );
          this.addEventListener("error", () =>
            push("websocket:error", { url: scrubbed }),
          );
        }
      };

      window.addEventListener("online", () =>
        push("browser:online", { online: navigator.onLine }),
      );
      window.addEventListener("offline", () =>
        push("browser:offline", { online: navigator.onLine }),
      );
      document.addEventListener("visibilitychange", () =>
        push("document:visibility", {
          visibilityState: document.visibilityState,
        }),
      );

      function currentPhase() {
        const bodyText = document.body?.innerText ?? "";
        if (/Question live|Câu hỏi đang mở/.test(bodyText))
          return "question_active";
        if (/Answers locked|Câu trả lời đã khóa/.test(bodyText))
          return "question_locked";
        if (/Answer reveal|Mở đáp án/.test(bodyText)) return "answer_reveal";
        if (/Leaderboard|Bảng điểm/.test(bodyText)) return "leaderboard";
        if (
          /Get ready|Chuẩn bị nhé|Question ready|Câu hỏi đã sẵn sàng/.test(
            bodyText,
          )
        ) {
          return "question_ready";
        }
        if (/Party lobby|Sảnh chờ/.test(bodyText)) return "lobby";
        return "unknown";
      }

      function scanStatus() {
        const bodyText = document.body?.innerText ?? "";
        const found = labels.find((label) => bodyText.includes(label));
        const badge = Array.from(
          document.querySelectorAll("span[aria-label]"),
        ).find((node) =>
          found ? node.getAttribute("aria-label")?.includes(found) : false,
        );
        const icon = badge?.parentElement?.querySelector("svg");
        const iconIdentifier =
          icon
            ?.querySelector("path, circle, line, polyline")
            ?.getAttribute("d") ??
          icon?.outerHTML.slice(0, 80) ??
          null;

        if (found && found !== lastVisibleLabel) {
          push("visible-status", {
            previousVisibleLabel: lastVisibleLabel || null,
            nextVisibleLabel: found,
            iconIdentifier,
            online: navigator.onLine,
            phase: currentPhase(),
            scrollY: window.scrollY,
          });
          lastVisibleLabel = found;
        }
      }

      new MutationObserver(scanStatus).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      window.setInterval(scanStatus, 200);
      window.addEventListener("load", scanStatus);
    },
    { surfaceName: surface },
  );
}

async function collectTrace(page: Page) {
  return page.evaluate("window.__previewPartyTrace || []");
}

async function collectMetrics(page: Page, state: string) {
  return page.evaluate((stateName) => {
    const doc = document.documentElement;
    const body = document.body;
    const vv = window.visualViewport;
    const visualHeight = vv?.height ?? window.innerHeight;

    const rectFor = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        text: (element.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180),
      };
    };

    const beforeY = window.scrollY;
    window.scrollBy(0, 40);
    const canScroll = window.scrollY !== beforeY;
    window.scrollTo(0, beforeY);

    const submitRect = rectFor("[data-testid='guest-submit-answer']");
    const answerRect = rectFor("[role='radiogroup']");
    const questionRect = rectFor("[data-testid='guest-controller'] h1");
    const statusRect = rectFor(
      "[data-testid='guest-controller'] span[aria-label]",
    );

    return {
      state: stateName,
      url: location.href,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      visualViewportHeight: Math.round(visualHeight),
      documentClientHeight: doc.clientHeight,
      documentScrollHeight: doc.scrollHeight,
      bodyScrollHeight: body.scrollHeight,
      pageOverflowPixels: Math.max(0, doc.scrollHeight - doc.clientHeight),
      scrollY: Math.round(window.scrollY),
      canScroll,
      horizontalOverflowPixels: Math.max(0, doc.scrollWidth - doc.clientWidth),
      essentialControlBelowFold: submitRect
        ? submitRect.bottom > visualHeight
        : false,
      submitButtonRect: submitRect,
      answerListRect: answerRect,
      questionRect,
      statusBadgeRect: statusRect,
    };
  }, state);
}

async function waitForGuestPhase(page: Page, pattern: RegExp, timeout = 15000) {
  await page.locator("[data-testid='guest-controller']").waitFor({ timeout });
  await page.getByText(pattern).first().waitFor({ timeout });
}

async function setGuestSession(
  page: Page,
  locale: Locale,
  displayName: string,
) {
  console.log(`join-start ${locale} ${displayName}`);
  await page.goto(`${baseUrl}/${locale}?join=${joinCode}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.addInitScript(
    ({ key, name, language, publicJoinCode }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          step: "ready",
          selectedLanguage: language,
          playerName: name,
          guestSessionId: `codex-${crypto.randomUUID()}`,
          joinCode: publicJoinCode,
        }),
      );
    },
    {
      key: sessionStorageKey,
      name: displayName,
      language: locale,
      publicJoinCode: joinCode,
    },
  );
  await page.evaluate(
    async ({ key, name, language, publicJoinCode }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          step: "ready",
          selectedLanguage: language,
          playerName: name,
          guestSessionId: `codex-${crypto.randomUUID()}`,
          joinCode: publicJoinCode,
        }),
      );

      const response = await fetch("/api/party/join", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          displayName: name,
          locale: language,
          joinCode: publicJoinCode,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          payload?.error?.message ?? "Could not join preview party.",
        );
      }
    },
    {
      key: sessionStorageKey,
      name: displayName,
      language: locale,
      publicJoinCode: joinCode,
    },
  );
  await page.goto(`${baseUrl}/${locale}/play?join=${joinCode}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  try {
    await page
      .locator("[data-testid='guest-controller']")
      .waitFor({ timeout: 60_000 });
  } catch (error) {
    const fileBase = safeName(`join-failure-${locale}-${displayName}`);
    await page
      .screenshot({
        path: join(evidenceDir, "screenshots", `${fileBase}.png`),
        fullPage: true,
      })
      .catch(() => undefined);
    console.log(`join-failure ${locale} ${displayName}`);
    console.log(
      (
        await page
          .locator("body")
          .innerText()
          .catch(() => "")
      ).slice(0, 800),
    );
    throw error;
  }
  console.log(`join-ready ${locale} ${displayName}`);
}

async function openResumedGuest(page: Page, locale: Locale) {
  await page.addInitScript(
    ({ key, language, publicJoinCode }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({
          step: "ready",
          selectedLanguage: language,
          playerName: "Codex resumed guest",
          guestSessionId: "codex-resumed-guest",
          joinCode: publicJoinCode,
        }),
      );
    },
    { key: sessionStorageKey, language: locale, publicJoinCode: joinCode },
  );
  await page.goto(`${baseUrl}/${locale}/play?join=${joinCode}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page
    .locator("[data-testid='guest-controller']")
    .waitFor({ timeout: 60_000 });
}

async function hostLogin(page: Page, hostPin: string) {
  await page.goto(`${baseUrl}/en/host`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const status = await page
    .context()
    .request.get(`${baseUrl}/api/party/host/status`, { timeout: 60_000 })
    .then((response) => response.json());

  if (status.authorized) {
    return;
  }

  await page.getByLabel(/host pin/i).fill(hostPin);
  await page.getByRole("button", { name: /^unlock$/i }).click();
  await page.waitForFunction(async () => {
    const response = await fetch("/api/party/host/status", {
      cache: "no-store",
    });
    const payload = await response.json();
    return payload.authorized === true;
  });
}

async function createSessionIfNeeded(page: Page) {
  await page.goto(`${baseUrl}/en/host`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(1000);

  const createResponse = await page
    .context()
    .request.post(`${baseUrl}/api/party/sessions`, {
      timeout: 60_000,
      data: {
        action: "create",
        idempotencyKey: `codex-preview-validation:${Date.now()}`,
        label: `Codex Preview validation ${new Date().toISOString()}`,
        archiveExisting: true,
        questionCount: sessionQuestionCount,
      },
    });

  if (!createResponse.ok()) {
    throw new Error(
      `Could not create configured preview session: ${createResponse.status()} ${await createResponse.text()}`,
    );
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByText(/test session/i)
    .first()
    .waitFor({ timeout: 60_000 });

  const afterResponse = await page
    .context()
    .request.get(`${baseUrl}/api/party/session`, { timeout: 60_000 });
  return afterResponse.json();
}

async function clickHostAction(
  page: Page,
  name: RegExp,
  expectedPhase: string,
) {
  let button = page.getByRole("button", { name });
  const visible = await button.isVisible().catch(() => false);
  if (!visible) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    button = page.getByRole("button", { name });
    await button.waitFor({ state: "visible", timeout: 60_000 });
  }
  await button.click();
  await page.waitForFunction(
    async (phase) => {
      const response = await fetch("/api/party/session", { cache: "no-store" });
      const payload = await response.json();
      return payload.session && payload.projection?.phase === phase;
    },
    expectedPhase,
    { timeout: 60_000 },
  );
  await page.waitForTimeout(700);
}

async function snapshotPhase(context: BrowserContext) {
  const response = await context.request.get(`${baseUrl}/api/party/session`, {
    timeout: 60_000,
  });
  return response.json();
}

async function measureState(
  page: Page,
  state: string,
  language: Locale,
  viewport: readonly [number, number],
  textScale = 1,
) {
  if (textScale !== 1) {
    await page.addStyleTag({
      content: `html { font-size: ${textScale * 100}% !important; }`,
    });
    await page.waitForTimeout(150);
  }

  const metrics = await collectMetrics(page, state);
  const suffix = textScale === 1 ? "" : `-text-${Math.round(textScale * 100)}`;
  const fileBase = `${viewport[0]}x${viewport[1]}-${language}-${safeName(state)}${suffix}`;
  await page.screenshot({
    path: join(evidenceDir, "screenshots", `${fileBase}.png`),
    fullPage: true,
  });
  return metrics;
}

async function selectConfiguredAnswer(
  page: Page,
  locale: Locale,
  questionNumber: number,
  correctness: "correct" | "incorrect",
) {
  const question = approvedQuestions[questionNumber - 1];
  if (!question) {
    throw new Error(`Approved question ${questionNumber} is unavailable.`);
  }

  const option = question.options.find((candidate) =>
    correctness === "correct"
      ? candidate.id === question.correctOptionId
      : candidate.id !== question.correctOptionId,
  );
  if (!option) {
    throw new Error(
      `Could not find a ${correctness} option for question ${questionNumber}.`,
    );
  }

  await page.getByRole("radio", { name: option.label[locale] }).click();
}

function getLeaderboardRow(
  snapshot: Awaited<ReturnType<typeof snapshotPhase>>,
  displayName: string,
) {
  const row = snapshot.projection?.leaderboard?.find(
    (candidate: { displayName: string }) =>
      candidate.displayName === displayName,
  );
  if (!row) throw new Error(`Leaderboard row for ${displayName} was missing.`);
  return row;
}

async function observeCountdown(page: Page, surface: string) {
  const timer = page.getByTestId("party-countdown");
  await timer.waitFor({ timeout: 60_000 });
  const values: number[] = [];
  const deadline = Date.now() + 25000;

  while (Date.now() < deadline) {
    const text = await timer.textContent().catch(() => "");
    const value = Number.parseInt(text ?? "", 10);
    if (Number.isFinite(value) && values.at(-1) !== value) values.push(value);
    if (value === 0) break;
    await page.waitForTimeout(100);
  }

  return { surface, values };
}

function assertCompleteCountdown({
  surface,
  values,
}: Awaited<ReturnType<typeof observeCountdown>>) {
  if (values[0] !== 20)
    throw new Error(
      `${surface} countdown started at ${values[0] ?? "missing"}, expected 20.`,
    );
  for (let value = 20; value >= 0; value -= 1) {
    if (!values.includes(value))
      throw new Error(
        `${surface} countdown skipped ${value}: ${values.join(",")}`,
      );
  }
  return values;
}

async function main() {
  const hostPin = getHostPin();

  if (!hostPin) {
    throw new Error("Host PIN is unavailable in local environment.");
  }

  mkdirSync(join(evidenceDir, "screenshots"), { recursive: true });
  mkdirSync(join(evidenceDir, "measurements"), { recursive: true });
  mkdirSync(join(evidenceDir, "logs"), { recursive: true });

  const browser = await chromium.launch();
  const displayBrowser = await chromium.launch();
  const guestEnBrowser = await chromium.launch();
  const guestViBrowser = await chromium.launch();
  const guestSlowBrowser = await chromium.launch();
  const host = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const display = await displayBrowser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const guestEn = await guestEnBrowser.newContext({
    viewport: { width: 390, height: 640 },
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
  });
  const guestVi = await guestViBrowser.newContext({
    viewport: { width: 390, height: 640 },
    isMobile: true,
    hasTouch: true,
    locale: "vi-VN",
  });
  const guestSlow = await guestSlowBrowser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "en-US",
  });
  const hostPage = await host.newPage();
  const displayPage = await display.newPage();
  const guestEnPage = await guestEn.newPage();
  const guestViPage = await guestVi.newPage();
  const guestSlowPage = await guestSlow.newPage();

  for (const page of [
    hostPage,
    displayPage,
    guestEnPage,
    guestViPage,
    guestSlowPage,
  ]) {
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(60_000);
  }

  await Promise.all([
    installDiagnostics(hostPage, "host"),
    installDiagnostics(displayPage, "party-screen"),
    installDiagnostics(guestEnPage, "guest-en"),
    installDiagnostics(guestViPage, "guest-vi"),
    installDiagnostics(guestSlowPage, "guest-slow"),
  ]);

  const timeline: Array<Record<string, unknown>> = [];
  const matrix: Array<
    Metrics & {
      language: Locale;
      viewport: readonly [number, number];
      textScale: number;
    }
  > = [];

  await hostLogin(hostPage, hostPin);
  const sessionSnapshot = await createSessionIfNeeded(hostPage);
  const sessionId = sessionSnapshot.session?.id ?? null;
  timeline.push({
    step: "session-ready",
    at: new Date().toISOString(),
    sessionId,
    isTest: sessionSnapshot.session?.isTest,
    phase: sessionSnapshot.projection?.phase,
  });

  await displayPage.goto(`${baseUrl}/display/party`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await displayPage
    .getByText(/han-turns-one|party lobby/i)
    .first()
    .waitFor({ timeout: 60_000 });
  await displayPage.screenshot({
    path: join(evidenceDir, "screenshots", "party-screen-lobby.png"),
    fullPage: true,
  });

  const guestRunId = Date.now();
  const guestNames = {
    fast: `Codex Fast ${guestRunId}`,
    slow: `Codex Slow ${guestRunId}`,
    wrong: `Codex Wrong ${guestRunId}`,
  };
  await setGuestSession(guestEnPage, "en", guestNames.fast);
  await setGuestSession(guestViPage, "vi", guestNames.wrong);
  await setGuestSession(guestSlowPage, "en", guestNames.slow);
  await waitForGuestPhase(guestEnPage, /party lobby/i);
  await waitForGuestPhase(guestViPage, /sảnh chờ/i);
  await waitForGuestPhase(guestSlowPage, /party lobby/i);
  matrix.push({
    ...(await measureState(guestEnPage, "lobby", "en", [390, 640])),
    language: "en",
    viewport: [390, 640],
    textScale: 1,
  });
  matrix.push({
    ...(await measureState(guestViPage, "lobby", "vi", [390, 640])),
    language: "vi",
    viewport: [390, 640],
    textScale: 1,
  });

  await clickHostAction(hostPage, /start game/i, "question_ready");
  await waitForGuestPhase(guestEnPage, /answer choices are coming next/i);
  await waitForGuestPhase(guestViPage, /các đáp án sẽ xuất hiện/i);
  await waitForGuestPhase(guestSlowPage, /answer choices are coming next/i);
  timeline.push({ step: "question-preview", at: new Date().toISOString() });

  const countdownObservation = Promise.all([
    observeCountdown(hostPage, "host"),
    observeCountdown(displayPage, "party-screen"),
    observeCountdown(guestEnPage, "guest-en"),
  ]);
  await clickHostAction(hostPage, /reveal answers/i, "question_active");
  await guestEnPage.getByRole("radio").first().waitFor({ timeout: 60_000 });
  await guestViPage.getByRole("radio").first().waitFor({ timeout: 60_000 });
  await guestSlowPage.getByRole("radio").first().waitFor({ timeout: 60_000 });
  timeline.push({ step: "answers-active", at: new Date().toISOString() });

  await selectConfiguredAnswer(guestEnPage, "en", 1, "correct");

  const submitPromise = guestEnPage
    .getByRole("button", { name: /submit answer/i })
    .click()
    .then(() => guestEnPage.waitForTimeout(50));
  await selectConfiguredAnswer(guestViPage, "vi", 1, "incorrect");
  const viSubmitPromise = guestViPage
    .getByRole("button", { name: /gửi câu trả lời/i })
    .click();
  await guestSlowPage.waitForTimeout(5000);
  await selectConfiguredAnswer(guestSlowPage, "en", 1, "correct");
  const slowSubmitPromise = guestSlowPage
    .getByRole("button", { name: /submit answer/i })
    .click();
  await Promise.all([submitPromise, viSubmitPromise, slowSubmitPromise]);
  await Promise.all([
    guestEnPage.getByText(/answer locked/i).waitFor({ timeout: 60_000 }),
    guestViPage.getByText(/câu trả lời đã khóa/i).waitFor({ timeout: 60_000 }),
    guestSlowPage.getByText(/answer locked/i).waitFor({ timeout: 60_000 }),
  ]);
  timeline.push({
    step: "three-guests-submitted",
    at: new Date().toISOString(),
  });

  const [hostCountdownResult, displayCountdownResult, guestCountdownResult] =
    await countdownObservation;
  const hostCountdown = assertCompleteCountdown(hostCountdownResult);
  const displayCountdown = assertCompleteCountdown(displayCountdownResult);
  const guestCountdown = assertCompleteCountdown(guestCountdownResult);
  timeline.push({
    step: "countdown-observed",
    at: new Date().toISOString(),
    host: hostCountdown,
    partyScreen: displayCountdown,
    guest: guestCountdown,
  });

  matrix.push({
    ...(await measureState(guestEnPage, "answer-locked", "en", [390, 640])),
    language: "en",
    viewport: [390, 640],
    textScale: 1,
  });
  await guestEnPage.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await guestEnPage.getByText(/answer locked/i).waitFor({ timeout: 60_000 });
  timeline.push({
    step: "locked-survived-refresh",
    at: new Date().toISOString(),
  });

  await hostPage.waitForFunction(
    async () => {
      const response = await fetch("/api/party/session", { cache: "no-store" });
      const payload = await response.json();
      return payload.projection?.phase === "question_locked";
    },
    null,
    { timeout: 35_000 },
  );
  await guestEnPage.waitForTimeout(1000);
  matrix.push({
    ...(await measureState(guestEnPage, "answers-closed", "en", [390, 640])),
    language: "en",
    viewport: [390, 640],
    textScale: 1,
  });
  timeline.push({ step: "deadline-closed", at: new Date().toISOString() });

  const lateResponse = await guestEn.request.post(
    `${baseUrl}/api/party/response`,
    {
      timeout: 60_000,
      data: {
        selectedOptionId: "late-answer",
        submissionId: `late:${Date.now()}`,
      },
    },
  );
  timeline.push({
    step: "late-answer-attempt",
    at: new Date().toISOString(),
    status: lateResponse.status(),
  });

  await clickHostAction(hostPage, /reveal answer/i, "answer_reveal");
  await guestEnPage
    .getByText(/nice one|not this time|time's up/i)
    .waitFor({ timeout: 60_000 });
  matrix.push({
    ...(await measureState(guestEnPage, "answer-reveal", "en", [390, 640])),
    language: "en",
    viewport: [390, 640],
    textScale: 1,
  });

  await clickHostAction(hostPage, /show leaderboard/i, "leaderboard");
  await guestEnPage.getByText(/leaderboard/i).waitFor({ timeout: 60_000 });
  const firstLeaderboardSnapshot = await snapshotPhase(host);
  const fastAfterFirst = getLeaderboardRow(
    firstLeaderboardSnapshot,
    guestNames.fast,
  );
  const slowAfterFirst = getLeaderboardRow(
    firstLeaderboardSnapshot,
    guestNames.slow,
  );
  const wrongAfterFirst = getLeaderboardRow(
    firstLeaderboardSnapshot,
    guestNames.wrong,
  );
  if (
    fastAfterFirst.score <= slowAfterFirst.score ||
    slowAfterFirst.score <= 0 ||
    wrongAfterFirst.score !== 0 ||
    fastAfterFirst.pointsGained !== fastAfterFirst.score ||
    slowAfterFirst.pointsGained !== slowAfterFirst.score
  ) {
    throw new Error(
      `Question 1 scoring mismatch: ${JSON.stringify({ fastAfterFirst, slowAfterFirst, wrongAfterFirst })}`,
    );
  }
  matrix.push({
    ...(await measureState(guestEnPage, "leaderboard", "en", [390, 640])),
    language: "en",
    viewport: [390, 640],
    textScale: 1,
  });
  timeline.push({
    step: "leaderboard",
    at: new Date().toISOString(),
    scoring: { fastAfterFirst, slowAfterFirst, wrongAfterFirst },
  });

  await clickHostAction(hostPage, /next question/i, "question_ready");
  await waitForGuestPhase(guestEnPage, /answer choices are coming next/i);
  await waitForGuestPhase(guestSlowPage, /answer choices are coming next/i);
  timeline.push({
    step: "next-question-preview",
    at: new Date().toISOString(),
  });

  const guestResumeStorage = skipViewportMatrix
    ? undefined
    : await guestEn.storageState();
  if (!skipViewportMatrix) {
    for (const viewport of viewports) {
      for (const language of ["en", "vi"] as const) {
        console.log(`matrix-start ${language} ${viewport[0]}x${viewport[1]}`);
        const context = await browser.newContext({
          viewport: { width: viewport[0], height: viewport[1] },
          isMobile: true,
          hasTouch: true,
          locale: language === "vi" ? "vi-VN" : "en-US",
          storageState: guestResumeStorage,
        });
        const page = await context.newPage();
        page.setDefaultTimeout(60_000);
        page.setDefaultNavigationTimeout(60_000);
        await installDiagnostics(
          page,
          `matrix-${language}-${viewport[0]}x${viewport[1]}`,
        );
        await openResumedGuest(page, language);
        await waitForGuestPhase(
          page,
          language === "vi"
            ? /các đáp án sẽ xuất hiện/i
            : /answer choices are coming next/i,
        );
        matrix.push({
          ...(await measureState(page, "question-preview", language, viewport)),
          language,
          viewport,
          textScale: 1,
        });
        await context.close();
        console.log(`matrix-done ${language} ${viewport[0]}x${viewport[1]}`);
      }
    }
  }

  if (!skipViewportMatrix) {
    for (const scaled of [
      { viewport: [390, 640] as const, language: "vi" as const },
      { viewport: [375, 667] as const, language: "en" as const },
    ]) {
      const context = await browser.newContext({
        viewport: { width: scaled.viewport[0], height: scaled.viewport[1] },
        isMobile: true,
        hasTouch: true,
        locale: scaled.language === "vi" ? "vi-VN" : "en-US",
        storageState: guestResumeStorage,
      });
      const page = await context.newPage();
      page.setDefaultTimeout(60_000);
      page.setDefaultNavigationTimeout(60_000);
      await installDiagnostics(page, `scaled-${scaled.language}`);
      await openResumedGuest(page, scaled.language);
      await waitForGuestPhase(
        page,
        scaled.language === "vi"
          ? /các đáp án sẽ xuất hiện/i
          : /answer choices are coming next/i,
      );
      matrix.push({
        ...(await measureState(
          page,
          "question-preview",
          scaled.language,
          scaled.viewport,
          1.25,
        )),
        language: scaled.language,
        viewport: scaled.viewport,
        textScale: 1.25,
      });
      await context.close();
    }
  }

  await guestEnPage.waitForTimeout(8500);
  timeline.push({ step: "idle-after-poll", at: new Date().toISOString() });
  await guestEnPage.context().setOffline(true);
  await guestEnPage.waitForTimeout(1800);
  await guestEnPage.context().setOffline(false);
  await guestEnPage.waitForTimeout(3500);
  timeline.push({ step: "offline-recovery", at: new Date().toISOString() });

  const totalQuestions = sessionSnapshot.projection?.totalQuestions ?? 0;
  const lastQuestionToRun = Math.min(rehearsalQuestionLimit, totalQuestions);

  for (
    let questionNumber = 2;
    questionNumber <= lastQuestionToRun;
    questionNumber += 1
  ) {
    await clickHostAction(hostPage, /reveal answers/i, "question_active");
    await Promise.all([
      guestEnPage.getByRole("radio").first().waitFor({ timeout: 60_000 }),
      guestViPage.getByRole("radio").last().waitFor({ timeout: 60_000 }),
      guestSlowPage.getByRole("radio").first().waitFor({ timeout: 60_000 }),
    ]);
    if (questionNumber === 2) {
      await selectConfiguredAnswer(
        guestViPage,
        "vi",
        questionNumber,
        "correct",
      );
      await guestViPage
        .getByRole("button", { name: /gửi câu trả lời/i })
        .click();
      await guestEnPage.waitForTimeout(4000);
      await selectConfiguredAnswer(
        guestEnPage,
        "en",
        questionNumber,
        "correct",
      );
      await selectConfiguredAnswer(
        guestSlowPage,
        "en",
        questionNumber,
        "incorrect",
      );
      await Promise.all([
        guestEnPage.getByRole("button", { name: /submit answer/i }).click(),
        guestSlowPage.getByRole("button", { name: /submit answer/i }).click(),
      ]);
    } else {
      await selectConfiguredAnswer(
        guestEnPage,
        "en",
        questionNumber,
        "correct",
      );
      await selectConfiguredAnswer(
        guestViPage,
        "vi",
        questionNumber,
        "incorrect",
      );
      await Promise.all([
        guestEnPage.getByRole("button", { name: /submit answer/i }).click(),
        guestViPage.getByRole("button", { name: /gửi câu trả lời/i }).click(),
      ]);
    }
    await hostPage.waitForFunction(
      async () => {
        const response = await fetch("/api/party/session", {
          cache: "no-store",
        });
        const payload = await response.json();
        return payload.projection?.phase === "question_locked";
      },
      null,
      { timeout: 35_000 },
    );
    await clickHostAction(hostPage, /reveal answer/i, "answer_reveal");
    await Promise.all([
      guestEnPage.getByText(/^correct answer$/i).waitFor({ timeout: 60_000 }),
      guestViPage.getByText(/^đáp án đúng$/i).waitFor({ timeout: 60_000 }),
      guestSlowPage.getByText(/^correct answer$/i).waitFor({ timeout: 60_000 }),
    ]);

    const explicitWrongLabels =
      (await guestEnPage.getByText(/^your answer$/i).count()) +
      (await guestViPage.getByText(/^đáp án của bạn$/i).count()) +
      (await guestSlowPage.getByText(/^your answer$/i).count());
    if (explicitWrongLabels < 1) {
      throw new Error(
        `Question ${questionNumber} did not explicitly label a wrong selected answer.`,
      );
    }
    if (questionNumber === 2) {
      await Promise.all([
        guestEnPage.screenshot({
          path: join(
            evidenceDir,
            "screenshots",
            "guest-en-explicit-reveal.png",
          ),
          fullPage: true,
        }),
        guestViPage.screenshot({
          path: join(
            evidenceDir,
            "screenshots",
            "guest-vi-explicit-reveal.png",
          ),
          fullPage: true,
        }),
        displayPage.screenshot({
          path: join(
            evidenceDir,
            "screenshots",
            "party-screen-polished-reveal.png",
          ),
          fullPage: true,
        }),
      ]);
    }

    await clickHostAction(hostPage, /show leaderboard/i, "leaderboard");
    const leaderboardSnapshot = await snapshotPhase(host);
    const fastRow = getLeaderboardRow(leaderboardSnapshot, guestNames.fast);
    const slowRow = getLeaderboardRow(leaderboardSnapshot, guestNames.slow);
    const wrongRow = getLeaderboardRow(leaderboardSnapshot, guestNames.wrong);

    if (questionNumber === 2) {
      if (
        wrongRow.pointsGained <= 0 ||
        wrongRow.rank >= wrongRow.previousRank ||
        slowRow.pointsGained !== 0
      ) {
        throw new Error(
          `Question 2 rank movement mismatch: ${JSON.stringify({ fastRow, slowRow, wrongRow })}`,
        );
      }
    } else if (
      fastRow.pointsGained <= 0 ||
      wrongRow.pointsGained !== 0 ||
      slowRow.pointsGained !== 0 ||
      slowRow.answeredCount !== 3
    ) {
      throw new Error(
        `Question ${questionNumber} timeout scoring mismatch: ${JSON.stringify({ fastRow, slowRow, wrongRow })}`,
      );
    }
    if (questionNumber === totalQuestions) {
      await clickHostAction(hostPage, /show winner/i, "finished");
    } else {
      await clickHostAction(hostPage, /next question/i, "question_ready");
    }
    timeline.push({
      step: `question-${questionNumber}-complete`,
      at: new Date().toISOString(),
      scoring: { fastRow, slowRow, wrongRow },
    });
  }

  let certificateValidation: Record<string, unknown> | null = null;
  if (lastQuestionToRun === totalQuestions && totalQuestions > 0) {
    await Promise.all([
      guestEnPage.reload({ waitUntil: "domcontentloaded" }),
      guestViPage.reload({ waitUntil: "domcontentloaded" }),
      guestSlowPage.reload({ waitUntil: "domcontentloaded" }),
      displayPage.reload({ waitUntil: "domcontentloaded" }),
    ]);
    await displayPage
      .getByText(/mastermind/i)
      .first()
      .waitFor({ timeout: 60_000 });

    const [enCertificate, viCertificate, slowCertificate] = await Promise.all([
      guestEn.request.get(`${baseUrl}/api/party/certificate`, {
        timeout: 60_000,
      }),
      guestVi.request.get(`${baseUrl}/api/party/certificate`, {
        timeout: 60_000,
      }),
      guestSlow.request.get(`${baseUrl}/api/party/certificate`, {
        timeout: 60_000,
      }),
    ]);
    const certificateResults = [
      { locale: "en-fast", response: enCertificate },
      { locale: "vi-wrong", response: viCertificate },
      { locale: "en-slow", response: slowCertificate },
    ];
    const winners = certificateResults.filter(
      ({ response }) => response.status() === 200,
    );
    const nonWinners = certificateResults.filter(
      ({ response }) => response.status() === 403,
    );
    const winnerCertificate = winners[0]?.response;
    if (winners.length !== 1 || nonWinners.length !== 2 || !winnerCertificate) {
      throw new Error(
        `Certificate authorization mismatch: ${certificateResults.map(({ locale, response }) => `${locale}=${response.status()}`).join(" ")}`,
      );
    }
    const certificateBytes = await winnerCertificate.body();
    const certificatePdf = await PDFDocument.load(certificateBytes);
    if (certificatePdf.getPageCount() !== 1)
      throw new Error("Winner certificate was not one page.");
    writeFileSync(
      join(evidenceDir, "winner-certificate.pdf"),
      certificateBytes,
    );
    certificateValidation = {
      winnerLocale: winners[0].locale,
      winnerStatus: winnerCertificate.status(),
      nonWinnerStatuses: nonWinners.map(({ response }) => response.status()),
      contentType: winnerCertificate.headers()["content-type"],
      pageCount: certificatePdf.getPageCount(),
      bytes: certificateBytes.byteLength,
    };
    await displayPage.screenshot({
      path: join(evidenceDir, "screenshots", "party-screen-final-winner.png"),
      fullPage: true,
    });
  }

  const traces = {
    host: await collectTrace(hostPage),
    partyScreen: await collectTrace(displayPage),
    guestEn: await collectTrace(guestEnPage),
    guestVi: await collectTrace(guestViPage),
    guestSlow: await collectTrace(guestSlowPage),
  };
  const finalSnapshot = await snapshotPhase(host);

  writeFileSync(
    join(evidenceDir, "results.json"),
    JSON.stringify(
      {
        baseUrl,
        sessionId,
        isTest: sessionSnapshot.session?.isTest,
        createdAt: new Date().toISOString(),
        finalSnapshot,
        rehearsalQuestionLimit,
        certificateValidation,
        timeline,
        matrix,
        traces,
      },
      null,
      2,
    ),
  );

  await Promise.all([
    host.close(),
    display.close(),
    guestEn.close(),
    guestVi.close(),
    guestSlow.close(),
  ]);
  await Promise.all([
    browser.close(),
    displayBrowser.close(),
    guestEnBrowser.close(),
    guestViBrowser.close(),
    guestSlowBrowser.close(),
  ]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
