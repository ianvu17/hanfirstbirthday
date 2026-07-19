import { chromium, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MILESTONE4_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(".next", "milestone-4-screenshots");

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth
  );

  if (hasHorizontalOverflow) {
    throw new Error(`${label} has horizontal overflow.`);
  }
}

async function capture(page: Page, label: string, filePath: string, fullPage = true) {
  await page.waitForTimeout(450);
  await assertNoHorizontalOverflow(page, label);
  await page.screenshot({ path: filePath, fullPage });
}

async function captureDisplayLobby(page: Page) {
  await page.goto(`${baseUrl}/display/party`, { waitUntil: "networkidle" });
  await capture(page, "display-party-lobby", path.join(outputDir, "party-screen", "lobby.png"), false);
}

async function captureGuestJoinRequired(page: Page) {
  await page.goto(`${baseUrl}/en/play`, { waitUntil: "networkidle" });
  await capture(
    page,
    "guest-join-required",
    path.join(outputDir, "guest-phone", "join-required.png")
  );
}

async function captureQaFlow(page: Page) {
  await page.goto(`${baseUrl}/en/qa/party`, { waitUntil: "networkidle" });
  await page.getByTestId("host-controls").waitFor();
  await capture(page, "qa-lobby", path.join(outputDir, "qa", "01-lobby.png"));

  await page.getByTestId("host-prepare-first").click();
  await capture(page, "qa-question-ready", path.join(outputDir, "qa", "02-question-ready.png"));

  await page.getByTestId("host-reveal-choices").click();
  await capture(page, "qa-question-active", path.join(outputDir, "qa", "03-question-active.png"));

  await page.getByTestId("host-simulate-correct").click();
  await page.getByText(/Answers locked/).first().waitFor({ timeout: 25000 });
  await capture(page, "qa-question-locked", path.join(outputDir, "qa", "04-question-locked.png"));

  await page.getByTestId("host-reveal-answer").click();
  await capture(page, "qa-answer-reveal", path.join(outputDir, "qa", "05-answer-reveal.png"));

  await page.getByTestId("host-show-leaderboard").click();
  await capture(page, "qa-leaderboard", path.join(outputDir, "qa", "06-leaderboard.png"));

  await page.getByTestId("host-advance-leaderboard").click();
  await capture(page, "qa-next-question", path.join(outputDir, "qa", "07-next-question.png"));

  await page.getByTestId("host-reveal-choices").click();
  await page.getByText(/Answers locked/).first().waitFor({ timeout: 25000 });
  await page.getByTestId("host-reveal-answer").click();
  await page.getByTestId("host-show-leaderboard").click();
  await page.getByTestId("host-advance-leaderboard").click();
  await capture(page, "qa-finished", path.join(outputDir, "qa", "08-finished.png"));
}

async function captureVietnameseHarness(page: Page) {
  await page.goto(`${baseUrl}/vi/qa/party`, { waitUntil: "networkidle" });
  await page.getByTestId("host-prepare-first").click();
  await page.getByTestId("host-reveal-choices").click();
  await capture(page, "vi-question-active", path.join(outputDir, "guest-phone", "vi-active.png"));
}

async function captureMobileHarness(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/en/qa/party`, { waitUntil: "networkidle" });
  await page.getByTestId("host-prepare-first").click();
  await page.getByTestId("host-reveal-choices").click();
  await capture(page, "mobile-harness-active", path.join(outputDir, "responsive", "mobile-active.png"));
}

async function captureReducedMotion(page: Page) {
  await page.goto(`${baseUrl}/vi/qa/party`, { waitUntil: "networkidle" });
  await page.getByTestId("host-prepare-first").click();
  await page.getByTestId("host-reveal-choices").click();
  await capture(
    page,
    "reduced-motion-vi-active",
    path.join(outputDir, "accessibility", "reduced-motion-vi-active.png")
  );
}

async function main() {
  await mkdir(path.join(outputDir, "party-screen"), { recursive: true });
  await mkdir(path.join(outputDir, "guest-phone"), { recursive: true });
  await mkdir(path.join(outputDir, "qa"), { recursive: true });
  await mkdir(path.join(outputDir, "responsive"), { recursive: true });
  await mkdir(path.join(outputDir, "accessibility"), { recursive: true });

  const browser = await chromium.launch();

  try {
    const desktop = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await captureDisplayLobby(desktop);
    await captureGuestJoinRequired(desktop);
    await captureQaFlow(desktop);
    await captureVietnameseHarness(desktop);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await captureMobileHarness(mobile);
    await mobile.close();

    const reduced = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce"
    });
    await captureReducedMotion(reduced);
    await reduced.close();
  } finally {
    await browser.close();
  }

  console.log(`Milestone 4 browser screenshots saved to ${outputDir}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
