# Latent

The interface layer for AI-native products — a **React + TypeScript** component
library of the primitives generic UI kits skip, plus a marketing site that
showcases every one of them live.

Built faithfully against the original Latent design system (tokens, type scale,
and the real `Bricolage Grotesque` / `Hanken Grotesk` / `Spline Sans Mono`
fonts), with first-class light + dark modes.

## Getting started

```bash
npm install
npm run dev      # marketing showcase at http://localhost:5173
npm run build    # typecheck + production bundle → dist/
```

## The components

Import from the `@latent` entry point:

```tsx
import {
  PromptComposer,
  StreamingReply,
  ReasoningTrace,
  ToolCall,
  Citations,
  ModelPicker,
  TokenMeter,
  AgentTimeline,
  DiffSuggestion,
  CommandPalette,
  Guardrail,
  Feedback,
  ConversationThread,
  Message,
  useTheme,
  useCommandPalette,
} from '@latent'
```

| Code | Component | What it is |
| --- | --- | --- |
| CMP-004 | `PromptComposer` | Auto-growing multiline input, Enter-to-send, busy/stop state, toolbar slot |
| CMP-011 | `StreamingReply` | Token-by-token reveal with caret; respects reduced-motion; can loop |
| CMP-018 | `ReasoningTrace` | Collapsible chain-of-thought with live pulse and per-step timing |
| CMP-023 | `ToolCall` | Function + args, run-state chip, payload preview |
| CMP-027 | `Citations` | Inline source chips with hover previews |
| CMP-031 | `ModelPicker` | Segmented model selector with context/pricing meta |
| CMP-038 | `TokenMeter` | Context fill with warning threshold and cost readout |
| CMP-044 | `AgentTimeline` | Multi-step run: plan → actions → outcomes |
| CMP-052 | `DiffSuggestion` | Accept/reject block for AI-proposed edits |
| CMP-057 | `CommandPalette` | ⌘K launcher, grouped, full keyboard nav (`useCommandPalette` hook) |
| CMP-061 | `Guardrail` | On-brand refusal / safe-completion with retry |
| CMP-066 | `Feedback` | Thumbs, regenerate, copy for eval capture |
| — | `ConversationThread` + `Message` | Composite shell that frames a thread |

## Theming

All visual values live as CSS variables in `src/lib/tokens/tokens.css`. Color
mode is driven by `data-theme` on `<html>` (falling back to the OS preference);
`useTheme()` toggles and persists it. Retheme the whole kit by overriding a
handful of `--lt-*` variables.

## Project layout

```
src/
  lib/            ← the publishable component library (import via @latent)
    components/   ← one file per primitive + shared components.css
    tokens/       ← design tokens + @font-face
    hooks/        ← useTheme
    utils/        ← cn
    index.ts      ← public API barrel
  site/           ← marketing showcase styles
  App.tsx         ← the landing page, built from the real components
public/fonts/     ← the six woff2 faces
```
