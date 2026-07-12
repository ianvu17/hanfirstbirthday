import { chromium, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Locale } from "@/lib/i18n/routing";

const baseUrl = process.env.MILESTONE3_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(".next", "milestone-3-screenshots", "after");

const guestNames: Record<Locale, string> = {
  en: "Birthday Guest",
  vi: "Khách mời thân thương"
};

const flowSteps = [
  {
    name: "01-welcome",
    testId: "onboarding-welcome",
    afterScreenshot: async (page: Page) => {
      await page.getByTestId("welcome-start").click();
    }
  },
  {
    name: "02-language",
    testId: "onboarding-language",
    afterScreenshot: async (page: Page, locale: Locale) => {
      await page.getByTestId(`language-${locale}`).click();
    }
  },
  {
    name: "03-name",
    testId: "onboarding-name",
    afterScreenshot: async (page: Page, locale: Locale) => {
      await page.getByTestId("guest-name-input").fill(guestNames[locale]);
      await page.getByTestId("guest-name-submit").click();
    }
  },
  {
    name: "04-instructions",
    testId: "onboarding-instructions",
    afterScreenshot: async (page: Page) => {
      await page.getByTestId("instructions-continue").click();
    }
  },
  {
    name: "05-ready",
    testId: "onboarding-ready",
    afterScreenshot: async (page: Page) => {
      await page.getByTestId("ready-start-quiz").click();
    }
  },
  {
    name: "06-guest-play-handoff",
    testId: "guest-controller",
    afterScreenshot: async () => undefined
  }
] as const;

const responsiveViewports = [
  { name: "iphone-se", width: 320, height: 568 },
  { name: "modern-iphone", width: 390, height: 844 },
  { name: "pixel", width: 412, height: 915 },
  { name: "ipad", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
  { name: "large-tv", width: 1920, height: 1080 }
] as const;

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

async function captureFlow(locale: Locale) {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }
    });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });

    for (const step of flowSteps) {
      await page.getByTestId(step.testId).waitFor();
      await page.waitForTimeout(350);
      await assertNoHorizontalOverflow(page, `${locale}-${step.name}`);
      await page.screenshot({
        path: path.join(outputDir, `${locale}-${step.name}.png`),
        fullPage: true
      });
      await step.afterScreenshot(page, locale);
    }

    await context.close();
  } finally {
    await browser.close();
  }
}

async function checkResponsiveReady(locale: Locale) {
  const browser = await chromium.launch();

  try {
    for (const viewport of responsiveViewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      await context.addInitScript(
        ({ sessionKey, selectedLanguage, playerName }) => {
          window.sessionStorage.setItem(
            sessionKey,
            JSON.stringify({
              step: "ready",
              selectedLanguage,
              playerName
            })
          );
        },
        {
          sessionKey: "han-first-birthday:onboarding:v1",
          selectedLanguage: locale,
          playerName: guestNames[locale]
        }
      );

      const page = await context.newPage();
      await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });
      await page.getByTestId("onboarding-ready").waitFor();
      await page.waitForTimeout(350);
      await assertNoHorizontalOverflow(page, `${locale}-ready-${viewport.name}`);
      await page.screenshot({
        path: path.join(outputDir, "responsive", `${locale}-ready-${viewport.name}.png`),
        fullPage: true
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

async function checkReducedMotion(locale: Locale) {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce"
    });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });
    await page.getByTestId("onboarding-welcome").waitFor();
    await assertNoHorizontalOverflow(page, `${locale}-reduced-motion`);
    await page.screenshot({
      path: path.join(outputDir, `${locale}-reduced-motion-welcome.png`),
      fullPage: true
    });
    await context.close();
  } finally {
    await browser.close();
  }
}

async function main() {
  await mkdir(path.join(outputDir, "responsive"), { recursive: true });

  await captureFlow("en");
  await captureFlow("vi");
  await checkResponsiveReady("en");
  await checkResponsiveReady("vi");
  await checkReducedMotion("vi");

  console.log(`Milestone 3 browser screenshots saved to ${outputDir}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
