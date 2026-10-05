# Crate CLI

Sets up [Crate](https://crate.onerollstudios.com) in a React AI app with one command.

<!-- Hidden until 0.1.1 is published on npm:
```bash
npx @onerollstudios/crate init
```
-->

The CLI isn't available on npm right now. Until it is, install Crate with shadcn:

```bash
npx shadcn@latest add https://crate.onerollstudios.com/r/all.json
```

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

## Releasing

Releases are staged from GitHub Actions (`.github/workflows/publish-cli.yml`) with npm Trusted Publishing and staged publishing. No npm token is stored anywhere, every version carries npm provenance linking it to this repository and commit, and nothing goes live until a maintainer approves it with 2FA.

1. Bump `version` in `crate/cli/package.json` in a pull request, and merge it.
2. From an up-to-date `main`, push a matching tag: `git tag cli-v0.1.1 && git push origin cli-v0.1.1`.
3. The workflow checks that the tag matches the version, that the version isn't on npm yet, and that the tests pass, then stages the version with `npm stage publish`. The run's summary shows the stage ID.
4. A maintainer approves the staged version on npmjs.com (2FA), or runs `npm stage approve <stage-id>`. Only then can people install it. `npm stage download <stage-id>` fetches the staged tarball to inspect first, and `npm stage reject <stage-id>` discards it.

To check a release without staging anything, run **Publish CLI** from the Actions tab with "dry-run" ticked.
