# Crate Wait States

Open-source React components for the time between sending an AI prompt and receiving a finished answer. `useAgentStatus` reads a Vercel AI SDK v5+ `useChat` return value and automatically maps thinking, reasoning, sources, tool use, streaming, stalled, error, and done states.

Made by [One Roll Studios](https://onerollstudios.com). MIT licensed.

## Install

```bash
npx shadcn@latest add https://crate.onerollstudios.com/r/all.json
```

Install individual items by replacing `all` with one of:

```text
thinking
streaming
tool-call
stalled
error
done
reasoning-trace
sources
agent-plan
approval
queue
file-processing
crate-provider
agent-state
use-agent-status
```

Stream adapters for backends other than the Vercel AI SDK are separate items. See [Stream Adapters](#stream-adapters).

## Use With Coding Agents

Crate ships a skill that teaches coding agents when to use each component, how to install it, and how to wire it to the app's AI stream (Vercel AI SDK, OpenAI Agents SDK, LangChain and LangGraph, or any server-sent events).

Agents install Crate by running `npx shadcn@latest add`. If your coding agent blocks that command or asks every time, allow it in the agent's permission settings.

```bash
# 1. Add Crate as a shadcn registry, so agents can search and install it as @crate
npx shadcn@latest registry add @crate=https://crate.onerollstudios.com/r/{name}.json
# 2. Connect your agent to the shadcn MCP server
npx shadcn@latest mcp init --client claude   # or cursor, codex
# 3. Install the skill
npx shadcn@latest add @crate/crate-skill
```

| Agent | Reads |
| --- | --- |
| Claude Code | `.claude/skills/crate/SKILL.md`, loaded when a task needs it |
| Cursor | `.cursor/rules/crate.mdc`, a rule the agent applies when relevant |
| Codex and other agents | `.agents/crate.md`. Add this line to your `AGENTS.md`: `When adding loading, thinking, or streaming states to the AI UI, follow .agents/crate.md.` |

Then ask your agent, for example, "Add Crate wait states to my chat (crate.onerollstudios.com)." The skill is generated from the same source as these docs on every build, so it always matches the current components. Crate never edits your `AGENTS.md` itself.

## AI SDK usage

```tsx
const chat = useChat();
const status = useAgentStatus(chat);

<AgentState
  status={status}
  text={streamedText}
  reasoning={status.reasoning}
  sources={status.sources}
/>
```

`streamedText` is the reply being written; see [Show the Reply Once](#show-the-reply-once) for where it comes from and how to keep it out of the message list.

The hook reads AI SDK v5+ text, reasoning, source, static tool, dynamic tool, and legacy tool-invocation parts. It detects a five-second streaming stall by default, changes the thinking label after eight seconds, and exposes cancellation after twenty seconds using `chat.stop()`.

```ts
type AgentStatusSnapshot = {
  state:
    | "thinking" | "reasoning" | "sources" | "tool"
    | "streaming" | "stalled" | "error" | "done";
  activeToolName?: string;
  reasoning?: string;
  sources: AgentSource[];
  elapsedMs: number;
  showCancel: boolean;
  label: string;
  cancel?: () => void;
};
```

Pass `manualStatus` to use the hook with an external state source. `AgentPlan`, `Approval`, `Queue`, and `FileProcessing` are intentionally prop-driven because they describe application workflows rather than AI SDK message parts.

## Show the Reply Once

While a reply streams, show it in one place: inside `AgentState`, through its `text` prop. Leave that message out of your message list until it's finished, or the reply appears twice. Once the chat is ready, the finished message moves into the list.

```tsx
"use client";

import type { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function Messages({ chat }: { chat: ReturnType<typeof useChat> }) {
  const status = useAgentStatus(chat);

  // The reply being written right now: the last message, while the chat is busy.
  const busy = chat.status === "submitted" || chat.status === "streaming";
  const last = chat.messages.at(-1);
  const live = busy && last?.role === "assistant" ? last : undefined;

  return (
    <>
      {/* Finished messages only. AgentState shows the live reply, so it appears once. */}
      <ol className="flex flex-col gap-4">
        {chat.messages.filter((message) => message !== live).map((message) => (
          <li key={message.id} className={message.role === "user" ? "self-end rounded-lg bg-muted px-4 py-2" : "leading-7"}>
            {textOf(message)}
          </li>
        ))}
      </ol>
      {chat.messages.length > 0 ? (
        <AgentState
          status={status}
          text={live ? textOf(live) : undefined}
          errorMessage={chat.error?.message}
          onRetry={() => chat.regenerate()}
        />
      ) : null}
    </>
  );
}
```

This is `app/messages.tsx` from the working example in `examples/real-chat`, and CI checks in a browser that each reply shows exactly once. With `useAgentStream` the same applies: pass `stream.text` to `AgentState` only.

## Stream Adapters

`useAgentStatus` reads the Vercel AI SDK's `useChat` directly. For other backends, an adapter converts the framework's stream into a small set of agent events on the server, and `useAgentStream` reads them in the browser and returns the shape `useAgentStatus` needs.

| Backend | Install |
| --- | --- |
| OpenAI Agents SDK | `npx shadcn@latest add https://crate.onerollstudios.com/r/openai-agents-adapter.json` |
| LangChain and LangGraph | `npx shadcn@latest add https://crate.onerollstudios.com/r/langchain-adapter.json` |
| Any server-sent events | `npx shadcn@latest add https://crate.onerollstudios.com/r/agent-stream.json` |

The adapters read each framework's events by shape, so they add no dependencies. Errors in a run become the error state instead of a broken stream.

OpenAI Agents SDK route (Next.js shown; any server that returns a `Response` works):

```ts
import { Agent, run } from "@openai/agents";
import { agentEventsResponse } from "@/lib/agent-stream";
import { fromOpenAIAgents } from "@/lib/agent-stream-openai-agents";

const agent = new Agent({ name: "Assistant", instructions: "Help the user." });

export async function POST(request: Request) {
  const { message } = await request.json();
  return agentEventsResponse(fromOpenAIAgents(await run(agent, message, { stream: true })));
}
```

LangChain or LangGraph route (any runnable: a chain, an agent, or a compiled graph):

```ts
import { agentEventsResponse } from "@/lib/agent-stream";
import { fromLangChain } from "@/lib/agent-stream-langchain";
import { graph } from "./graph";

export async function POST(request: Request) {
  const { message } = await request.json();
  const events = graph.streamEvents({ messages: [{ role: "user", content: message }] }, { version: "v2" });
  return agentEventsResponse(fromLangChain(events));
}
```

The client is the same for both:

```tsx
"use client";

import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";
import { useAgentStream } from "@/hooks/use-agent-stream";

export function Assistant() {
  const stream = useAgentStream({ api: "/api/agent" });
  const status = useAgentStatus(stream);
  const ask = () => stream.send({ message: "Plan my week" });

  return (
    <>
      <button type="button" onClick={ask}>Ask</button>
      <AgentState status={status} text={stream.text} errorMessage={stream.error?.message} onRetry={ask} />
    </>
  );
}
```

For a server that already streams server-sent events in its own format, pass `map` to turn each event into agent events. For example, a chat-completions style stream:

```tsx
const stream = useAgentStream({
  api: "/api/chat",
  map: (message) => {
    if (message.data === "[DONE]") return { type: "done" };
    const delta = JSON.parse(message.data).choices[0]?.delta?.content;
    return delta ? { type: "text", delta } : null;
  },
});
```

Agent events: `text` and `reasoning` (deltas), `source`, `tool-start` and `tool-end`, `error`, and `done`. The OpenAI Agents SDK adapter maps text, reasoning, tool calls, and handoffs. The LangChain adapter maps model text, reasoning and thinking blocks, and tool starts, ends, and errors. To send events from anything else, yield them from an async generator and pass it to `agentEventsResponse`.

## Labels and languages

Every piece of text in the components can be replaced. Wrap your app (or any part of it) in `CrateProvider` to set labels and a locale for every component inside it. Any label you leave out falls back to English.

```tsx
import { CrateProvider, type CrateLabels } from "@/components/agent-wait-states";

const fr: Partial<CrateLabels> = {
  thinking: "Réflexion…",
  stillThinking: "Toujours en réflexion…",
  cancel: "Annuler",
  done: "Terminé",
  retry: "Réessayer",
  error: "Une erreur est survenue.",
  showThinking: "Afficher le raisonnement",
  thoughtFor: (seconds, f) => `Réflexion pendant ${f.seconds(seconds)}`,
  moreSources: (count, f) => `+${f.number(count)} ${f.plural(count, { one: "autre", other: "autres" })}`,
  planProgress: (current, total, f) => `${f.number(current)} sur ${f.number(total)}`,
  expiresIn: (seconds, f) => `Expire dans ${f.seconds(seconds)}`,
  deny: "Refuser",
  allow: "Autoriser",
  queuePosition: (position, f) => `Vous êtes n° ${f.number(position)} dans la file`,
};

<CrateProvider locale="fr" labels={fr}>
  <AgentState status={status} />
</CrateProvider>
```

- Labels that contain a number are functions. They receive the value and a formatter `f` built from the locale with `Intl`: `f.number()` for counts, `f.seconds()` for times and countdowns, and `f.plural(value, { one, other, ... })` for plural forms.
- Each component also takes a `labels` prop that overrides the provider for that component only, for example `<Done labels={{ done: "Fini !" }} />`. Existing text props such as `label`, `message`, and `title` still win over both.
- `useAgentStatus` reads the provider too, so `status.label` follows your locale.
- Nested providers inherit the outer locale and labels and override only what they set.
- Right-to-left: components use logical CSS properties, so they mirror correctly inside `dir="rtl"`. Set `dir` on your `<html>` or a parent element.

See the `CrateLabels` type in `crate-provider.tsx` for every label key.

## Components

```tsx
<Thinking elapsedMs={elapsedMs} onCancel={cancel} accent />
<Streaming text={content} accent />
<ToolCall steps={toolSteps} accent />
<Stalled message="Still working…" accent />
<ErrorState message={error.message} onRetry={retry} />
<Done accent />

<ReasoningTrace text={reasoning} done={finished} durationSeconds={12} accent />
<Sources sources={sources} maxVisible={3} accent />
<AgentPlan steps={planSteps} accent />
<Approval preview={action} onAllow={allow} onDeny={deny} expiresIn={30} accent />
<Queue position={3} accent />
<Queue variant="rate-limit" retryIn={20} accent />
<FileProcessing filename="report.pdf" size="2.4 MB" stage="chunking" progress={72} accent />
```

`AgentState` renders every state through one wrapper. For the prop-driven states, pass `planSteps`, approval callbacks and preview, queue options, or file metadata alongside the status. Components never make up data: leave out a value such as `position`, `retryIn`, `durationSeconds`, `filename`, or `size` and that part shows a neutral message or nothing, instead of a placeholder number or file.

## Theming and accessibility

Every component uses the host app's shadcn variables: `--primary`, `--muted`, `--foreground`, `--background`, and `--border`. Components bundle no fonts and remain readable in light and dark themes. The optional `accent` prop uses `--primary`.

State changes use polite live regions. Controls are native keyboard-accessible buttons, and motion has a `prefers-reduced-motion` fallback.

## Development

```bash
npm install
npm run dev
npm run build
```

The build creates shadcn registry items in `public/r` and a static Cloudflare Pages export in `out`.
It also generates `/llms.txt` and one Markdown doc per item in `/llms/` from the
component source, `registry.json`, and this README (`scripts/llms.mjs`), so the
docs coding agents read never go stale. These files are not committed.

Pull requests and pushes to `main` run the `checks` CI job: the production build
(including TypeScript), registry synchronization, the llms.txt link check, the em-dash copy guard, visual
checks, fresh Next.js + shadcn and Vite + React + shadcn installation tests, a
themed host app test, and the real chat example. Screenshots are uploaded
as the `screenshots` artifact, including any captured before a failure.

After building, run the install test from `crate/` with Node 22+, npm, Bash, and
curl available (use Git Bash or WSL on Windows):

```bash
bash scripts/install-test.sh          # Next.js
bash scripts/install-test.sh vite     # Vite + React
bash scripts/install-test.sh themed   # Next.js app with its own theme
```

The `themed` mode installs into an app whose shadcn theme differs from the
default on colors (light and dark), radius, and font
(`scripts/fixtures/host-theme.css`), renders every component, and checks with
`scripts/theme-check.mjs` that each one takes every color, corner radius, and
font from that theme. It saves a screenshot of each state in light and dark.

The test serves `out/` on a free local port, installs `all.json` into a temporary
consumer app (Next.js, or Vite + React set up as in shadcn's Vite guide), and
builds it. Both apps use the same test page, `scripts/fixtures/mock-chat.tsx`. The app wires `useAgentStatus` to a real `useChat`
with a mocked AI SDK stream (no API key), and `scripts/stream-test.mjs` drives it
in Chromium through thinking, tool call, streaming, stalled, error, retry, and
done, checking that the right component shows for each. It stops the servers and
removes the temporary app on exit. It uses the latest public Next.js, Vite, shadcn, and
AI SDK packages and requires internet access.

The `Live check` workflow runs `bash scripts/verify-live.sh` against the live site
every day, about five minutes after each push to `main`, and on demand. It checks
the homepage, `/r/all.json`, `/llms.txt` and every link in it, and installs
`all.json` from the live site into a fresh Next.js + shadcn app and builds it. A
failure opens an issue labeled `human`. Pass a URL to check a preview instead:
`bash scripts/verify-live.sh https://<branch>.crate-3m1.pages.dev`.

`examples/real-chat` is a minimal Next.js chat that wires the AI SDK's `useChat`
to `useAgentStatus`. It calls a real model when `ANTHROPIC_API_KEY` is set and
otherwise streams a scripted reply. CI builds it in mock mode and checks every
state with `bash ../examples/real-chat/scripts/ci-test.sh`. See its README.

For visual checks, run `node scripts/visual-check.mjs`; set
`SCREENSHOT_DIR=screenshots` to use the same ignored output folder as CI.

Both the install test and the visual check use Playwright's bundled Chromium on
any OS, so run `npx playwright install chromium` once first. To use a specific
Chrome or Chromium instead, set `CHROMIUM_PATH` to its executable.
