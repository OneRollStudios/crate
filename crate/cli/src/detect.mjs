// Reads what crate init needs to know about an app: its framework, its shadcn
// setup (from components.json, shadcn's own config), its AI stack, and the root
// file and language for CrateProvider. Reads files only; changes nothing.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const firstExisting = (cwd, files) => files.find((file) => existsSync(join(cwd, file)));

export const STACKS = {
  "ai-sdk": { label: "Vercel AI SDK", adapter: null },
  "openai-agents": { label: "OpenAI Agents SDK", adapter: "openai-agents-adapter" },
  langchain: { label: "LangChain or LangGraph", adapter: "langchain-adapter" },
  sse: { label: "none detected (any server-sent events)", adapter: "agent-stream" },
};

export function detectStack(deps) {
  if (deps["@openai/agents"]) return "openai-agents";
  if (deps["@langchain/core"] || deps["@langchain/langgraph"] || deps.langchain) return "langchain";
  if (deps.ai || deps["@ai-sdk/react"]) return "ai-sdk";
  return "sse";
}

function detectFramework(cwd, deps) {
  if (deps.next) {
    const layout = firstExisting(cwd, ["app/layout.tsx", "src/app/layout.tsx", "app/layout.jsx", "src/app/layout.jsx"]);
    if (layout) return { name: "next-app", label: "Next.js (App Router)", rootFile: layout };
    return { name: "next-pages", label: "Next.js (Pages Router)", rootFile: firstExisting(cwd, ["pages/_app.tsx", "src/pages/_app.tsx"]) ?? null };
  }
  if (deps.vite) {
    return { name: "vite", label: "Vite", rootFile: firstExisting(cwd, ["src/main.tsx", "src/main.jsx"]) ?? null };
  }
  return { name: "unknown", label: "unknown framework", rootFile: null };
}

// <html lang="..."> in the root layout, or in index.html for Vite.
function detectLanguage(cwd, framework) {
  const candidates = framework.name === "vite" ? ["index.html"] : framework.rootFile ? [framework.rootFile] : [];
  for (const file of candidates) {
    if (!existsSync(join(cwd, file))) continue;
    const match = readFileSync(join(cwd, file), "utf8").match(/<html[^>]*\slang=["']([\w-]+)["']/);
    if (match) return match[1];
  }
  return null;
}

export function detect(cwd) {
  if (!existsSync(join(cwd, "package.json"))) throw new Error(`No package.json in ${cwd}. Run crate init in your app's folder.`);
  const pkg = readJson(join(cwd, "package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const framework = detectFramework(cwd, deps);
  const componentsJson = existsSync(join(cwd, "components.json")) ? readJson(join(cwd, "components.json")) : null;
  const stack = detectStack(deps);
  return {
    cwd,
    framework,
    react: Boolean(deps.react),
    tailwind: Boolean(deps.tailwindcss),
    shadcn: componentsJson
      ? {
          cssFile: componentsJson.tailwind?.css ?? null,
          componentsAlias: componentsJson.aliases?.components ?? "@/components",
        }
      : null,
    stack,
    adapter: STACKS[stack].adapter,
    language: detectLanguage(cwd, framework),
  };
}
