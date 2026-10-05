# Proposal: `crate init` (#14)

Status: proposal, waiting for approval. Nothing here is built yet.

## Goal

From #14: one command detects the app's framework and Tailwind/shadcn theme,
installs crate and the provider configured for the app, and says clearly what
changed.

## What It Detects

| What | How |
| --- | --- |
| Framework, Tailwind version, CSS file, `src/`, import alias | `npx shadcn info`, which already reports these (checked with shadcn 3.8.5) |
| shadcn set up? | `components.json` exists |
| Theme | The CSS variables crate reads (`--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--foreground`, `--background`, `--border`, `--destructive`, `--radius`) in the Tailwind CSS file, for light (`:root`) and dark (`.dark`) |
| AI stack | `package.json`: `ai` and `@ai-sdk/react` → AI SDK (`useChat`); `@openai/agents` → OpenAI Agents adapter; `@langchain/*` → LangChain adapter; none of these → `agent-stream` (raw SSE) |
| Language | `<html lang>` in the root layout, for `CrateProvider`'s `locale` |

## What It Does

1. **Shows a plan first.** It lists every command it will run and every file it
   will create or change, then asks to continue. `--yes` skips the question for
   agents and CI; `--dry-run` prints the plan only. It warns when the git
   working tree has uncommitted changes.
2. **Installs.** Runs `npx shadcn add` for `all.json` plus the adapter for the
   detected stack.
3. **Theme.** If every variable crate reads exists, it changes nothing: the
   components already follow the app's theme. If some are missing (a Tailwind
   app that isn't fully shadcn), it adds them in one clearly marked CSS block,
   using values from the app's own Tailwind colors where they map one to one,
   and lists any it had to fill with shadcn's defaults. It never changes
   variables that already exist.
4. **Provider.** Wraps the app in `CrateProvider` (with `locale` when `<html
   lang>` isn't English) in the root file it understands: `app/layout.tsx` for
   the Next.js App Router, `src/main.tsx` for Vite. It edits with the TypeScript
   compiler API, not text search. If the file doesn't match a shape it knows, it
   leaves the file alone and prints the exact lines to add.
5. **Reports.** Prints what it detected, each file created or changed, and the
   wiring snippet for the detected stack (the same examples as the README), as
   the next step.

It does not wire the chat itself: that code lives in the developer's own
components, and changing it automatically is too easy to get wrong. The agent
skill proposed in #12 covers wiring.

## Apps Without shadcn

shadcn is required (crate installs through it). If `components.json` is
missing, `crate init` says so and offers to run `npx shadcn init` first, as part
of the plan. It never runs it silently.

## Distribution

`crate` is taken on npm (an empty 0.0.0 package), so the command would be:

```bash
npx @onerollstudios/crate init
```

This needs an `@onerollstudios` npm organization and a publish token in the
repo's secrets, which is work only a person can do. The CLI would live in a new
`cli/` folder with its own `package.json`, kept separate from the site.

## How It Would Be Tested

Fixture apps built in CI from the same steps as the install tests:

- Next.js with default shadcn: provider added, no CSS changes, AI SDK detected.
- Next.js with the custom theme from the themed host test: theme left as is.
- Vite + React: `src/main.tsx` edited.
- A Tailwind app missing some variables: the marked block added, existing
  variables untouched.
- A root file in an unknown shape: left alone, instructions printed.
- Each with each AI stack in `package.json`: the right adapter installed.

After `crate init`, each fixture must build, and the existing stream and theme
checks must pass in it. Every run's output is compared with expected output, so
changes to what it prints are deliberate.

## Questions for You

1. Package name `@onerollstudios/crate`? It needs the npm org and a token
   (a `human` task I'd open).
2. Is a plan-then-confirm flow right, with `--yes` for agents?
3. Should it offer to run `npx shadcn init` for apps without shadcn, or only
   explain how?
