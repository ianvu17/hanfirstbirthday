import { chromium, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.env.PREVIEW_PARTY_BASE_URL;
const evidenceDir =
  process.env.PREVIEW_ONBOARDING_EVIDENCE_DIR ??
  "docs/evidence/production-polish-preview-onboarding";
const joinCode = process.env.PREVIEW_PARTY_JOIN_CODE ?? "han-turns-one";

if (!baseUrl) throw new Error("PREVIEW_PARTY_BASE_URL is required.");

function parseDotEnv(path: string) {
  const values = new Map<string, string>();
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    values.set(trimmed.slice(0, index), trimmed.slice(index + 1));
  }
  return values;
}

function getHostPin() {
  return (
    process.env.LIVE_REALTIME_HOST_PIN ??
    process.env.HOST_PIN ??
    parseDotEnv(".env.local").get("HOST_PIN") ??
    ""
  );
}

async function participantSnapshot(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/party/session", { cache: "no-store" });
    if (!response.ok) throw new Error("Participant snapshot failed.");
    return response.json();
  });
}

async function sharedSnapshot(page: Page) {
  const response = await page.context().request.get(`${baseUrl}/api/party/session`);
  if (!response.ok()) throw new Error("Shared snapshot failed.");
  return response.json();
}

async function waitForReadyCount(page: Page, expected: number) {
  await page.waitForFunction(
    async (readyCount) => {
      const response = await fetch("/api/party/session", { cache: "no-store" });
      const payload = await response.json();
      return payload.projection?.readyParticipantCount === readyCount;
    },
    expected,
    { timeout: 60_000 },
  );
}

async function main() {
  const hostPin = getHostPin();
  if (!hostPin) throw new Error("Host PIN is unavailable.");

  mkdirSync(join(evidenceDir, "screenshots"), { recursive: true });
  const browser = await chromium.launch();
  const host = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const guest = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "en-AU",
  });
  const hostPage = await host.newPage();
  const guestPage = await guest.newPage();
  hostPage.setDefaultTimeout(60_000);
  guestPage.setDefaultTimeout(60_000);

  try {
    await hostPage.goto(`${baseUrl}/en/host`, { waitUntil: "domcontentloaded" });
    const authorized = await host.request
      .get(`${baseUrl}/api/party/host/status`)
      .then((response) => response.json())
      .then((payload) => payload.authorized === true);
    if (!authorized) {
      await hostPage.getByLabel(/host pin/i).fill(hostPin);
      await hostPage.getByRole("button", { name: /^unlock$/i }).click();
      await hostPage.waitForFunction(async () => {
        const response = await fetch("/api/party/host/status", { cache: "no-store" });
        return (await response.json()).authorized === true;
      });
    }

    const createResponse = await host.request.post(`${baseUrl}/api/party/sessions`, {
      data: {
        action: "create",
        idempotencyKey: `production-polish-onboarding:${Date.now()}`,
        label: `Production polish onboarding ${new Date().toISOString()}`,
        archiveExisting: true,
        questionCount: 3,
      },
    });
    if (!createResponse.ok()) throw new Error(await createResponse.text());

    await guestPage.goto(`${baseUrl}/en?join=${joinCode}`, {
      waitUntil: "domcontentloaded",
    });
    await guestPage.getByTestId("welcome-start").click();
    if (!(await guestPage.getByTestId("onboarding-language").isVisible().catch(() => false))) {
      await guestPage.goto(`${baseUrl}/en?join=${joinCode}`, {
        waitUntil: "networkidle",
      });
      await guestPage.getByTestId("welcome-start").click();
    }
    await guestPage.getByTestId("onboarding-language").waitFor();
    await guestPage.getByTestId("language-en").click();
    await guestPage.getByTestId("guest-name-input").fill("Polish Guest");
    await guestPage.getByTestId("guest-name-submit").click();
    await guestPage.getByTestId("onboarding-party-photo").waitFor();

    const initial = await participantSnapshot(guestPage);
    const participantId = initial.participant?.id;
    if (!participantId) throw new Error("Initial participant identity was missing.");

    const galleryInput = guestPage.locator('input[type="file"][accept="image/jpeg,image/png,image/webp"]');
    if ((await galleryInput.getAttribute("capture")) !== null) {
      throw new Error("Gallery input unexpectedly forces capture.");
    }
    await galleryInput.setInputFiles(
      "docs/evidence/production-polish-local-20260718/screenshots/390x844-en-how-to-play.png",
    );
    await guestPage.getByRole("button", { name: /use this photo/i }).waitFor();

    await guestPage.route("**/api/party/participant/avatar", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4_000));
      await route.continue().catch(() => undefined);
    });
    void guestPage.getByRole("button", { name: /use this photo/i }).click();
    const progress = guestPage.getByTestId("avatar-upload-progress");
    await progress.waitFor();
    await guestPage.getByRole("button", { name: /cancel upload/i }).click();
    await progress.getByText(/upload cancelled/i).waitFor();
    await guestPage.screenshot({
      path: join(evidenceDir, "screenshots", "guest-upload-cancelled.png"),
      fullPage: true,
    });
    await guestPage.unrouteAll({ behavior: "wait" });

    await guestPage.getByRole("button", { name: /retry upload/i }).click();
    await progress.getByText(/your avatar is ready/i).waitFor();
    const saved = await participantSnapshot(guestPage);
    if (saved.participant?.id !== participantId || saved.participant?.avatar?.type !== "photo") {
      throw new Error("Avatar retry did not persist to the same participant.");
    }

    await guestPage.getByRole("button", { name: /^continue$/i }).click();
    await guestPage.getByTestId("onboarding-instructions").waitFor();
    await guestPage.getByTestId("onboarding-back").click();
    await guestPage.getByTestId("onboarding-party-photo").waitFor();
    await guestPage.getByTestId("onboarding-back").click();
    await guestPage.getByTestId("guest-name-input").fill("Polish Guest Edited");
    await guestPage.getByTestId("guest-name-submit").click();
    await guestPage.getByTestId("onboarding-back").click();
    await guestPage.getByTestId("onboarding-back").click();
    await guestPage.getByTestId("language-vi").click();
    await guestPage.waitForURL(/\/vi\?/);
    await guestPage.getByTestId("guest-name-submit").click();
    await guestPage.getByTestId("onboarding-party-photo").waitFor();
    await guestPage.getByRole("button", { name: /^tiếp tục$/i }).click();
    await guestPage.getByTestId("onboarding-instructions").waitFor();
    await guestPage.waitForTimeout(550);
    await guestPage.screenshot({
      path: join(evidenceDir, "screenshots", "guest-vi-how-to-after-edit.png"),
      fullPage: true,
    });
    await guestPage.getByTestId("instructions-continue").click();
    await guestPage.getByTestId("ready-start-quiz").click();
    await guestPage.waitForURL(/\/vi\/play/);
    await guestPage.getByText(/sảnh chờ/i).first().waitFor();

    const ready = await participantSnapshot(guestPage);
    if (
      ready.participant?.id !== participantId ||
      ready.participant?.displayName !== "Polish Guest Edited" ||
      ready.participant?.locale !== "vi" ||
      ready.participant?.isReady !== true
    ) {
      throw new Error(`Edited participant state mismatch: ${JSON.stringify(ready.participant)}`);
    }
    const lobby = await sharedSnapshot(hostPage);
    if (lobby.projection?.participantCount !== 1 || lobby.projection?.readyParticipantCount !== 1) {
      throw new Error(`Lobby count mismatch: ${JSON.stringify(lobby.projection)}`);
    }

    await guestPage.getByRole("link", { name: /chỉnh hồ sơ/i }).click();
    await guestPage.getByTestId("onboarding-ready").waitFor();
    await guestPage.getByTestId("onboarding-back").click();
    await waitForReadyCount(hostPage, 0);
    await hostPage.reload({ waitUntil: "domcontentloaded" });
    await hostPage.getByTestId("host-readiness-list").waitFor();
    await hostPage.getByText(/not ready/i).waitFor();
    await hostPage.screenshot({
      path: join(evidenceDir, "screenshots", "host-1-of-1-not-ready.png"),
      fullPage: true,
    });

    await guestPage.getByTestId("instructions-continue").click();
    await guestPage.getByTestId("ready-start-quiz").click();
    await waitForReadyCount(hostPage, 1);
    await hostPage.reload({ waitUntil: "domcontentloaded" });
    await hostPage.getByTestId("host-readiness-list").waitFor();
    await hostPage.getByText(/^ready$/i).waitFor();
    await hostPage.screenshot({
      path: join(evidenceDir, "screenshots", "host-1-of-1-ready.png"),
      fullPage: true,
    });

    await hostPage.getByRole("button", { name: /start game/i }).click();
    await hostPage.waitForFunction(async () => {
      const response = await fetch("/api/party/session", { cache: "no-store" });
      return (await response.json()).projection?.phase === "question_ready";
    });
    await guestPage.goto(`${baseUrl}/vi?join=${joinCode}`, { waitUntil: "domcontentloaded" });
    await guestPage.waitForURL(/\/vi\/play/);
    if ((await guestPage.getByTestId("onboarding-back").count()) !== 0) {
      throw new Error("Back remained available after host start.");
    }

    writeFileSync(
      join(evidenceDir, "results.json"),
      JSON.stringify(
        {
          baseUrl,
          createdAt: new Date().toISOString(),
          participantId,
          participantCount: 1,
          finalParticipant: ready.participant,
          upload: {
            progressUiObserved: true,
            clientAbortObserved: true,
            retryPersistedPhoto: true,
            galleryCaptureAttribute: null,
          },
          navigation: {
            sameParticipantAfterNameLocaleAvatarEdits: true,
            readyBackResetObserved: true,
            activeSessionRedirectedToPlay: true,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await host.close();
    await guest.close();
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
