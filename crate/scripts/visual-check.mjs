import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { chromium } from "playwright";

const studioURL = "https://onerollstudios.com/";
const screenshotDir = "design/screenshots";
const results = [];
const localChrome = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);

function getFreePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 4173;
      probe.close(() => resolve(port));
    });
  });
}

function startStaticServer(port) {
  const child = spawn(process.execPath, ["scripts/serve-out.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stdout.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));
  return child;
}

async function waitForServer(child, url) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Static server exited with code ${child.exitCode}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The child may still be binding the port.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Static server did not become ready at ${url}`);
}

async function stopStaticServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function checkLayout(page, label) {
  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    const overflowing = [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (element.closest(".corner-circuit") || element.closest(".hero-circuit")) return false;
        const rect = element.getBoundingClientRect();
        return rect.right > root.clientWidth + 1 || rect.left < -1;
      })
      .slice(0, 10)
      .map((element) => { const rect = element.getBoundingClientRect(); return element.tagName.toLowerCase() + "." + element.className + " [" + rect.left + "," + rect.right + "] in " + (element.parentElement?.className ?? ""); });
    const clippedText = [...document.querySelectorAll("h1,h2,h3,p,a,button,code")]
      .filter((element) => {
        const style = getComputedStyle(element);
        const clips = ["hidden", "clip"].includes(style.overflowY) || ["hidden", "clip"].includes(style.overflowX);
        if (element.closest(".command-box") || element.closest(".row-command")) return false;
        return clips && (element.scrollHeight > element.clientHeight + 2 || element.scrollWidth > element.clientWidth + 2);
      })
      .slice(0, 10)
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
    return {
      horizontalScroll: root.scrollWidth > root.clientWidth + 1,
      overflowing,
      clippedText,
    };
  });
  if (layout.horizontalScroll || layout.overflowing.length || layout.clippedText.length) {
    throw new Error(`${label} layout failure: ${JSON.stringify(layout)}`);
  }
  results.push(`PASS ${label}: no horizontal scroll or clipped text`);
}

async function runViewport(browser, baseURL, name, viewport, colorScheme) {
  console.log(`Checking ${name}-${colorScheme}…`);
  const context = await browser.newContext({
    viewport,
    colorScheme,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(15000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) errors.push(message.text());
    });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${screenshotDir}/${name}-${colorScheme}.png`, fullPage: true });
    await checkLayout(page, `${name}-${colorScheme}`);

    const studioHrefs = await page.locator('footer a[href="https://onerollstudios.com"]').evaluateAll(
      (links) => links.map((link) => link.href),
    );
    if (!studioHrefs.length || studioHrefs.some((href) => href !== studioURL)) {
      throw new Error(name + "-" + colorScheme + " studio URL mismatch: " + JSON.stringify(studioHrefs));
    }
    results.push("PASS " + name + "-" + colorScheme + ": studio URL");

    const command = await page.locator(".hero-install code").innerText();
    await page.locator(".hero-install .copy-button").click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    if (clipboard !== command) throw new Error(`${name}-${colorScheme} copy mismatch`);
    results.push(`PASS ${name}-${colorScheme}: copy button`);

    if (errors.length) throw new Error(`${name}-${colorScheme} browser errors: ${errors.join(" | ")}`);
  } finally {
    await context.close();
  }
}

async function runReducedMotion(browser, baseURL) {
  console.log("Checking reduced motion…");
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((element) => {
          const style = getComputedStyle(element);
          const durations = style.animationDuration.split(",").map((value) => parseFloat(value) || 0);
          const iterations = style.animationIterationCount.split(",");
          return durations.some((duration, index) => duration > 0.01 && iterations[index] !== "1");
        })
        .slice(0, 10)
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
    );
    if (moving.length) throw new Error(`Reduced-motion animations remain: ${moving.join(", ")}`);
    results.push("PASS reduced-motion: animations disabled");
  } finally {
    await context.close();
  }
}

async function captureHeroStates(browser, baseURL) {
  console.log("Capturing every hero card state…");
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    const network = page.locator(".hero-network");
    await network.scrollIntoViewIfNeeded();
    const captured = [];
    for (const phase of [0, 1, 2, 3]) {
      await page.locator('[data-network-phase="' + phase + '"]').waitFor();
      await network.screenshot({ path: screenshotDir + "/hero-state-" + phase + ".png" });
      captured.push(phase);
    }
    if (captured.length !== 4) throw new Error("Hero card sequence missed a state");
    results.push("PASS hero states: thinking, tool call, agent plan, approval");
  } finally {
    await context.close();
  }
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const port = await getFreePort();
  const baseURL = `http://127.0.0.1:${port}`;
  const server = startStaticServer(port);
  let browser;

  try {
    await waitForServer(server, baseURL);
    browser = await chromium.launch({ headless: true, executablePath: localChrome });
    await runViewport(browser, baseURL, "desktop", { width: 1440, height: 900 }, "light");
    await runViewport(browser, baseURL, "desktop", { width: 1440, height: 900 }, "dark");
    await runViewport(browser, baseURL, "mobile", { width: 390, height: 844 }, "light");
    await runViewport(browser, baseURL, "mobile", { width: 390, height: 844 }, "dark");
    await runReducedMotion(browser, baseURL);
    await captureHeroStates(browser, baseURL);
    console.log(results.join("\n"));
  } finally {
    if (browser) await browser.close();
    await stopStaticServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
