# Using @latent/react

Latent ships as a normal React + TypeScript package: import a component, render it,
pass props. Everything is typed and themeable.

## 1. Build / install

Inside this repo the components are consumed directly via the `@latent` path alias
(that's what the marketing site does). To use them in **another** project:

```bash
# from the latent/ folder — produces the distributable in dist-lib/
npm run build:lib
```

That emits:

```
dist-lib/
  latent.js        # ESM bundle (React is a peer dependency, not bundled)
  latent.css       # all component styles + design tokens + @font-face
  index.d.ts       # full type declarations
  fonts/           # the six woff2 faces
```

Then install it into your app (any of these work):

```bash
npm install /path/to/latent            # local path
# or `npm pack` here and install the tarball
# or publish to a registry and `npm install @latent/react`
```

`react` and `react-dom` (>=18) are **peer dependencies** — your app provides them.

## 2. Import the styles once

At your app entry (e.g. `main.tsx`):

```ts
import '@latent/react/styles.css'
```

> **Fonts:** `latent.css` references the faces at `/fonts/*.woff2`. Copy
> `dist-lib/fonts/` into your app's public root (so they're served at `/fonts/…`),
> or override the `--lt-*` font variables to use your own. Without this you still
> get the correct layout, just fallback system fonts.

## 3. Use the components

```tsx
import {
  PromptComposer,
  StreamingReply,
  ReasoningTrace,
  ToolCall,
  TokenMeter,
} from '@latent/react'

export function Chat() {
  return (
    <>
      <ReasoningTrace
        summary="reasoning · 3 steps"
        live
        steps={[
          { label: 'plan', duration: '0.2s' },
          { label: 'retrieve', duration: '0.6s' },
        ]}
      />
      <ToolCall name="retrieve" args={'"q3_board_deck.pdf"'} state="done" />
      <StreamingReply text="Here's the summary you asked for…" />
      <TokenMeter used={1240} max={8000} cost="$0.04" />
      <PromptComposer placeholder="Ask anything…" onSubmit={(text) => send(text)} />
    </>
  )
}
```

## 4. Theming

Color mode is driven by `data-theme="light" | "dark"` on `<html>` (it falls back to
the OS preference). The `useTheme()` hook toggles and persists it:

```tsx
import { useTheme } from '@latent/react'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return <button onClick={toggle}>{theme === 'dark' ? '☾' : '☀'}</button>
}
```

Retheme the whole kit by overriding a few CSS variables anywhere in your styles:

```css
:root {
  --lt-accent: #6b8cff;     /* your brand */
  --lt-bg: #0b0d12;
}
```

## Component reference

| Import | What it is |
| --- | --- |
| `PromptComposer` | Auto-growing input, Enter-to-send, busy/stop, toolbar slot |
| `StreamingReply` | Token-by-token reveal; respects reduced-motion; `loop` for demos |
| `ReasoningTrace` | Collapsible chain-of-thought with live pulse + step timing |
| `ToolCall` | Function, args, run-state chip, payload preview |
| `Citations` | Inline source chips with hover previews |
| `ModelPicker` | Segmented model selector with context/pricing meta |
| `TokenMeter` | Context fill with warning threshold + cost |
| `AgentTimeline` | Multi-step run — plan → actions → outcomes |
| `DiffSuggestion` | Accept/reject block for AI-proposed edits |
| `CommandPalette` + `useCommandPalette` | ⌘K launcher, grouped, keyboard nav |
| `Guardrail` | On-brand refusal / safe-completion with retry |
| `Feedback` | Thumbs, regenerate, copy |
| `ConversationThread` + `Message` | Composite that frames a thread |
| `useTheme` | Light/dark control | 
| `cn` | Tiny className joiner |

Every component and its props are fully typed — your editor will autocomplete them.
