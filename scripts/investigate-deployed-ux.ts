import { chromium, devices, webkit, type Browser, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type ViewportProfile = {
  name: string;
  width: number;
  height: number;
  language: "en" | "vi";
  emulateReducedVisualHeight?: boolean;
  textScale?: number;
};

const productionUrl = "https://hanfirstbirthday.vercel.app";
const previewUrl = "https://hanfirstbirthday-5yl9hh1e3-ianalysed.vercel.app";
const evidenceDir =
  process.env.DEPLOYED_UX_EVIDENCE_DIR ??
  "docs/evidence/deployed-ux-investigation-20260713";

const profiles: ViewportProfile[] = [
  { name: "320x568-en", width: 320, height: 568, language: "en" },
  { name: "320x667-en", width: 320, height: 667, language: "en" },
  { name: "360x640-en", width: 360, height: 640, language: "en" },
  { name: "360x740-en", width: 360, height: 740, language: "en" },
  { name: "375x667-en", width: 375, height: 667, language: "en" },
  { name: "390x640-vi", width: 390, height: 640, language: "vi" },
  { name: "390x844-en", width: 390, height: 844, language: "en" },
  { name: "393x852-vi", width: 393, height: 852, language: "vi" },
  { name: "412x732-en", width: 412, height: 732, language: "en" },
  { name: "412x915-vi", width: 412, height: 915, language: "vi" },
  {
    name: "360x560-effective-browser-ui-en",
    width: 360,
    height: 560,
    language: "en",
    emulateReducedVisualHeight: true
  },
  {
    name: "390x640-text-scale-125-vi",
    width: 390,
    height: 640,
    language: "vi",
    textScale: 1.25
  }
];

const statusLabels = [
  "Live",
  "Reconnecting",
  "Offline",
  "Resyncing",
  "Needs attention",
  "Đang trực tuyến",
  "Đang kết nối lại",
  "Mất kết nối",
  "Đang đồng bộ lại",
  "Cần kiểm tra"
];

function safeName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function run(cmd: string, args: string[]) {
  try {
    return execFileSync(cmd, args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

async function addDiagnostics(page: Page) {
  await page.addInitScript({
    content: `
    (() => {
    const labels = ${JSON.stringify(statusLabels)};
    const trace = [];
    const scrub = (value) =>
      String(value).replace(/apikey=[^&]+/g, "apikey=[redacted]");
    const push = (type, detail = {}) => {
      trace.push({
        type,
        detail,
        at: new Date().toISOString(),
        performanceMs: Math.round(performance.now())
      });
    };

    Object.defineProperty(window, "__deployedUxTrace", {
      value: trace,
      configurable: true
    });

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const input = args[0];
      const url =
        typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      const started = performance.now();
      push("fetch:start", { url: scrub(url) });
      try {
        const response = await originalFetch(...args);
        push("fetch:end", {
          url: scrub(url),
          status: response.status,
          ok: response.ok,
          durationMs: Math.round(performance.now() - started)
        });
        return response;
      } catch (error) {
        push("fetch:error", {
          url: scrub(url),
          durationMs: Math.round(performance.now() - started),
          message: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    };

    const OriginalWebSocket = window.WebSocket;
    window.WebSocket = class DiagnosticWebSocket extends OriginalWebSocket {
      constructor(url, protocols) {
        super(url, protocols);
        push("websocket:create", { url: scrub(url) });
        this.addEventListener("open", () => push("websocket:open", { url: scrub(url) }));
        this.addEventListener("close", (event) =>
          push("websocket:close", {
            url: scrub(url),
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          })
        );
        this.addEventListener("error", () => push("websocket:error", { url: scrub(url) }));
      }
    };

    window.addEventListener("online", () => push("browser:online"));
    window.addEventListener("offline", () => push("browser:offline"));
    document.addEventListener("visibilitychange", () =>
      push("document:visibility", { visibilityState: document.visibilityState })
    );

    let lastStatus = "";
    const scanStatus = () => {
      const bodyText = document.body?.innerText ?? "";
      const found = labels.find((label) => {
        const escaped = label.replace(/[.*+?^$(){}|[\\]\\\\]/g, "\\\\$&");
        return new RegExp("(^|\\\\n|\\\\s)" + escaped + "(\\\\s|\\\\n|$)").test(bodyText);
      });
      if (found && found !== lastStatus) {
        lastStatus = found;
        push("visible-status", { label: found, online: navigator.onLine });
      }
    };

    new MutationObserver(scanStatus).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    window.setInterval(scanStatus, 250);
    window.addEventListener("load", scanStatus);
    })();
    `
  });

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      // Playwright-side console capture is saved from the page context trace; this keeps stderr clean.
    }
  });
}

async function getTrace(page: Page) {
  return page.evaluate("window.__deployedUxTrace || []");
}

async function collectMetrics(page: Page, label: string) {
  return page.evaluate(`
  (() => {
    const stateLabel = ${JSON.stringify(label)};
    const vv = window.visualViewport;
    const doc = document.documentElement;
    const body = document.body;
    const viewportHeight = vv?.height ?? window.innerHeight;
    const all = Array.from(document.querySelectorAll("body *"));
    const rectFor = (name, selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        name,
        selector,
        text: element.innerText?.slice(0, 180) ?? "",
        rect: {
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        position: style.position,
        display: style.display,
        minHeight: style.minHeight,
        height: style.height,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        overflowY: style.overflowY
      };
    };
    const extending = all
      .map((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom <= viewportHeight && rect.top >= 0) {
          return null;
        }
        const style = window.getComputedStyle(element);
        const text = element.innerText?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "";
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 160) : "",
          text,
          rect: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height)
          },
          position: style.position,
          minHeight: style.minHeight,
          height: style.height,
          overflowY: style.overflowY
        };
      })
      .filter(Boolean)
      .slice(0, 80);

    const sizedElements = all
      .map((element) => {
        const style = window.getComputedStyle(element);
        const interesting =
          ["fixed", "sticky", "absolute"].includes(style.position) ||
          style.minHeight.includes("vh") ||
          style.minHeight.includes("dvh") ||
          style.height.includes("vh") ||
          style.height.includes("dvh");
        if (!interesting) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className.slice(0, 160) : "",
          text: element.innerText?.replace(/\s+/g, " ").trim().slice(0, 120) ?? "",
          rect: {
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            height: Math.round(rect.height)
          },
          position: style.position,
          minHeight: style.minHeight,
          height: style.height,
          paddingTop: style.paddingTop,
          paddingBottom: style.paddingBottom
        };
      })
      .filter(Boolean);

    return {
      label: stateLabel,
      url: location.href,
      viewport: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        visualWidth: vv?.width ?? null,
        visualHeight: vv?.height ?? null,
        visualOffsetTop: vv?.offsetTop ?? null,
        devicePixelRatio: window.devicePixelRatio
      },
      document: {
        scrollHeight: doc.scrollHeight,
        clientHeight: doc.clientHeight,
        bodyScrollHeight: body.scrollHeight,
        bodyClientHeight: body.clientHeight,
        bodyOffsetHeight: body.offsetHeight,
        scrollY: window.scrollY,
        overflowPixels: Math.max(0, doc.scrollHeight - doc.clientHeight),
        hasPageVerticalScroll: doc.scrollHeight > doc.clientHeight
      },
      rects: {
        pageShell: rectFor("page-shell", "main"),
        controller: rectFor("guest-controller", "[data-testid='guest-controller']"),
        topHeader: rectFor("top-header", "[data-testid='guest-controller'] > div > div > div:first-child"),
        questionText: rectFor("question-text", "[data-testid='guest-controller'] h1"),
        timer: rectFor("timer", "[data-testid='guest-controller'] div:has(svg)"),
        answerList: rectFor("answer-list", "[role='radiogroup']"),
        submitButton: rectFor("submit-button", "[data-testid='guest-submit-answer']"),
        connectionBadge: rectFor("connection-badge", "[data-testid='guest-controller'] span[aria-label], main span[aria-label]"),
        bottomStatus: rectFor("bottom-status", "[aria-live='polite']")
      },
      extending,
      sizedElements
    };
  })()
  `);
}

async function onboardingJourney(page: Page, baseUrl: string, profile: ViewportProfile) {
  await page.goto(`${baseUrl}/${profile.language}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /let's go|bắt đầu/i }).click();
  if (profile.language === "en") {
    await page.getByRole("button", { name: /english/i }).click();
  } else {
    await page.getByRole("button", { name: /tiếng việt|vietnamese/i }).click();
  }
  await page.locator("input").fill(`Codex ${profile.name}`.slice(0, 38));
  await page.getByRole("button", { name: /continue|tiếp tục/i }).click();
  await page.getByRole("button", { name: /i'm ready|sẵn sàng|ready/i }).click();
  await page.getByRole("button", { name: /start quiz|bắt đầu/i }).click();
  await page.waitForURL(new RegExp(`/${profile.language}/play`), { timeout: 10000 });
  await page.waitForLoadState("networkidle");
}

async function runProfile(browser: Browser, baseUrl: string, profile: ViewportProfile, browserName: string) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: profile.language === "vi" ? "vi-VN" : "en-US"
  });
  const page = await context.newPage();
  await addDiagnostics(page);

  if (profile.textScale) {
    await page.addStyleTag({
      content: `html { font-size: ${profile.textScale * 100}% !important; }`
    }).catch(() => undefined);
  }

  const resultBase = `${browserName}-${safeName(profile.name)}`;
  const result: Record<string, unknown> = {
    profile,
    browserName,
    baseUrl,
    startedAt: new Date().toISOString(),
    states: []
  };

  try {
    await onboardingJourney(page, baseUrl, profile);
    if (profile.textScale) {
      await page.addStyleTag({
        content: `html { font-size: ${profile.textScale * 100}% !important; }`
      });
    }
    await page.waitForSelector("[data-testid='guest-controller']", { timeout: 12000 });
    await page.waitForTimeout(3000);
    const before = await collectMetrics(page, "question-preview-before-scroll");
    await page.screenshot({
      path: join(evidenceDir, "screenshots", `${resultBase}-question-preview-before-scroll.png`),
      fullPage: true
    });

    await page.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)");
    await page.waitForTimeout(500);
    const after = await collectMetrics(page, "question-preview-after-scroll");
    await page.screenshot({
      path: join(evidenceDir, "screenshots", `${resultBase}-question-preview-after-scroll.png`),
      fullPage: true
    });

    (result.states as unknown[]).push(before, after);
    result.trace = await getTrace(page);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.trace = await getTrace(page).catch(() => []);
    await page.screenshot({
      path: join(evidenceDir, "screenshots", `${resultBase}-error.png`),
      fullPage: true
    }).catch(() => undefined);
  } finally {
    result.finishedAt = new Date().toISOString();
    await context.close();
  }

  writeFileSync(
    join(evidenceDir, "measurements", `${resultBase}.json`),
    JSON.stringify(result, null, 2)
  );
  return result;
}

async function runDevice(name: "iPhone 12" | "Pixel 5", baseUrl: string, language: "en" | "vi") {
  const device = devices[name];
  let browser: Browser;
  try {
    browser = name === "iPhone 12" ? await webkit.launch() : await chromium.launch();
  } catch (error) {
    const result = {
      device: name,
      language,
      baseUrl,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      skipped: true,
      reason: error instanceof Error ? error.message : String(error)
    };
    writeFileSync(
      join(evidenceDir, "measurements", `${safeName(name)}-${language}.json`),
      JSON.stringify(result, null, 2)
    );
    return result;
  }
  const context = await browser.newContext({
    ...device,
    locale: language === "vi" ? "vi-VN" : "en-US"
  });
  const page = await context.newPage();
  await addDiagnostics(page);
  const resultBase = `${safeName(name)}-${language}`;
  const result: Record<string, unknown> = {
    device: name,
    language,
    baseUrl,
    startedAt: new Date().toISOString(),
    states: []
  };

  try {
    await onboardingJourney(page, baseUrl, { name: resultBase, width: device.viewport.width, height: device.viewport.height, language });
    await page.waitForSelector("[data-testid='guest-controller']", { timeout: 12000 });
    await page.waitForTimeout(3000);
    const before = await collectMetrics(page, "device-question-preview");
    await page.screenshot({
      path: join(evidenceDir, "screenshots", `${resultBase}-question-preview.png`),
      fullPage: true
    });
    (result.states as unknown[]).push(before);
    result.trace = await getTrace(page);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    result.trace = await getTrace(page).catch(() => []);
  } finally {
    result.finishedAt = new Date().toISOString();
    await context.close();
    await browser.close();
  }

  writeFileSync(
    join(evidenceDir, "measurements", `${resultBase}.json`),
    JSON.stringify(result, null, 2)
  );
  return result;
}

async function compareEnvironment(baseUrl: string, label: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  await addDiagnostics(page);
  const result: Record<string, unknown> = { label, baseUrl, startedAt: new Date().toISOString() };

  try {
    await page.goto(`${baseUrl}/api/party/session`);
    result.sessionText = await page.locator("body").innerText();
    await page.goto(`${baseUrl}/en?join=han-turns-one`, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    result.metrics = await collectMetrics(page, `${label}-qr-welcome`);
    result.trace = await getTrace(page);
    await page.screenshot({
      path: join(evidenceDir, "screenshots", `${label}-qr-welcome.png`),
      fullPage: true
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    result.finishedAt = new Date().toISOString();
    await context.close();
    await browser.close();
  }

  writeFileSync(
    join(evidenceDir, "measurements", `${label}-environment.json`),
    JSON.stringify(result, null, 2)
  );
  return result;
}

async function main() {
  mkdirSync(join(evidenceDir, "screenshots"), { recursive: true });
  mkdirSync(join(evidenceDir, "measurements"), { recursive: true });
  mkdirSync(join(evidenceDir, "logs"), { recursive: true });

  const metadata = {
    createdAt: new Date().toISOString(),
    productionUrl,
    previewUrl,
    git: {
      head: run("git", ["rev-parse", "HEAD"]).trim(),
      branch: run("git", ["branch", "--show-current"]).trim(),
      latestCommit: run("git", ["log", "-1", "--format=%H%n%ci%n%s"]).trim(),
      remoteHeads: run("git", ["ls-remote", "--heads", "origin", "main", "codex/party-flow-realtime-mobile"]).trim()
    },
    vercel: {
      productionInspect: run("npx", [
        "vercel",
        "inspect",
        "https://hanfirstbirthday.vercel.app",
        "--scope",
        "ianalysed",
        "--format=json"
      ]),
      previewInspect: run("npx", [
        "vercel",
        "inspect",
        previewUrl,
        "--scope",
        "ianalysed",
        "--format=json"
      ])
    },
    hostAccessEnvPresent: {
      LIVE_REALTIME_HOST_PIN: Boolean(process.env.LIVE_REALTIME_HOST_PIN),
      HOST_PIN: Boolean(process.env.HOST_PIN)
    }
  };
  writeFileSync(join(evidenceDir, "deployment-metadata.json"), JSON.stringify(metadata, null, 2));

  const browser = await chromium.launch();
  const results = [];
  for (const profile of profiles) {
    results.push(await runProfile(browser, productionUrl, profile, "chromium"));
  }
  await browser.close();

  results.push(await runDevice("iPhone 12", productionUrl, "en"));
  results.push(await runDevice("Pixel 5", productionUrl, "vi"));
  results.push(await compareEnvironment(productionUrl, "production"));
  results.push(await compareEnvironment(previewUrl, "preview"));

  writeFileSync(join(evidenceDir, "results.json"), JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
