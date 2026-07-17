import { chromium, type Browser, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl =
  process.env.LEADERBOARD_RACE_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(".next", "leaderboard-race-screenshots");

async function reachLeaderboard(page: Page, locale: "en" | "vi" = "en") {
  await page.goto(`${baseUrl}/${locale}/qa/party`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => sessionStorage.removeItem("han-leaderboard-races"));
  await page.getByTestId("host-prepare-first").click();
  await page.getByTestId("host-reveal-choices").click();
  await page.getByTestId("host-simulate-correct").click();
  await page
    .getByText(locale === "vi" ? /câu trả lời đã khóa/i : /answers locked/i)
    .first()
    .waitFor({ timeout: 25_000 });
  await page.getByTestId("host-reveal-answer").click();
  await page.getByTestId("host-show-leaderboard").click();
  await page.getByTestId("leaderboard-race").waitFor();
}

async function assertRaceLayout(page: Page, label: string) {
  const race = page.getByTestId("leaderboard-race");
  const rowCount = await race.locator("[data-participant-id]").count();
  if (rowCount !== 10)
    throw new Error(`${label} rendered ${rowCount} rows instead of 10.`);

  const metrics = await race.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  if (metrics.scrollWidth > metrics.clientWidth) {
    throw new Error(`${label} leaderboard race has horizontal overflow.`);
  }
}

async function captureRace(
  browser: Browser,
  viewport: { width: number; height: number },
  label: string,
  reducedMotion = false,
) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  await reachLeaderboard(page);
  await assertRaceLayout(page, label);
  await page.waitForTimeout(reducedMotion ? 100 : 2_750);
  const stage = await page.getByTestId("leaderboard-race-stage").textContent();
  if (!stage?.match(/Live|Đang trực tuyến/))
    throw new Error(`${label} did not settle: ${stage}`);
  await page
    .getByTestId("leaderboard-race")
    .screenshot({ path: path.join(outputDir, `${label}.png`) });
  await context.close();
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();

  try {
    await captureRace(
      browser,
      { width: 1366, height: 768 },
      "1366x768-settled",
    );
    await captureRace(
      browser,
      { width: 1920, height: 1080 },
      "1920x1080-settled",
    );
    await captureRace(
      browser,
      { width: 1440, height: 900 },
      "1440x900-reduced-motion",
      true,
    );
  } finally {
    await browser.close();
  }

  console.log(`Leaderboard race screenshots saved to ${outputDir}.`);
}

void main();
