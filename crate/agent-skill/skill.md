# Crate Wait States

Crate gives a React AI app ready-made UI for the moments while the AI is working:
thinking, reasoning, sources, tool calls, streaming, stalls, errors, and more.
`useAgentStatus` reads the app's AI stream and `AgentState` shows the right
component for each moment. Components are installed into the project with the
shadcn CLI and take their look from the app's shadcn theme.

Follow these steps in order. Show the developer what you plan to change before
changing it.

## 1. Inspect the App

- Run `npx shadcn@latest info`. It reports the framework, Tailwind version, CSS
  file, and import alias. Crate needs React, Tailwind CSS, and shadcn.
- If there is no `components.json`, shadcn is not set up. Ask the developer
  before running `npx shadcn@latest init`.
- Find the AI stack in `package.json`:

{{stacks}}

## 2. Pick Components

`AgentState` with `useAgentStatus` covers the automatic states in one component.
Install single components only when the app needs one moment on its own.

{{components}}

Rules:

- Every state must reflect what is really happening. Never show a progress
  value, queue position, or file stage the app does not actually have. Leave
  the prop out and the component shows a neutral message.
- Do not restyle the components with hardcoded colors or fonts. They read the
  app's shadcn theme variables (`--primary`, `--muted`, `--foreground`,
  `--background`, `--border`, `--radius`); change the theme instead.
- All text can be replaced or translated with `CrateProvider` or each
  component's `labels` prop. Do not edit the component files to change text.

## 3. Install

{{install}}

## 4. Wire It to the Stream

{{wiring}}

To change text or language for every component, wrap the app (or the chat) in
`CrateProvider`:

```tsx
{{provider}}
```

## 5. Verify

- Build the app (`npm run build` or the project's equivalent) and fix any type
  errors.
- Send a message and watch the states change: thinking, then streaming (and
  tool, reasoning, or sources if the backend sends them), then done.
- Stop the server mid-answer: the error state should appear with a retry
  button. If the stream pauses, the stalled state appears after five seconds.
- With reduced motion turned on in the operating system, nothing should
  animate.

## Reference

- Every component, prop, and label: {{site}}/llms.txt
- Registry index: {{site}}/r/registry.json
