import { chromium, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Locale } from "@/lib/i18n/routing";

const baseUrl = process.env.PRODUCTION_POLISH_BASE_URL ?? "http://localhost:3000";
const outputDir =
  process.env.PRODUCTION_POLISH_EVIDENCE_DIR ??
  path.join(".next", "production-polish-screenshots");
const sessionKey = "han-first-birthday:onboarding:v1";

const captures: Array<{
  name: string;
  locale: Locale;
  width: number;
  height: number;
  textScale?: number;
}> = [
  { name: "390x640-en-how-to-play", locale: "en", width: 390, height: 640 },
  { name: "390x844-vi-how-to-play", locale: "vi", width: 390, height: 844 },
  { name: "768x1024-vi-how-to-play", locale: "vi", width: 768, height: 1024 },
  { name: "1366x768-en-how-to-play", locale: "en", width: 1366, height: 768 },
  { name: "1440x900-vi-how-to-play", locale: "vi", width: 1440, height: 900 },
  { name: "1920x1080-en-how-to-play", locale: "en", width: 1920, height: 1080 },
  {
    name: "390x844-vi-how-to-play-text-125",
    locale: "vi",
    width: 390,
    height: 844,
    textScale: 1.25,
  },
];

async function inspectLayout(page: Page, label: string, height: number) {
  const result = await page.evaluate(() => {
    const button = document.querySelector<HTMLElement>(
      '[data-testid="instructions-continue"]',
    );
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      buttonExists: Boolean(button),
    };
  });

  if (result.scrollWidth > result.clientWidth) {
    throw new Error(`${label} has horizontal overflow.`);
  }

  if (!result.buttonExists) {
    throw new Error(`${label} has no reachable Ready action.`);
  }

  if (result.scrollHeight > height * 2.25) {
    throw new Error(`${label} requires excessive vertical scrolling.`);
  }
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();

  try {
    for (const capture of captures) {
      const context = await browser.newContext({
        viewport: { width: capture.width, height: capture.height },
        reducedMotion: capture.name.includes("text-125") ? "reduce" : "no-preference",
      });

      await context.addInitScript(
        ({ key, locale }) => {
          window.sessionStorage.setItem(
            key,
            JSON.stringify({
              step: "howToPlay",
              selectedLanguage: locale,
              playerName: locale === "vi" ? "Khách mời thân thương" : "Birthday Guest",
              guestSessionId: null,
              joinCode: null,
              avatar: { type: "preset", presetId: "birthday-bear" },
            }),
          );
        },
        { key: sessionKey, locale: capture.locale },
      );

      const page = await context.newPage();
      await page.goto(`${baseUrl}/${capture.locale}`, { waitUntil: "networkidle" });
      await page.getByTestId("onboarding-instructions").waitFor();

      if (capture.textScale) {
        await page.addStyleTag({
          content: `html { font-size: ${capture.textScale * 100}% !important; }`,
        });
      }

      await page.waitForTimeout(450);
      await inspectLayout(page, capture.name, capture.height);
      await page.getByTestId("instructions-continue").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: path.join(outputDir, `${capture.name}.png`),
        fullPage: true,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`Production-polish screenshots saved to ${outputDir}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
