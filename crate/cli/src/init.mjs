// crate init: detect, show a plan, ask, apply, report.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { detect, STACKS } from "./detect.mjs";
import { planTheme } from "./theme.mjs";
import { addProvider, providerSnippet } from "./provider.mjs";
import wiring from "./wiring.json" with { type: "json" };

export const DEFAULT_REGISTRY = "https://crate.onerollstudios.com";

function defaultRun(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) throw new Error(`${[command, ...args].join(" ")} failed`);
}

async function defaultAsk(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return /^y(es)?$/i.test((await rl.question(question)).trim());
  } finally {
    rl.close();
  }
}

function gitDirty(cwd) {
  const result = spawnSync("git", ["status", "--porcelain"], { cwd, encoding: "utf8" });
  return result.status === 0 && result.stdout.trim() !== "";
}

export async function init({ cwd, yes = false, dryRun = false, registry = DEFAULT_REGISTRY, log = console.log, ask = defaultAsk, run = defaultRun }) {
  const app = detect(cwd);
  if (!app.react) throw new Error("This app doesn't use React. Crate's components are React components.");
  if (!app.tailwind) throw new Error("This app doesn't use Tailwind CSS, which Crate's components need. Set up Tailwind and shadcn first.");

  const kind = app.framework.name;
  const locale = app.language && !/^en\b/i.test(app.language) ? app.language : null;
  const importPath = `${app.shadcn?.componentsAlias ?? "@/components"}/agent-wait-states/crate-provider`;
  const items = ["all", ...(app.adapter ? [app.adapter] : [])];
  const addArgs = ["--yes", "shadcn@latest", "add", ...items.map((item) => `${registry}/r/${item}.json`), "--yes", "--overwrite"];

  // ---------- Plan ----------
  log("Crate init\n");
  log("Detected:");
  log(`  Framework:  ${app.framework.label}`);
  log(`  shadcn:     ${app.shadcn ? `set up (CSS: ${app.shadcn.cssFile})` : "not set up"}`);
  log(`  AI stack:   ${STACKS[app.stack].label}`);
  log(`  Language:   ${app.language ?? "not set"}${locale ? ` (CrateProvider locale="${locale}")` : ""}`);

  const providerFile = app.framework.rootFile;
  const providerSupported = providerFile && (kind === "next-app" || kind === "vite");
  const providerPlan = providerSupported ? addProvider(readFileSync(join(cwd, providerFile), "utf8"), { file: providerFile, kind, importPath, locale }) : null;
  const themeNow = app.shadcn?.cssFile && existsSync(join(cwd, app.shadcn.cssFile)) ? planTheme(readFileSync(join(cwd, app.shadcn.cssFile), "utf8")) : null;

  log("\nPlan:");
  let step = 1;
  if (!app.shadcn) log(`  ${step++}. Run: npx shadcn@latest init --defaults (shadcn isn't set up, and Crate installs through it)`);
  log(`  ${step++}. Run: npx ${addArgs.join(" ")}`);
  if (!app.shadcn) log(`  ${step++}. Check the theme in the CSS file shadcn creates, and add any variable Crate needs that is missing`);
  else if (themeNow?.block) log(`  ${step++}. Add ${themeNow.missing.length} missing theme variables to ${app.shadcn.cssFile}, in one marked block (existing variables stay as they are)`);
  else log(`  ${step++}. Theme: no change (${app.shadcn.cssFile} defines every variable Crate reads)`);
  if (providerPlan?.code) log(`  ${step++}. Wrap the app in CrateProvider in ${providerFile}`);
  else if (providerPlan?.reason === "already uses CrateProvider") log(`  ${step++}. CrateProvider: no change (${providerFile} already uses it)`);
  else if (providerPlan) log(`  ${step++}. CrateProvider: ${providerFile} isn't in a shape crate init can edit safely, so it stays as it is; the lines to add are printed at the end`);
  else log(`  ${step++}. CrateProvider: not added automatically for ${providerFile ?? "this app"}; the lines to add are printed at the end`);

  if (gitDirty(cwd)) log("\nNote: this folder has uncommitted git changes. Commit or stash them first if you want an easy undo.");
  if (dryRun) {
    log("\nDry run: nothing was changed.");
    return { app, changed: [] };
  }
  if (!yes && !(await ask("\nContinue? (y/N) "))) {
    log("Stopped. Nothing was changed.");
    return { app, changed: [] };
  }

  // ---------- Apply ----------
  const changed = [];
  if (!app.shadcn) {
    run("npx", ["--yes", "shadcn@latest", "init", "--defaults", "--yes"], cwd);
    changed.push("components.json and the app's CSS (shadcn init)");
  }
  run("npx", addArgs, cwd);
  changed.push(`Installed ${items.join(", ")} (components in ${app.shadcn?.componentsAlias ?? "@/components"}/agent-wait-states)`);

  const after = detect(cwd);
  const cssFile = after.shadcn?.cssFile;
  let themeNotes = [];
  if (cssFile && existsSync(join(cwd, cssFile))) {
    const css = readFileSync(join(cwd, cssFile), "utf8");
    const theme = planTheme(css);
    if (theme.block) {
      // Match the file's line endings (CRLF on many Windows checkouts).
      const eol = css.includes("\r\n") ? "\r\n" : "\n";
      writeFileSync(join(cwd, cssFile), css.replace(/\s*$/, eol) + theme.block.replace(/\n/g, eol));
      changed.push(`${cssFile}: added ${theme.missing.length} missing theme variables`);
      themeNotes = theme.notes;
    }
  }

  let printProvider = !providerPlan?.code && !(providerPlan?.reason === "already uses CrateProvider");
  if (providerPlan?.code) {
    // Re-read: shadcn may have touched the file since the plan was made.
    const fresh = addProvider(readFileSync(join(cwd, providerFile), "utf8"), { file: providerFile, kind, importPath, locale });
    if (fresh.code) {
      writeFileSync(join(cwd, providerFile), fresh.code);
      changed.push(`${providerFile}: wrapped the app in CrateProvider`);
    } else printProvider = fresh.reason !== "already uses CrateProvider";
  }

  // ---------- Report ----------
  log("\nDone. Changed:");
  for (const line of changed) log(`  - ${line}`);
  if (themeNotes.length) {
    log("\nTheme variables added (check these match your design):");
    for (const note of themeNotes) log(`  - ${note}`);
  }
  if (printProvider) {
    log("\nAdd CrateProvider yourself:\n");
    log(providerSnippet({ kind, importPath, locale }));
  }
  log(`\nNext: connect the components to your ${STACKS[app.stack].label === STACKS.sse.label ? "server's event stream" : `${STACKS[app.stack].label} stream`}:\n`);
  log(wiring[app.stack]);
  log(`\nEvery component and prop: ${registry}/llms.txt`);
  return { app, changed };
}
