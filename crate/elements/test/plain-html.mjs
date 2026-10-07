// Drives test/plain.html (no framework, no build step) in Chromium: every
// element renders, follows the host theme or falls back to shadcn's defaults,
// fires its events out of the shadow root, can be restyled with ::part(),
// reads labels from <crate-provider>, and keeps the React rules (reduced
// motion, keyboard focus, aria-live). Run after npm run build.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript" };
const server = createServer(async (request, response) => {
  const path = normalize(join(root, decodeURIComponent(new URL(request.url, "http://x").pathname)));
  if (!path.startsWith(root)) return response.writeHead(403).end();
  const body = await readFile(path).catch(() => null);
  if (!body) return response.writeHead(404).end();
  response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" }).end(body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const url = `http://127.0.0.1:${server.address().port}/test/plain.html`;

const results = [];
const check = (ok, message) => {
  if (!ok) throw new Error(message);
  results.push(`PASS ${message}`);
};
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.waitForFunction(() => window.ready);
  const shadow = (id, fn, arg) => page.evaluate(([id, fn, arg]) => new Function("root", "arg", `return (${fn})(root, arg)`)(document.getElementById(id).shadowRoot, arg), [id, fn.toString(), arg]);
  const text = (id) => shadow(id, (root) => root.textContent.replace(/@media[\s\S]*$/, "").trim());

  // Every element is defined and renders.
  const tags = await page.evaluate(() => [...document.querySelectorAll("*")].filter((el) => el.localName.startsWith("crate-") && el.localName !== "crate-provider").map((el) => [el.localName, customElements.get(el.localName) !== undefined, (el.shadowRoot?.textContent ?? "").trim().length]));
  check(tags.length === 16 && tags.every(([, defined, length]) => defined && length > 0), `all ${new Set(tags.map(([tag]) => tag)).size} element types render`);
  check((await text("tool")) === "Running searchDocs…", "attributes become props (tool-name)");
  check((await text("sources")).includes("Crate docs") && (await text("plan")).includes("Draft the answer"), "data props are JS properties (sources, steps)");
  check((await text("approval")).includes("Send this email?"), "title is a property, not the tooltip attribute");

  // Theme: host variables, or shadcn's defaults when there are none.
  const accent = (id) => shadow(id, (root) => getComputedStyle(root.querySelector(".text-primary")).color);
  const radius = (id) => shadow(id, (root) => getComputedStyle(root.querySelector("[part=container]")).borderRadius);
  check((await accent("tool")) === "rgb(200, 0, 0)" && (await radius("tool")) === "8px", "follows the host's --primary and --radius");
  check((await accent("bare-tool")) === "oklch(0.205 0 0)" && (await radius("bare-tool")) === "6px", "falls back to shadcn's default theme");

  // ::part()
  check((await shadow("error", (root) => getComputedStyle(root.querySelector("button")).outlineColor)) === "rgb(1, 2, 3)", "::part(button) restyles the button");
  const parts = await shadow("error", (root) => [...root.querySelectorAll("[part]")].map((el) => el.getAttribute("part")));
  check(parts.includes("container") && parts.includes("button") && parts.includes("icon"), "exposes container, button, and icon parts");

  // Events bubble and cross the shadow boundary, from real clicks.
  const clickIn = (id, name) => page.locator(`#${id}`).getByRole("button", { name }).click();
  await clickIn("error", "Retry");
  await clickIn("thinking-long", "Cancel");
  await clickIn("approval", "Allow");
  await clickIn("approval", "Deny");
  const events = await page.evaluate(() => window.events);
  const expected = [["crate-retry", "error"], ["crate-cancel", "thinking-long"], ["crate-approve", "approval"], ["crate-deny", "approval"]];
  check(expected.every(([type, target]) => events.some((e) => e.type === type && e.target === target && e.bubbles && e.composed)), "crate-retry, crate-cancel, crate-approve, crate-deny bubble and are composed");

  // <crate-provider>
  check((await text("localized")) === "Réflexion…", "<crate-provider> labels apply");
  await page.evaluate(() => { document.getElementById("provider").labels = { thinking: "En cours…" }; });
  check((await text("localized")) === "En cours…", "changing the provider's labels re-renders");

  // AgentState: attribute, snapshot property, and the minimum display hold.
  await page.evaluate(() => { const el = document.getElementById("agent"); el.setAttribute("tool-name", "searchDocs"); el.setAttribute("status", "tool"); });
  check((await text("agent")) === "Running searchDocs…", "agent-state follows the status attribute");
  await page.evaluate(() => { const el = document.getElementById("agent"); el.text = "Here it is"; el.status = { state: "streaming", sources: [], elapsedMs: 0, showCancel: false, label: "" }; });
  const held = await text("agent");
  check(held === "Used searchDocs", `a quick tool call is held as finished (Used searchDocs)${held === "Used searchDocs" ? "" : `, saw "${held}"`}`);
  await page.waitForFunction(() => document.getElementById("agent").shadowRoot.textContent.includes("Here it is"), null, { timeout: 2000 });
  check(true, "then the snapshot's streaming state shows");

  // Accessibility rules.
  check((await shadow("thinking", (root) => root.querySelectorAll("[aria-live]").length)) > 0, "aria-live inside the shadow root");
  await page.locator("#error").getByRole("button", { name: "Retry" }).focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const focus = await shadow("error", (root) => { const el = root.activeElement; return el ? [el.tagName, getComputedStyle(el).outlineStyle] : null; });
  check(focus && focus[0] === "BUTTON" && focus[1] !== "none", "keyboard focus is visible on buttons");
  const motion = await context.newPage();
  await motion.emulateMedia({ reducedMotion: "reduce" });
  await motion.goto(url);
  await motion.waitForFunction(() => window.ready);
  const spin = await motion.evaluate(() => getComputedStyle(document.getElementById("tool").shadowRoot.querySelector("svg.lucide-loader-circle, svg[class*=animate]")).animationName);
  check(spin === "none", "no spinner animation with prefers-reduced-motion");

  check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  console.log(results.join("\n"));
} catch (error) {
  console.log(results.join("\n"));
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
