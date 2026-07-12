import { chromium, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MILESTONE5_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(".next", "milestone-5-screenshots");

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
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

async function main() {
  await mkdir(path.join(outputDir, "party-screen"), { recursive: true });
  await mkdir(path.join(outputDir, "guest-phone"), { recursive: true });
  await mkdir(path.join(outputDir, "host"), { recursive: true });
  await mkdir(path.join(outputDir, "qa"), { recursive: true });

  const browser = await chromium.launch();

  try {
    const display = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await display.goto(`${baseUrl}/display/party`, { waitUntil: "networkidle" });
    await capture(display, "party-screen-lobby", path.join(outputDir, "party-screen", "lobby.png"), false);
    await display.close();

    const guest = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await guest.goto(`${baseUrl}/en/play`, { waitUntil: "networkidle" });
    await capture(guest, "guest-play", path.join(outputDir, "guest-phone", "en-play.png"));
    await guest.goto(`${baseUrl}/vi/play`, { waitUntil: "networkidle" });
    await capture(guest, "guest-play-vi", path.join(outputDir, "guest-phone", "vi-play.png"));
    await guest.close();

    const host = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await host.goto(`${baseUrl}/en/host`, { waitUntil: "networkidle" });
    await capture(host, "host-pin", path.join(outputDir, "host", "pin.png"));
    await host.close();

    const qa = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await qa.goto(`${baseUrl}/en/qa/party`, { waitUntil: "networkidle" });
    await capture(qa, "qa-party", path.join(outputDir, "qa", "local-harness.png"));
    await qa.close();
  } finally {
    await browser.close();
  }

  console.log(`Milestone 5 browser screenshots saved to ${outputDir}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
