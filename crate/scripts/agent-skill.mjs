// Generates the Crate agent skill from one source, in each coding agent's format:
//   agent-skill/dist/claude/SKILL.md   Claude Code skill (.claude/skills/crate/)
//   agent-skill/dist/cursor/crate.mdc  Cursor rule (.cursor/rules/)
//   agent-skill/dist/agents/crate.md   Codex and any agent that reads AGENTS.md
// Sources: agent-skill/skill.md (the text), agent-skill/when.json (when to use each
// component), registry.json (names and descriptions), and README.md (install and
// wiring examples, which CI already type-checks and tests). The script fails if a
// component has no "when" entry or an example is missing, so the skill can't drift.
// Run: node scripts/agent-skill.mjs (part of npm run build, before the registry build)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
// Normalize line endings: a Windows checkout (git autocrlf) has CRLF files.
const read = (file) => readFileSync(`${root}${file}`, "utf8").replace(/\r\n?/g, "\n");
const registry = JSON.parse(read("registry.json"));
const readme = read("README.md");
const template = read("agent-skill/skill.md");
const when = JSON.parse(read("agent-skill/when.json"));
const site = read("lib/config.ts").match(/SITE_URL = "([^"]+)"/)[1];
const fence = "```";
const problems = [];

const description =
  "Add Crate wait states to a React AI app and wire them to its AI stream: thinking, reasoning, " +
  "sources, tool calls, streaming, stalled, errors, and done. Use when the developer wants their AI " +
  "app to show what the AI is doing while it works, or asks for loading, thinking, or streaming states.";

function section(heading) {
  const start = readme.indexOf(`\n## ${heading}\n`);
  if (start < 0) {
    problems.push(`README.md has no "## ${heading}" section`);
    return "";
  }
  const rest = readme.slice(start + heading.length + 5);
  const end = rest.indexOf("\n## ");
  return end < 0 ? rest : rest.slice(0, end);
}
const blocks = (text) => [...text.matchAll(/```(\w*)\n([\s\S]*?)```/g)].map((m) => ({ lang: m[1], code: m[2].trimEnd() }));
function block(heading, test, label) {
  const found = blocks(section(heading)).find((b) => test(b.code));
  if (!found) problems.push(`README.md "## ${heading}" has no ${label} example`);
  return found ? `${fence}${found.lang}\n${found.code}\n${fence}` : "";
}
const item = (name) => {
  const found = registry.items.find((i) => i.name === name);
  if (!found) problems.push(`registry.json has no "${name}" item`);
  return found;
};
const add = (name) => `npx shadcn@latest add ${site}/r/${name}.json`;
const cell = (text) => String(text).replace(/\|/g, "\\|");

// Components: every installable component needs a "when to use" line, and vice versa.
const components = registry.items.filter((i) => i.type === "registry:ui" && !["crate-provider", "agent-state"].includes(i.name));
for (const c of components) if (!when[c.name]) problems.push(`agent-skill/when.json has no entry for "${c.name}"`);
for (const name of Object.keys(when)) if (!components.some((c) => c.name === name)) problems.push(`agent-skill/when.json names "${name}", which is not a registry component`);
const componentsTable = [
  "| Component | Item | Use when |",
  "| --- | --- | --- |",
  ...components.map((c) => `| \`${c.title}\` | \`${c.name}\` | ${cell(when[c.name] ?? "")} |`),
].join("\n");

const stacks = [
  ["`ai` and `@ai-sdk/react`", "Vercel AI SDK", "`all`", "useAgentStatus reads `useChat` directly"],
  ["`@openai/agents`", "OpenAI Agents SDK", "`all` and `openai-agents-adapter`", "the adapter turns the run into events"],
  ["`@langchain/core` or `@langchain/langgraph`", "LangChain or LangGraph", "`all` and `langchain-adapter`", "the adapter turns `streamEvents` into events"],
  ["none of these, the server streams server-sent events", "Any SSE backend", "`all` and `agent-stream`", "map the server's events with `useAgentStream`"],
];
for (const name of ["all", "openai-agents-adapter", "langchain-adapter", "agent-stream"]) item(name);
const stacksTable = [
  "| In `package.json` | Stack | Install | How |",
  "| --- | --- | --- | --- |",
  ...stacks.map((row) => `| ${row.join(" | ")} |`),
].join("\n");

const install = [
  "Install everything for the automatic states, plus the adapter for the app's stack:",
  "",
  `${fence}bash`,
  add("all"),
  "# OpenAI Agents SDK only:",
  add("openai-agents-adapter"),
  "# LangChain or LangGraph only:",
  add("langchain-adapter"),
  "# Any other server-sent events backend only:",
  add("agent-stream"),
  fence,
  "",
  `For a single component, replace \`all\` with its item name from the table above. If the project has the \`@crate\` registry (\`npx shadcn@latest registry add @crate=${site}/r/{name}.json\`), \`npx shadcn@latest add @crate/all\` works too.`,
].join("\n");

const adapters = "Stream Adapters";
const wiring = [
  "### Vercel AI SDK",
  "",
  block("AI SDK usage", (code) => code.includes("useAgentStatus(chat)"), "useChat"),
  "",
  "`streamedText` is the reply being written: the last assistant message while `chat.status` is `\"submitted\"` or `\"streaming\"`. Show it inside `AgentState` only and leave it out of the message list until it's finished, or the reply appears twice:",
  "",
  block("Show the Reply Once", (code) => code.includes("message !== live"), "message list"),
  "",
  "A complete working chat is in the crate repository at `examples/real-chat`.",
  "",
  "### OpenAI Agents SDK",
  "",
  "Server route:",
  "",
  block(adapters, (code) => code.includes("fromOpenAIAgents("), "OpenAI Agents SDK route"),
  "",
  "Client (the same for every adapter):",
  "",
  block(adapters, (code) => code.includes("useAgentStream({") && code.includes("useAgentStatus(stream)"), "client"),
  "",
  "### LangChain or LangGraph",
  "",
  "Server route (any runnable: a chain, an agent, or a compiled graph). The client is the same as above.",
  "",
  block(adapters, (code) => code.includes("fromLangChain("), "LangChain route"),
  "",
  "### Any Server-Sent Events Backend",
  "",
  "Map each event the server sends to agent events (`text`, `reasoning`, `source`, `tool-start`, `tool-end`, `error`, `done`), then use the client above with this `useAgentStream` call:",
  "",
  block(adapters, (code) => code.includes("map: (message)"), "raw SSE"),
].join("\n");

const provider = blocks(section("Labels and languages")).find((b) => b.code.includes("<CrateProvider"));
if (!provider) problems.push('README.md "## Labels and languages" has no CrateProvider example');

if (problems.length) {
  console.error(`agent-skill: cannot generate the skill:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const body = template
  .replace("{{stacks}}", stacksTable)
  .replace("{{components}}", componentsTable)
  .replace("{{install}}", install)
  .replace("{{wiring}}", wiring)
  .replace("{{provider}}", provider.code)
  .replaceAll("{{site}}", site);
const leftover = body.match(/\{\{\w+\}\}/);
if (leftover) {
  console.error(`agent-skill: unfilled placeholder ${leftover[0]} in agent-skill/skill.md`);
  process.exit(1);
}
const note = `<!-- Generated by Crate (${site}). To update, run: ${add("crate-skill")} -->\n\n`;

const outputs = {
  "agent-skill/dist/claude/SKILL.md": `---\nname: crate\ndescription: ${JSON.stringify(description)}\n---\n\n${note}${body}`,
  "agent-skill/dist/cursor/crate.mdc": `---\ndescription: ${JSON.stringify(description)}\nglobs:\nalwaysApply: false\n---\n\n${note}${body}`,
  "agent-skill/dist/agents/crate.md": `${note}${body}`,
};
for (const [file, text] of Object.entries(outputs)) {
  mkdirSync(`${root}${file.slice(0, file.lastIndexOf("/"))}`, { recursive: true });
  writeFileSync(`${root}${file}`, text);
}
console.log(`agent-skill: wrote ${Object.keys(outputs).join(", ")}`);
