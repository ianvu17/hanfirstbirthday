import { chromium, type Browser, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Locale } from "@/lib/i18n/routing";

const baseUrl = process.env.MILESTONE35_BASE_URL ?? "http://localhost:3000";
const outputDir = path.join(".next", "milestone-3-5-screenshots");
const sessionKey = "han-first-birthday:onboarding:v1";

const guestNames: Record<Locale, string> = {
  en: "Birthday Guest",
  vi: "Khách mời thân thương"
};

type OnboardingStep = "welcome" | "language" | "name" | "howToPlay" | "ready";

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
    name: "03-name-empty",
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
    afterScreenshot: async () => undefined
  }
] as const;

const responsiveStates: Array<{
  name: string;
  locale: Locale;
  step: OnboardingStep;
  width: number;
  height: number;
  focusName?: boolean;
}> = [
  { name: "small-phone-welcome", locale: "en", step: "welcome", width: 320, height: 568 },
  {
    name: "small-phone-name-focused",
    locale: "en",
    step: "name",
    width: 320,
    height: 568,
    focusName: true
  },
  { name: "small-phone-instructions", locale: "en", step: "howToPlay", width: 320, height: 568 },
  { name: "desktop-welcome", locale: "en", step: "welcome", width: 1440, height: 1000 },
  { name: "desktop-language", locale: "en", step: "language", width: 1440, height: 1000 },
  { name: "desktop-name", locale: "en", step: "name", width: 1440, height: 1000 },
  { name: "desktop-instructions", locale: "en", step: "howToPlay", width: 1440, height: 1000 },
  { name: "desktop-ready", locale: "en", step: "ready", width: 1440, height: 1000 },
  { name: "tablet-vi-ready", locale: "vi", step: "ready", width: 768, height: 1024 }
];

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

async function capture(page: Page, label: string, filePath: string) {
  await page.waitForTimeout(450);
  await assertNoHorizontalOverflow(page, label);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function captureFlow(browser: Browser, locale: Locale) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/${locale}`, { waitUntil: "networkidle" });

  for (const step of flowSteps) {
    await page.getByTestId(step.testId).waitFor();
    await capture(
      page,
      `${locale}-${step.name}`,
      path.join(outputDir, "mobile", `${locale}-${step.name}.png`)
    );

    if (step.name === "03-name-empty" && locale === "en") {
      await page.getByTestId("guest-name-input").focus();
      await capture(
        page,
        "en-name-focused",
        path.join(outputDir, "mobile", "en-03b-name-focused.png")
      );
    }

    await step.afterScreenshot(page, locale);
  }

  await context.close();
}

async function captureStoredState(browser: Browser, state: (typeof responsiveStates)[number]) {
  const context = await browser.newContext({
    viewport: { width: state.width, height: state.height }
  });

  await context.addInitScript(
    ({ storedSessionKey, step, selectedLanguage, playerName }) => {
      window.sessionStorage.setItem(
        storedSessionKey,
        JSON.stringify({
          step,
          selectedLanguage,
          playerName
        })
      );
    },
    {
      storedSessionKey: sessionKey,
      step: state.step,
      selectedLanguage: state.locale,
      playerName: guestNames[state.locale]
    }
  );

  const page = await context.newPage();
  await page.goto(`${baseUrl}/${state.locale}`, { waitUntil: "networkidle" });

  if (state.focusName) {
    await page.getByTestId("guest-name-input").focus();
  }

  await page.getByTestId(`onboarding-${state.step === "howToPlay" ? "instructions" : state.step}`).waitFor();
  await capture(
    page,
    state.name,
    path.join(outputDir, "responsive", `${state.name}.png`)
  );

  await context.close();
}

async function captureReducedMotion(browser: Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce"
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/vi`, { waitUntil: "networkidle" });
  await page.getByTestId("onboarding-welcome").waitFor();
  await capture(
    page,
    "vi-reduced-motion-welcome",
    path.join(outputDir, "accessibility", "vi-reduced-motion-welcome.png")
  );
  await context.close();
}

async function main() {
  await mkdir(path.join(outputDir, "mobile"), { recursive: true });
  await mkdir(path.join(outputDir, "responsive"), { recursive: true });
  await mkdir(path.join(outputDir, "accessibility"), { recursive: true });

  const browser = await chromium.launch();

  try {
    await captureFlow(browser, "en");
    await captureFlow(browser, "vi");

    for (const state of responsiveStates) {
      await captureStoredState(browser, state);
    }

    await captureReducedMotion(browser);
  } finally {
    await browser.close();
  }

  console.log(`Milestone 3.5 browser screenshots saved to ${outputDir}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
