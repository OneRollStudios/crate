# Proposal: Crate for Coding Agents (#12)

Status: proposal, waiting for approval. Nothing here is built yet.

## Goal

From #12: agents can list crate components and know when to use each, install
them into the current project, and wire `useAgentStatus` to the project's
existing AI stream. Setup is documented for Claude Code, Cursor, and Codex.

## What Already Exists

- `/llms.txt` and one machine-readable doc per item, generated from source (#45).
- A shadcn registry at `/r/*.json`, including the index at `/r/registry.json`.
- Stream adapters for the AI SDK, OpenAI Agents SDK, LangChain/LangGraph, and raw
  SSE (#61, open).
- The shadcn CLI (3.x) ships an MCP server (`npx shadcn mcp`, with
  `shadcn mcp init --client claude|cursor|vscode|codex|opencode`) that can list,
  search, view, and install items from any registry the project names in
  `components.json`, via namespaces (`npx shadcn registry add @name=url`). I
  checked this against shadcn 3.8.5.

## Options

| | What it is | Covers | Cost |
| --- | --- | --- | --- |
| A. Our own MCP server | npm package with tools such as `list`, `doc`, `install`, `wire` | All four goals | Publish and version an npm package; list and install duplicate shadcn's MCP; every user configures another server |
| B. shadcn's MCP server, crate as a namespaced registry | Document `@crate=https://crate.onerollstudios.com/r/{name}.json` and `shadcn mcp init` | List and install | Almost no code. Agents get names and descriptions but no "when to use" and no wiring |
| C. A Crate agent skill | One instructions file that teaches an agent the full workflow: inspect, pick, install, wire, verify | When to use, wiring, verify | A generated Markdown file, shipped as a registry item. No server to run |

## Recommendation: B and C Now, A Only If Needed

B gives listing and installing for free through a server people may already run.
C adds what B lacks: when to use each component and how to wire it to the stream
the project already has. Together they meet every Done when item in #12 without a
server to maintain. If agents still struggle with wiring or checking their work,
a small MCP server with only the missing tools (for example `crate_verify`) can
come later, built on the same generated content.

### The skill

- **Content.** Generated at build time from `registry.json`, the README, and the
  llms docs, like `llms.txt`, so it cannot go stale. Sections:
  1. Inspect: `npx shadcn info` for framework, Tailwind, and aliases;
     `package.json` for the AI stack.
  2. Pick: which component for which moment, with one-line rules
     (for example "a stream that goes quiet: `Stalled`").
  3. Install: the exact `npx shadcn add` commands.
  4. Wire: one recipe per stack (AI SDK `useChat`, OpenAI Agents SDK,
     LangChain/LangGraph, any SSE), taken from the README examples.
  5. Verify: build the app, and check that each state renders.
- **Distribution.** A registry item, `crate-skill`, installed with one
  `npx shadcn add` command. It writes:
  - `.claude/skills/crate/SKILL.md` for Claude Code,
  - `.cursor/rules/crate.mdc` for Cursor,
  - `.agents/crate.md` for Codex and any other agent, with a one-line pointer
    the developer adds to their `AGENTS.md`. Crate will not edit a developer's
    `AGENTS.md` on its own.

### Setup in the README ("Use With Coding Agents")

```bash
npx shadcn@latest registry add @crate=https://crate.onerollstudios.com/r/{name}.json
npx shadcn@latest mcp init --client claude   # or cursor, codex
npx shadcn@latest add @crate/crate-skill
```

## How It Would Be Tested

- CI installs `crate-skill` into a fresh app and checks each file lands where
  each agent reads it.
- CI checks `npx shadcn search @crate` and `npx shadcn view @crate/thinking`
  against the local registry.
- Every command and code snippet in the skill comes from tested README examples
  and type-checked adapters; a check fails the build if the skill names an item
  that doesn't exist.
- What CI cannot check: how well a given agent follows the skill. I would run
  it by hand in Claude Code on the `examples/real-chat` app and report the
  result in the PR.

## Questions for You

1. Is `@crate` the namespace you want? It works today in the URL form above.
   Being listed in shadcn's public registry directory (so `@crate` works
   without the URL) is a separate submission.
2. Should one `crate-skill` item install the files for all three agents, or
   should there be one item per agent?
3. Agree to defer our own MCP server until there is a clear gap?
