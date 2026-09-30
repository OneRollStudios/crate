# Crate Wait States

Open-source React components for the time between sending an AI prompt and receiving a finished answer. `useAgentStatus` reads a Vercel AI SDK `useChat` return value and automatically moves the UI through thinking, tool use, streaming, stalled, error, and done states.

Made by [One Roll Studios](https://onerollstudios.com). MIT licensed.

## Install

Install everything:

```bash
npx shadcn@latest add https://crate.onerollstudios.com/r/all.json
```

Or install one item:

```bash
npx shadcn@latest add https://crate.onerollstudios.com/r/thinking.json
npx shadcn@latest add https://crate.onerollstudios.com/r/streaming.json
npx shadcn@latest add https://crate.onerollstudios.com/r/tool-call.json
npx shadcn@latest add https://crate.onerollstudios.com/r/stalled.json
npx shadcn@latest add https://crate.onerollstudios.com/r/error.json
npx shadcn@latest add https://crate.onerollstudios.com/r/done.json
npx shadcn@latest add https://crate.onerollstudios.com/r/agent-state.json
npx shadcn@latest add https://crate.onerollstudios.com/r/use-agent-status.json
```

## AI SDK usage

```tsx
import { useChat } from "@ai-sdk/react";
import { AgentState } from "@/components/agent-wait-states";
import { useAgentStatus } from "@/hooks/use-agent-status";

export function ChatWaitState() {
  const chat = useChat();
  const status = useAgentStatus(chat);

  return (
    <AgentState
      status={status}
      text="The text currently being streamed"
      errorMessage={chat.error?.message}
    />
  );
}
```

The hook accepts the structural shape returned by AI SDK v5+ `useChat`: `status`, `messages`, `error`, and `stop`. It reads text parts, static tool parts such as `tool-search`, `dynamic-tool` parts, and legacy `tool-invocation` parts.

```ts
const status = useAgentStatus(chat, {
  stallAfterMs: 5000,
  onCancel: chat.stop,
  manualStatus: undefined,
});
```

It returns:

```ts
type AgentStatusSnapshot = {
  state: "thinking" | "tool" | "streaming" | "stalled" | "error" | "done";
  activeToolName?: string;
  elapsedMs: number;
  showCancel: boolean;
  label: string;
  cancel?: () => void;
};
```

While a request is waiting, the default display uses dots initially, shows “Still thinking…” after eight seconds, and offers cancel after twenty seconds. A streaming response becomes stalled after five seconds without new text. `stop()` is used as the default cancel handler.

## Manual usage

`AgentState` also accepts a plain status, so it works without the AI SDK:

```tsx
<AgentState status="thinking" />
<AgentState status="streaming" text={content} duotone />
<AgentState status="tool" toolName="search" />
<AgentState status="stalled" />
<AgentState status="error" onRetry={retry} />
<AgentState status="done" />
```

Individual components:

```tsx
<Thinking elapsedMs={elapsedMs} onCancel={cancel} />
<Streaming text={content} />
<ToolCall steps={steps} />
<Stalled message="Still working…" />
<Error message="The stream dropped." onRetry={retry} />
<Done />
```

`ToolCall` accepts one implicit step through `toolName` and `label`, or a list:

```tsx
<ToolCall
  steps={[
    { label: "Searching the web…", toolName: "search", state: "complete" },
    { label: "Reading file…", toolName: "read_file", state: "active" },
  ]}
/>
```

## Theming

The components use the host app’s shadcn variables: `--primary`, `--muted`, `--foreground`, `--background`, and `--border`. They bundle no fonts and work in light or dark themes when those variables change. Pass `duotone` to use the optional lilac `#9E8CF2` to sky `#6FB6F0` accent.

All state announcements use polite live regions. Motion has a reduced-motion fallback, and every action is a native keyboard-accessible button.

## Development

```bash
npm install
npm run dev
npm run build
```

`npm run build` first runs `shadcn build`, writes installable item files to `public/r`, then creates the static Next.js export in `out` for Cloudflare Pages.
