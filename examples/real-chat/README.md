# Crate Real Chat

A minimal Next.js chat that wires the AI SDK's `useChat` to Crate's
`useAgentStatus`, so every wait state comes from a real conversation:
thinking, reasoning, sources, tool calls, streaming, stalled, error, and done.

The whole integration is two lines in `app/chat.tsx`:

```tsx
const chat = useChat();
const status = useAgentStatus(chat);
```

and one component:

```tsx
<AgentState status={status} text={streamedText} errorMessage={chat.error?.message} onRetry={() => chat.regenerate()} />
```

## Run It

From this folder, with Node 22+:

```bash
cp .env.example .env.local   # then add your ANTHROPIC_API_KEY
npm install
npm run dev
```

Open http://localhost:3000 and ask which Crate component fits a moment.

- **With `ANTHROPIC_API_KEY` set**, `app/api/chat/route.ts` streams a real
  model (`claude-opus-5-5` by default, or `CRATE_MODEL`) through the AI SDK. The
  model can call `lookupComponent`, a real tool that searches Crate's registry,
  so you see the tool-call state. Every message is a real API call.
- **Without a key** (or with `CRATE_MOCK=1`), the route streams a scripted
  reply in the same AI SDK format (`app/api/chat/mock.ts`). It walks through
  every state, including a stall, without any API calls.

To use another provider, swap `anthropic(model)` in the route for any AI SDK
provider. Nothing else changes.

## Where the Components Come From

`npm run dev` and `npm run build` first run `scripts/sync-crate.mjs`, which
copies the components and hook from this repo's registry
(`crate/public/r/all.json`) exactly where `npx shadcn add` puts them. The copies
are gitignored, so the example always runs the current components. In your own
app, install them with:

```bash
npx shadcn@latest add https://crate.onerollstudios.com/r/all.json
```

## Test

CI runs `bash examples/real-chat/scripts/ci-test.sh`. It builds this example
in mock mode, sends a message in Chromium, and checks each state in order with
`crate/scripts/real-chat-test.mjs`. It never calls a model.
