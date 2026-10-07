// A fresh Vite + Vue app that installs the packed package (as a user would)
// and uses the elements from Vue templates: a reactive status binding, a
// crate-retry listener, and a data prop. Built, served, and checked in
// Chromium. Run after npm run build. Needs network access for npm.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("..", import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "crate-elements-vue-"));
const app = join(temp, "app");
const run = (command, args, cwd) => execFileSync(command, args, { cwd, stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, CI: "1" } });
let preview;
const results = [];
const check = (ok, message) => {
  if (!ok) throw new Error(message);
  results.push(`PASS ${message}`);
};

try {
  const tarball = execFileSync("npm", ["pack", "--pack-destination", temp, "--silent"], { cwd: root, encoding: "utf8" }).trim().split("\n").pop();
  run("npx", ["--yes", "create-vite@latest", "app", "--template", "vue", "--no-interactive"], temp);
  run("npm", ["install", "--no-audit", "--no-fund"], app);
  run("npm", ["install", "--no-audit", "--no-fund", join(temp, tarball)], app);
  writeFileSync(join(app, "vite.config.js"), `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("crate-") } } })],
});
`);
  writeFileSync(join(app, "src/App.vue"), `<script setup>
import "@onerollstudios/crate-elements";
import { ref } from "vue";

const status = ref("thinking");
const retries = ref(0);
const steps = [
  { label: "Read the request", state: "complete" },
  { label: "Draft the answer", state: "active" },
];
</script>

<template>
  <main>
    <button v-for="state in ['tool', 'error', 'done']" :key="state" :id="'set-' + state" @click="status = state">{{ state }}</button>
    <crate-agent-state id="agent" :status="status" tool-name="searchDocs" error-message="The connection dropped." :min-display-ms="0" @crate-retry="retries++"></crate-agent-state>
    <p id="retries">{{ retries }}</p>
    <crate-agent-plan id="plan" :steps.prop="steps"></crate-agent-plan>
  </main>
</template>
`);
  run("npx", ["vite", "build"], app);
  const port = await new Promise((resolve) => { const s = createServer().listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); }); });
  preview = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { cwd: app, stdio: "ignore", detached: true });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await fetch(`http://127.0.0.1:${port}`).then((r) => r.ok, () => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}`);
    const text = (id) => page.evaluate((id) => document.getElementById(id).shadowRoot.textContent.replace(/@media[\s\S]*$/, "").trim(), id);
    await page.waitForFunction(() => document.getElementById("agent")?.shadowRoot?.textContent.includes("Thinking"));
    check(true, "Vue renders <crate-agent-state> with the reactive status (thinking)");
    await page.click("#set-tool");
    await page.waitForFunction(() => document.getElementById("agent").shadowRoot.textContent.includes("Running searchDocs"));
    check(true, "a status change in Vue switches the state (tool)");
    await page.click("#set-error");
    check((await text("agent")).includes("The connection dropped."), "kebab-case attributes from Vue (error-message)");
    await page.locator("#agent").getByRole("button", { name: "Retry" }).click();
    await page.waitForFunction(() => document.getElementById("retries").textContent === "1");
    check(true, "@crate-retry reaches the Vue handler");
    check((await text("plan")).includes("Draft the answer"), "data props with .prop (steps)");
    check(errors.length === 0, `no page errors${errors.length ? `: ${errors.join(" | ")}` : ""}`);
  } finally {
    await browser.close();
  }
  console.log(results.join("\n"));
} catch (error) {
  console.log(results.join("\n"));
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  if (preview) try { process.kill(-preview.pid); } catch {}
  rmSync(temp, { recursive: true, force: true });
}
