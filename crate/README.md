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
agent-state
use-agent-status
```

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

`AgentState` renders every state through one wrapper. For the prop-driven states, pass `planSteps`, approval callbacks and preview, queue options, or file metadata alongside the status.

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

Pull requests and pushes to `main` run the `checks` CI job: the production build
(including TypeScript), registry synchronization, the em-dash copy guard, visual
checks, and a fresh Next.js + shadcn installation test. Screenshots are uploaded
as the `screenshots` artifact, including any captured before a failure.

After building, run the install test from `crate/` with Node 22+, npm, Bash, and
curl available (use Git Bash or WSL on Windows):

```bash
bash scripts/install-test.sh
```

The test serves `out/` on a free local port, installs `all.json` into a temporary
consumer app, and builds it. It stops the server and removes the temporary app
on exit. It uses the latest public Next.js and shadcn CLIs and requires internet
access. For visual checks, run `node scripts/visual-check.mjs`; set
`SCREENSHOT_DIR=screenshots` to use the same ignored output folder as CI.
It uses Playwright's bundled Chromium on any OS, so run
`npx playwright install chromium` once first. To use a specific Chrome or
Chromium instead, set `CHROMIUM_PATH` to its executable.
