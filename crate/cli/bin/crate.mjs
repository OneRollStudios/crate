#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_REGISTRY, init } from "../src/init.mjs";

const help = `Usage: crate init [options]

Detects your app's framework, shadcn theme, AI stack, and language, shows a
plan, and after you confirm: installs Crate and the adapter for your stack,
adds any theme variables Crate needs that are missing, and wraps your app in
CrateProvider.

Options:
  -y, --yes         Apply the plan without asking (for agents and CI)
      --dry-run     Show the plan and change nothing
      --cwd <dir>   The app's folder (default: the current folder)
      --registry <url>  Where to install Crate from (default: ${DEFAULT_REGISTRY})
  -h, --help        Show this help
  -v, --version     Show the version`;

const args = process.argv.slice(2);
const flag = (...names) => names.some((name) => args.includes(name));
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

if (flag("-v", "--version")) {
  console.log(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
} else if (flag("-h", "--help") || args[0] !== "init") {
  console.log(help);
  if (args[0] !== "init" && !flag("-h", "--help")) process.exitCode = 1;
} else {
  try {
    await init({
      cwd: resolve(value("--cwd") ?? "."),
      yes: flag("-y", "--yes"),
      dryRun: flag("--dry-run"),
      registry: (value("--registry") ?? DEFAULT_REGISTRY).replace(/\/$/, ""),
    });
  } catch (error) {
    console.error(`crate init: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
