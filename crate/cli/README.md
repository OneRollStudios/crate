# Crate CLI

Sets up [Crate](https://crate.onerollstudios.com) in a React AI app with one command.

```bash
npx @onerollstudios/crate init
```

Not on npm yet. Until it is, run it from a clone of this repository:
`node crate/cli/bin/crate.mjs init --cwd path/to/your/app` (after `npm install` in `crate/cli`).

It looks at the app first, then shows a plan and asks before changing anything:

| It detects | From |
| --- | --- |
| Framework (Next.js App Router, Vite) | `package.json` and the app's files |
| shadcn setup, CSS file, and import alias | `components.json` |
| Theme variables Crate's components read | the app's CSS: `:root`, `.dark`, and `@theme` |
| AI stack (Vercel AI SDK, OpenAI Agents SDK, LangChain or LangGraph, or none) | `package.json` |
| Language | `<html lang>` in the root layout or `index.html` |

Then, once you confirm:

1. If shadcn isn't set up, it runs `npx shadcn@latest init --defaults`.
2. It installs Crate (`all`) and the adapter for the detected stack with `npx shadcn@latest add`.
3. It adds any theme variables Crate needs that the app doesn't define, in one marked block. Variables the app already has are never changed. Where the app has a matching Tailwind color (for example `--color-primary`), the new variable points to it.
4. It wraps the app in `CrateProvider` (with `locale` when the page isn't in English) in `app/layout.tsx` or `src/main.tsx`. It edits with the TypeScript compiler, and leaves any file it doesn't recognize alone, printing the lines to add instead.
5. It prints what changed and the code to connect the components to the app's AI stream.

It never edits your chat code: the [Crate agent skill](https://crate.onerollstudios.com/llms.txt) helps coding agents with that.

## Options

| Option | |
| --- | --- |
| `-y`, `--yes` | Apply the plan without asking (for agents and CI) |
| `--dry-run` | Show the plan and change nothing |
| `--cwd <dir>` | The app's folder |
| `--registry <url>` | Where to install Crate from |

It warns when the folder has uncommitted git changes, so you can commit first for an easy undo.

## Development

```bash
npm install
npm test            # fixture apps, with a fake npx; compares output with test/expected
UPDATE=1 npm test   # accept a deliberate change to what crate init prints
npm run wiring      # after changing the README examples crate init prints
```

The end-to-end run (real `shadcn init` and `add`, then a build and a browser check) is `bash scripts/install-test.sh init` from `crate/`.
