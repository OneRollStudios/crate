# Crate: rules for agents

## What this is
Crate is a growing library of ready-made UI components for AI products, made by
One Roll Studios. Developers install components with one shadcn command or ask
their coding agent to add them. Crate #1 is "wait states": 12 components for the
moments while an AI app is working, plus the useAgentStatus() hook and the
AgentState wrapper that switch between them automatically.
Live site: crate.onerollstudios.com (Cloudflare Pages, deploys from main).
Read ROADMAP.md for direction.

## Repo layout
- crate/ : the Next.js app (static export). All work happens here.
- crate/components/agent-wait-states/ : the components people install.
- crate/hooks/use-agent-status.ts : the hook.
- crate/registry.json and crate/public/r/ : the shadcn registry (generated).
- crate/app/ : the landing page.
- archive/ : old explorations. Never edit.

## Commands (run inside crate/)
- npm install
- npm run build : must pass before any commit (builds registry + static site)
- node scripts/visual-check.mjs : screenshots at desktop and mobile, light and dark

## How to work
- One task = one branch = one pull request. Never push straight to main
  (only exception: when the task explicitly says to commit to main).
- Branch names: feat/..., fix/..., design/..., docs/...
- Every PR description says: what changed, why, how you checked it, and what
  you could NOT check.
- Design, layout, or copy changes: attach screenshots and label the PR
  "needs-review". A human approves these on the Cloudflare preview link.
- Pure code, infra, or docs changes with passing checks: label "auto-merge".
- Keep PRs small. If a task grows, stop and split it.

## Component rules (the installable components)
- Never hardcode brand styles inside components. Use shadcn theme variables
  (--primary, --muted, --foreground, --background, --border, --radius) and
  theme-driven classes (rounded-lg, rounded-md, rounded-sm).
- One Roll Studios styling (fonts, colors, 2px/6px radii) lives ONLY in the
  landing page theme (crate/theme.css), never in components.
- No hardcoded user-facing text in components once CrateProvider exists:
  all labels must be overridable.
- Every animation has a prefers-reduced-motion fallback.
- Accessible: real buttons, visible focus states, aria-live for state changes.
- Every state must reflect what is really happening. No fake progress.
- After changing a component, rebuild the registry so public/r/ matches.

## Landing page rules
- Match the One Roll Studios look: Inter Display (headings), Inter (body),
  system monospace for code only, colors from crate/theme.css.
- One job per section. Do not repeat the same component demo in several sections.
- Works at 390px wide with no sideways scrolling. Text contrast at least 4.5:1.
- Keep the copy casing already used on the live page unless a task says otherwise.

## Copy rules
These apply to public-facing copy: the website and the README's marketing
sections. Internal docs (ROADMAP.md, issues, PR descriptions) can name tools
and companies when it's useful. The em dash rule applies everywhere.
- Never invent stats, testimonials, customer logos, or scenarios.
- Never name other companies or products to sell crate.
- Never promise "free forever". Paid crates are coming.
- No em dashes anywhere.
- Do not rewrite copy unless the task asks for it.

## Never do
- Never edit archive/.
- Never run npm audit fix --force or upgrade major versions unless the task says so.
- Never commit node_modules/, .next/, out/, or secrets.
- Never delete or rewrite git history.
