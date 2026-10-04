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
checks, fresh Next.js + shadcn and Vite + React + shadcn installation tests, and
a themed host app test. Screenshots are uploaded
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

For visual checks, run `node scripts/visual-check.mjs`; set
`SCREENSHOT_DIR=screenshots` to use the same ignored output folder as CI.

Both the install test and the visual check use Playwright's bundled Chromium on
any OS, so run `npx playwright install chromium` once first. To use a specific
Chrome or Chromium instead, set `CHROMIUM_PATH` to its executable.
