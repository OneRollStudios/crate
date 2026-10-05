// Builds src/wiring.json, the "next step" snippets crate init prints for each
// AI stack, from the examples in crate/README.md (which CI type-checks and
// tests). Run after changing those examples: node scripts/wiring.mjs
// The CLI's tests fail if src/wiring.json is out of date.
import { readFileSync, writeFileSync } from "node:fs";

const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf8");

function section(heading) {
  const start = readme.indexOf(`\n## ${heading}\n`);
  if (start < 0) throw new Error(`README.md has no "## ${heading}" section`);
  const rest = readme.slice(start + heading.length + 5);
  const end = rest.indexOf("\n## ");
  return end < 0 ? rest : rest.slice(0, end);
}
function block(heading, test, label) {
  const found = [...section(heading).matchAll(/```\w*\n([\s\S]*?)```/g)].map((m) => m[1].trimEnd()).find(test);
  if (!found) throw new Error(`README.md "## ${heading}" has no ${label} example`);
  return found;
}

const client = block("Stream Adapters", (code) => code.includes("useAgentStream({") && code.includes("useAgentStatus(stream)"), "client");
const route = (label, code) => `// Server route\n${code}\n\n// Client\n${client}`;

export function buildWiring() {
  return {
    "ai-sdk": block("AI SDK usage", (code) => code.includes("useAgentStatus(chat)"), "useChat"),
    "openai-agents": route("OpenAI Agents SDK", block("Stream Adapters", (code) => code.includes("fromOpenAIAgents("), "OpenAI Agents SDK route")),
    langchain: route("LangChain", block("Stream Adapters", (code) => code.includes("fromLangChain("), "LangChain route")),
    sse: block("Stream Adapters", (code) => code.includes("map: (message)"), "raw SSE"),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(new URL("../src/wiring.json", import.meta.url), JSON.stringify(buildWiring(), null, 2) + "\n");
  console.log("wrote src/wiring.json");
}
