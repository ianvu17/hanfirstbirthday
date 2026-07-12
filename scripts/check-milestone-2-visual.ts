import { chromium, type BrowserContextOptions } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MILESTONE2_BASE_URL ?? "http://localhost:3002";
const outputDir = path.join(".next", "milestone-2-screenshots");

const checks = [
  {
    name: "en-mobile",
    path: "/en",
    selector: "text=WHO IS TURNING ONE?!",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "vi-mobile",
    path: "/vi",
    selector: "text=WHO IS TURNING ONE?!",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "vi-design-mobile-full",
    path: "/vi/design-system",
    selector: "text=Nền tảng hệ thống thiết kế",
    viewport: { width: 390, height: 844 },
    fullPage: true
  },
  {
    name: "en-design-desktop-full",
    path: "/en/design-system",
    selector: "text=Design system foundation",
    viewport: { width: 1440, height: 1100 },
    fullPage: true
  },
  {
    name: "display-1366x768",
    path: "/display/leaderboard",
    selector: "text=Leaderboard display ready",
    viewport: { width: 1366, height: 768 }
  },
  {
    name: "admin-mobile",
    path: "/en/admin",
    selector: "text=Admin utility foundation",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "qa-mobile",
    path: "/vi/qa",
    selector: "text=Nền tảng đường dẫn QA",
    viewport: { width: 390, height: 844 }
  },
  {
    name: "vi-design-reduced-motion",
    path: "/vi/design-system",
    selector: "text=Nền tảng hệ thống thiết kế",
    viewport: { width: 390, height: 844 },
    fullPage: true,
    context: { reducedMotion: "reduce" } satisfies BrowserContextOptions
  }
] as const;

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();

  try {
    for (const check of checks) {
      const context = await browser.newContext({
        viewport: check.viewport,
        ...("context" in check ? check.context : {})
      });
      const page = await context.newPage();

      await page.goto(`${baseUrl}${check.path}`, { waitUntil: "networkidle" });
      await page.locator(check.selector).waitFor();
      await page.waitForTimeout(500);

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth
      );

      if (hasHorizontalOverflow) {
        throw new Error(`${check.name} has horizontal overflow.`);
      }

      await page.screenshot({
        path: path.join(outputDir, `${check.name}.png`),
        fullPage: "fullPage" in check ? check.fullPage : false
      });

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`Milestone 2 browser screenshots saved to ${outputDir}.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
