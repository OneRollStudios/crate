// Builds the README's code examples in a real app, so a change in Next.js, the
// AI SDK, or Crate can't silently break them. install-test.sh docs creates a
// fresh create-next-app@latest app, installs Crate, and runs:
//   node scripts/docs-examples.mjs write <app dir>   write the examples as files
//   node scripts/docs-examples.mjs check <app URL>   load the built page in Chromium
// The app's own lint and next build (which prerenders the page) run in between.
// Examples taken verbatim: "Show the Reply Once" (a whole file) and the Stream
// Adapters client (a whole file). Snippets wrapped in a component: "AI SDK usage",
// the Stream Adapters map example, and "Labels and languages". The server routes
// need the frameworks' packages and are covered by the adapter tests instead.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [command, target] = process.argv.slice(2);
if (!["write", "check"].includes(command) || !target) {
  console.error("Usage: node scripts/docs-examples.mjs write <app dir> | check <app URL>");
  process.exit(2);
}

if (command === "check") {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto(target, { waitUntil: "networkidle" });
  const failed = [];
  for (const id of ["ai-sdk-usage", "assistant", "sse-map", "labels"]) {
    if (!(await page.locator(`[data-example="${id}"]`).count())) failed.push(`${id} did not render`);
  }
  // The Labels example shows AgentState thinking, in French.
  if (!(await page.locator('[data-example="labels"]').getByText("Réflexion…").count())) failed.push("labels: no French thinking label");
  await browser.close();
  for (const error of errors) failed.push(`page error: ${error}`);
  if (failed.length) {
    for (const line of failed) console.error(`FAIL ${line}`);
    process.exit(1);
  }
  console.log("PASS docs examples: every example renders, with no page errors");
  process.exit(0);
}

const root = fileURLToPath(new URL("..", import.meta.url));
const readme = readFileSync(`${root}README.md`, "utf8").replace(/\r\n?/g, "\n");

function section(heading) {
  const rest = readme.split(`\n## ${heading}\n`)[1];
  if (rest === undefined) throw new Error(`README.md has no "## ${heading}" section`);
  return rest.split("\n## ")[0];
}
function block(heading, test, label) {
  const found = [...section(heading).matchAll(/```(?:tsx|ts)\n([\s\S]*?)```/g)].map((m) => m[1]).find(test);
  if (!found) throw new Error(`README.md "## ${heading}" has no ${label} example`);
  return found;
}
// Split a snippet into its statements and the JSX after them (from the first
// line that starts with "<").
function split(snippet) {
  const lines = snippet.trimEnd().split("\n");
  const at = lines.findIndex((line) => line.startsWith("<"));
  if (at < 0) throw new Error(`No JSX in example:\n${snippet}`);
  return { code: lines.slice(0, at).join("\n").trim(), jsx: lines.slice(at).join("\n").trim() };
}
const indent = (text, spaces) => text.split("\n").map((line) => (line ? " ".repeat(spaces) + line : line)).join("\n");

const app = target;
const files = {};

// Whole files, verbatim.
files["components/messages.tsx"] = block("Show the Reply Once", (code) => code.includes("export function Messages"), "Messages");
files["components/assistant.tsx"] = block("Stream Adapters", (code) => code.includes("export function Assistant"), "client");

// AI SDK usage: the snippet inside a client component, with the Messages example
// from "Show the Reply Once" that the README points to for streamedText.
const usage = split(block("AI SDK usage", (code) => code.includes("useAgentStatus(chat)"), "useChat"));
files["components/ai-sdk-usage.tsx"] = `"use client";

import { useChat } from "@ai-sdk/react";
import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";
import { Messages } from "@/components/messages";

export function AiSdkUsage() {
  const streamedText: string | undefined = undefined;
${indent(usage.code, 2)}

  return (
    <div data-example="ai-sdk-usage">
${indent(usage.jsx, 6)}
      <Messages chat={chat} />
    </div>
  );
}
`;

// The map example for a server's own server-sent events.
const map = block("Stream Adapters", (code) => code.includes("map:"), "map").trim();
files["components/sse-map.tsx"] = `"use client";

import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";
import { useAgentStream } from "@/hooks/use-agent-stream";

export function SseMap() {
${indent(map, 2)}
  const status = useAgentStatus(stream);

  return (
    <div data-example="sse-map">
      <AgentState status={status} text={stream.text} />
    </div>
  );
}
`;

// Labels and languages: the snippet's file (its directive, imports, and labels),
// with the provider inside a component. The page that renders it is a server
// component, as a Next.js layout is.
const labels = split(block("Labels and languages", (code) => code.includes("<CrateProvider"), "CrateProvider"));
const directive = labels.code.match(/^"use client";\n*/)?.[0] ?? "";
files["components/labels.tsx"] = `${directive}import { AgentState } from "@/components/agent-wait-states/agent-state";
${labels.code.slice(directive.length)}

export function Labels() {
  const status = "thinking";

  return (
    <div data-example="labels">
${indent(labels.jsx, 6)}
    </div>
  );
}
`;

files["app/page.tsx"] = `import { AiSdkUsage } from "@/components/ai-sdk-usage";
import { Assistant } from "@/components/assistant";
import { Labels } from "@/components/labels";
import { SseMap } from "@/components/sse-map";

export default function Page() {
  return (
    <main>
      <AiSdkUsage />
      <div data-example="assistant">
        <Assistant />
      </div>
      <SseMap />
      <Labels />
    </main>
  );
}
`;

for (const [file, content] of Object.entries(files)) {
  mkdirSync(`${app}/${file.split("/").slice(0, -1).join("/")}`, { recursive: true });
  writeFileSync(`${app}/${file}`, content);
  console.log(`wrote ${file}`);
}
