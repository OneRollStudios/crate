// Checks the themed consumer app built by scripts/install-test.sh themed:
// every Crate component must take its colors, corner radii, and font from the
// host app's shadcn theme, in light and dark. Saves a screenshot per state.
// Usage: node scripts/theme-check.mjs http://localhost:3000
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.argv[2];
if (!baseURL) {
  console.error("Usage: node scripts/theme-check.mjs <consumer app URL>");
  process.exit(1);
}
const screenshotDir = process.env.SCREENSHOT_DIR ?? "screenshots";
const tokens = ["background", "foreground", "primary", "primary-foreground", "muted", "muted-foreground", "border", "destructive"];

// Runs in the page: reads the host theme, then lists every color, radius, and
// font in each component that does not come from it.
function audit(tokenNames) {
  const probe = document.createElement("div");
  document.body.append(probe);
  const read = (style, property) => {
    probe.setAttribute("style", style);
    return getComputedStyle(probe)[property];
  };
  const colors = new Map(tokenNames.map((name) => [read(`color: var(--${name})`, "color"), name]));
  probe.removeAttribute("style");
  // @theme inline radii exist only as utilities, so probe with the classes.
  const radii = new Set();
  for (const size of ["sm", "md", "lg"]) {
    probe.className = `rounded-${size}`;
    radii.add(getComputedStyle(probe).borderTopLeftRadius);
  }
  radii.delete("0px");
  probe.remove();
  const font = getComputedStyle(document.body).fontFamily;

  const opaque = (value) => !/^rgba\(.*,\s*0\)$/.test(value) && !/\/\s*0(\.0+)?\)$/.test(value) && value !== "transparent";
  const report = {};
  const used = new Set();
  for (const section of document.querySelectorAll("[data-crate-state]")) {
    const problems = [];
    const root = section.querySelector("[data-crate-root]");
    for (const element of [root, ...root.querySelectorAll("*")]) {
      if (element.closest("svg") && element.tagName.toLowerCase() !== "svg") continue;
      const style = getComputedStyle(element);
      const name = element.tagName.toLowerCase() + (element.className && typeof element.className === "string" ? "." + element.className.split(/\s+/).slice(0, 3).join(".") : "");
      const checks = [["color", style.color], ["background", style.backgroundColor]];
      for (const side of ["Top", "Right", "Bottom", "Left"]) {
        if (parseFloat(style[`border${side}Width`]) > 0) checks.push([`border-${side.toLowerCase()}`, style[`border${side}Color`]]);
      }
      for (const [property, value] of checks) {
        if (!opaque(value)) continue;
        // Colors mixed from a token (opacity modifiers) carry an alpha; only
        // solid colors must match a token exactly.
        if (colors.has(value)) used.add(colors.get(value));
        else if (!/\/\s*0?\.\d+\)$|,\s*0?\.\d+\)$/.test(value)) problems.push(`${name} ${property} ${value} is not a theme color`);
      }
      for (const corner of ["TopLeft", "TopRight", "BottomRight", "BottomLeft"]) {
        const value = style[`border${corner}Radius`];
        const px = parseFloat(value);
        if (!px || px > 999 || value.endsWith("%")) continue;
        if (!radii.has(value)) problems.push(`${name} radius ${value} is not a theme radius`);
      }
      if (style.fontFamily !== font) problems.push(`${name} font ${style.fontFamily} is not the host font`);
    }
    report[section.dataset.crateState] = [...new Set(problems)];
  }
  return { report, used: [...used], radii: [...radii], font };
}

async function main() {
  await mkdir(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const results = [];
  let failed = false;
  try {
    // Reduced motion keeps animated states still for the screenshots.
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseURL, { waitUntil: "networkidle" });

    for (const scheme of ["light", "dark"]) {
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), scheme === "dark");
      // Let color transitions (transition-colors) settle before reading colors.
      await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
      const { report, used, radii, font } = await page.evaluate(audit, tokens);
      results.push(`${scheme}: host radii ${radii.join(" ")}; host font ${font}`);
      for (const [state, problems] of Object.entries(report)) {
        if (problems.length) {
          failed = true;
          results.push(`FAIL ${scheme} ${state}:\n  ${problems.join("\n  ")}`);
        } else {
          results.push(`PASS ${scheme} ${state}: theme colors, radii, and font`);
        }
        await page.locator(`[data-crate-state="${state}"]`).screenshot({ path: `${screenshotDir}/themed-${scheme}-${state}.png` });
      }
      // Prove the check saw the theme: the accent color and the borders.
      for (const token of ["primary", "border", "foreground", "muted-foreground"]) {
        if (!used.includes(token)) {
          failed = true;
          results.push(`FAIL ${scheme}: no component used --${token}`);
        }
      }
      await page.screenshot({ path: `${screenshotDir}/themed-${scheme}.png`, fullPage: true });
    }
    if (errors.length) {
      failed = true;
      results.push(`FAIL page errors: ${errors.join(" | ")}`);
    }
  } finally {
    await browser.close();
  }
  console.log(results.join("\n"));
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
