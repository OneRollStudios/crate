# Proposal: Framework-Agnostic Components via Web Components (#52)

Status: approved. Decisions from review:

- Runtime: `preact/compat`.
- Package: `@onerollstudios/crate-elements`.
- Shadow DOM, with `::part()` on the key pieces (`container`, `button`, `icon`)
  so hosts can restyle them.
- Events, all bubbling and composed: `crate-retry`, `crate-cancel`,
  `crate-approve` (React's `onAllow`), `crate-deny`.
- Consumer tests: plain HTML and Vue.

Built so far: steps 1 and 2 of the plan (every element, `<crate-provider>`,
events, parts, the parity test, both consumer tests, and the size budget),
plus the publish workflow from step 4. Next: the status core (step 3) and the
docs pages (rest of step 4).

## Goal

From #52: every Crate #1 component also ships as a custom element (for example
`<crate-thinking>`), so apps built with Vue, Svelte, Angular, or plain HTML can
use Crate. The elements follow the host's theme variables with no setup, labels
stay overridable, a framework-free status adapter drives them from a stream, and
the same rules apply as in React (reduced motion, real buttons, visible focus,
`aria-live`).

## Recommendation in Short

1. **Build the elements from the React source, unchanged,** using Preact's
   React-compatible runtime (`preact/compat`) inside each element. One source,
   so the two can't drift.
2. **Shadow DOM,** with Crate's own compiled CSS inside it. The theme variables
   still reach the components, because CSS custom properties are inherited
   into shadow roots.
3. **Move the status logic into a framework-free core.** `useAgentStatus`
   becomes a thin React wrapper over it, and the elements use the same core.
4. **Ship as an npm package plus a single-file build for a script tag,**
   published through the same staged Trusted Publishing flow as the CLI.

## What I Checked Before Writing This

A throwaway experiment outside the repo, not committed:

- An esbuild bundle of `AgentState` and `CrateProvider` from
  `components/agent-wait-states`, unchanged, with `react` aliased to
  `preact/compat`, wrapped in a `<crate-agent-state>` element that renders into
  a shadow root:
  - **With Preact:** 43 KB minified, about 15 KB gzipped. This covers every
    component, since `AgentState` imports them all, but not the CSS.
  - **With React and React DOM bundled instead:** 251 KB minified, about 77 KB
    gzipped.
- In Chromium, a plain HTML page with `<crate-agent-state status="thinking">`
  rendered "Thinking…". Changing the `status` and `tool-name` attributes
  switched it to "Running searchDocs…" and then the error state. The
  `aria-live` regions were present inside the shadow root, and there were no
  errors.

Not measured yet: the size of the compiled CSS, and behavior in Vue, Svelte and
Angular. Both are part of the first step below.

## Decisions

### 1. Shadow DOM, Not Light DOM

The components style themselves with Tailwind classes. A non-React host
usually has no Tailwind, or a Tailwind that doesn't scan our files. So the
elements must bring their own CSS:

- **Light DOM:** our CSS would leak into the host page, or the host's CSS
  would break ours. The host would also need Tailwind to see our classes.
  Fragile.
- **Shadow DOM:** each element has its own CSS, compiled at build time from the
  same Tailwind classes the React source uses (only the ones used), and adopted
  into each shadow root through a constructable stylesheet shared by all
  elements. The host's styles can't break it.

Theme variables (`--primary`, `--muted`, `--foreground`, `--background`,
`--border`, `--radius`, and the rest) are inherited into shadow roots, so the
elements match the host's theme exactly as the React components do. When a
variable is missing, the compiled CSS falls back to shadcn's default neutral
theme, so it looks right with no setup.

**What we give up:** the host can't restyle the inside with its own classes.
To allow targeted overrides, each element exposes a few `part`s (for example
`::part(container)` and `::part(button)`), on top of the theme variables.
Fonts are inherited from the host, as in React.

### 2. One Source: the React Components

| Option | Drift risk | Work | Ships |
| --- | --- | --- | --- |
| **React source, compiled with `preact/compat` (recommended)** | None: same files | A build step and thin element wrappers | About 15 KB gzip of JS plus CSS |
| React source, with React bundled | None | Same | About 77 KB gzip |
| Web Components as the source, React wraps them | None, but React users lose the shadcn model of owning editable, Tailwind-styled code | Rewrite all 14 components | Small |
| Two renderers, synced by tests | High: every change made twice | Highest | Small |

The shadcn model, where React users own the component code, is Crate's core,
so the React files stay the source. `preact/compat` is a small, mature
compatibility layer. The components use only standard hooks (`useState`,
`useEffect`, `useMemo`, `useContext`, `createContext`) and `lucide-react`
icons, which the experiment confirmed compile under it.

**Guard against drift:** a parity test renders each component in React and as
an element with the same props, and compares the accessible output: text,
roles, `aria-live`, and buttons. A future change to a component that uses a
React-only API fails this test, not a user's app.

### 3. The Element API

- **Names:** `crate-` plus the registry name: `<crate-thinking>`,
  `<crate-tool-call>`, `<crate-agent-state>`, and so on.
- **Simple props are attributes** in kebab case: `tool-name`, `elapsed-ms`,
  `accent`, `status`.
- **Data props are JS properties:** `element.steps = [...]`,
  `element.sources = [...]`. Every attribute is also a property.
- **Callbacks become DOM events** that bubble out of the shadow root:
  `crate-retry`, `crate-cancel`, `crate-approve`, `crate-deny`. They work in
  every framework, for example `@crate-retry` in Vue or `on:crate-retry` in
  Svelte.
- **Labels and locale:** a `<crate-provider locale="fr">` element, with a
  `labels` property, applies to every Crate element inside it, like
  `CrateProvider`. Each element also takes a `labels` property for its own
  labels.

### 4. A Framework-Free Status Core

Today `useAgentStatus` (React) maps a chat to a state, measures time (stall,
"still thinking", cancel), and `AgentState` holds short states for
`minDisplayMs`. The proposal:

- `createAgentStatus(options)` returns a small store:
  - `update(chat)` takes any chat-like object (`status`, `messages`, `error`);
  - `subscribe(listener)` reports each new snapshot;
  - `destroy()` stops its timers.
  
  It contains all of today's logic, moved out of the hook.
- `useAgentStatus` becomes a thin React wrapper over it, so React behavior
  stays the same. The existing tests (the stream test, the real chat test, and
  lint with the React Compiler rules) must keep passing unchanged.
- `<crate-agent-state>` accepts a snapshot through `element.status = snapshot`,
  or a plain state name through the `status` attribute.
- For apps that stream server-sent events, `connectAgentStream(element, { api })`
  reuses `lib/agent-stream.ts`. The server adapters (OpenAI Agents SDK,
  LangChain) need no changes; they already run outside React.
- With the AI SDK in Vue or Svelte, the app passes its chat object to
  `update()` whenever it changes, for example from a `watch`.

The `minDisplayMs` hold lives in `AgentState`, so the element gets it for free.

### 5. Distribution

The shadcn registry is React-oriented, so the elements ship separately:

- **npm package** `@onerollstudios/crate-elements` (name open for review):
  ESM, with one entry for everything and one per element. Importing it defines
  the elements.
- **A single-file build** for a `<script type="module">` tag, from the same
  package through any npm CDN.
- **Release:** the same Publish CLI pattern. A second trusted publisher on
  npmjs.com for the new package, staged publishing, and a maintainer approves
  each version.
- **Versioning:** the package version follows releases of the components; the
  changelog lists which components changed.

## How It Would Be Tested

- **Parity test (CI):** every component, rendered in React and as an element
  with the same props, gives the same accessible output.
- **Plain HTML consumer test (CI):** a static page using the single-file
  build, driven through every state with a mocked server-sent events stream
  (the same states as `scripts/stream-test.mjs`), including Retry firing
  `crate-retry`.
- **Vue consumer test (CI):** a fresh Vite + Vue app using the npm package and
  `createAgentStatus`, driven through the same states.
- **Theme test:** the existing themed host fixture, applied to the plain HTML
  page; every element must use the host's colors and radius.
- **Rules:** reduced-motion fallbacks (the compiled CSS keeps the
  `motion-safe` and `motion-reduce` variants), keyboard focus on every button
  inside the shadow roots, and `aria-live` announcements, checked in the
  consumer tests.
- **A size budget in CI,** set from the first step's real numbers, so the
  bundle can't grow silently.

## Plan

1. **First step (one PR, needs-review):**
   - the build setup;
   - `<crate-thinking>` and `<crate-agent-state>`;
   - the compiled CSS in shadow DOM;
   - the plain HTML consumer test.
   
   The PR reports the measured JS and CSS sizes, with screenshots in a plain
   page and a themed page. A go or no-go decision follows.
2. **All elements:** `<crate-provider>`, events, and the parity test.
3. **Status core:** `createAgentStatus`, with `useAgentStatus` moved onto it
   with no behavior change, plus `connectAgentStream` and the Vue consumer
   test.
4. **Release:** the package, the publish workflow, and docs. A "Web
   Components" section on each docs page (#15), and the README.

Each step is its own PR.

## Decisions

1. `preact/compat`.
2. `@onerollstudios/crate-elements`.
3. Shadow DOM, with `::part()` on the key pieces.
4. Prefixed events: `crate-retry`, `crate-cancel`, `crate-approve`, `crate-deny`, bubbling and composed.
5. Plain HTML and Vue.
