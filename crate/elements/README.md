# Crate Elements

Crate's wait states for AI products as Web Components: `<crate-thinking>`, `<crate-tool-call>`, `<crate-agent-state>`, and the rest. They work in Vue, Svelte, Angular, plain HTML, or any other framework. They are built from the same source as Crate's React components, follow your app's theme, and need no build step.

## Install

```bash
npm install @onerollstudios/crate-elements
```

```js
import "@onerollstudios/crate-elements"; // defines every <crate-*> element
```

Or with a script tag, no build step:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@onerollstudios/crate-elements/dist/index.js"></script>
```

## Use

```html
<crate-agent-state status="thinking"></crate-agent-state>

<script type="module">
  const state = document.querySelector("crate-agent-state");
  state.setAttribute("tool-name", "searchDocs");
  state.status = "tool"; // or the snapshot object from your status logic
  state.addEventListener("crate-retry", () => sendAgain());
</script>
```

| Element | React component |
| --- | --- |
| `<crate-agent-state>` | `AgentState`: shows the right component for each state |
| `<crate-thinking>` | `Thinking` |
| `<crate-reasoning-trace>` | `ReasoningTrace` |
| `<crate-sources>` | `Sources` |
| `<crate-tool-call>` | `ToolCall` |
| `<crate-agent-plan>` | `AgentPlan` |
| `<crate-approval>` | `Approval` |
| `<crate-queue>` | `Queue` |
| `<crate-file-processing>` | `FileProcessing` |
| `<crate-streaming>` | `Streaming` |
| `<crate-stalled>` | `Stalled` |
| `<crate-error>` | `ErrorState` |
| `<crate-done>` | `Done` |
| `<crate-provider>` | `CrateProvider`: labels and locale for every element inside it |

Each element takes the same props as its React component, documented at [crate.onerollstudios.com/docs](https://crate.onerollstudios.com/docs/):

- **Text, number, and true/false props are attributes,** in kebab case: `tool-name="searchDocs"`, `elapsed-ms="9000"`, `accent`.
- **Every prop is also a JS property,** in camel case: `element.toolName = "searchDocs"`. Lists and objects are properties only: `sources.sources = [...]`, `plan.steps = [...]`, `element.labels = {...}`. So is `title` on `<crate-approval>`, so it never doubles as the browser's tooltip.
- **Callbacks are events** that bubble and cross the shadow boundary (`composed`):

| Event | React prop | Fired by |
| --- | --- | --- |
| `crate-retry` | `onRetry` | `<crate-error>`, `<crate-agent-state>` |
| `crate-cancel` | `onCancel` | `<crate-thinking>`, `<crate-agent-state>` |
| `crate-approve` | `onAllow` | `<crate-approval>`, `<crate-agent-state>` |
| `crate-deny` | `onDeny` | `<crate-approval>`, `<crate-agent-state>` |

## Theme

The elements read the same CSS variables as shadcn and Crate's React components: `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--foreground`, `--background`, `--border`, `--destructive`, and `--radius`. Set them on `:root` (or any ancestor) and every element follows them. Without them, the elements use shadcn's default theme. The font comes from your page.

Each element renders in a shadow root, so your page's styles don't leak in. To restyle a piece, use `::part()`:

| Part | What |
| --- | --- |
| `container` | The component's outer box |
| `button` | Every button (Retry, Cancel, Allow, Deny, Show thinking) |
| `icon` | Decorative icons |

```css
crate-error::part(button) { border-radius: 999px; }
crate-tool-call::part(container) { box-shadow: none; }
```

## Labels and Languages

```html
<crate-provider locale="fr">
  <crate-thinking></crate-thinking>
</crate-provider>

<script type="module">
  document.querySelector("crate-provider").labels = { thinking: "Réflexion…" };
</script>
```

Any element also takes its own `labels` property. The label keys are the same as in React; see [CrateProvider](https://crate.onerollstudios.com/docs/crate-provider/).

## Frameworks

**Vue:** tell the compiler that `crate-` tags are custom elements, then bind as usual. Vue sets known props as properties.

```js
// vite.config.js
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("crate-") } } })
```

```vue
<crate-agent-state :status="status" tool-name="searchDocs" @crate-retry="retry" />
<crate-agent-plan :steps.prop="steps" />
```

**Other frameworks:** the elements are standard custom elements. Pass lists and objects as properties, and listen for the `crate-` events the way your framework listens to any DOM event. Plain HTML and Vue are tested on every change.

## Same Rules as React

The elements are the React components, rendered with Preact's React-compatible runtime: the same markup, text, roles, and `aria-live` regions (a parity test checks every component), real buttons with visible focus, and no animation with `prefers-reduced-motion`.

## Develop

```bash
npm install
npm run build       # dist/index.js; run npm run build in crate/ first
npm run typecheck
npm test            # parity with React, and a plain HTML page in Chromium
npm run test:vue    # a fresh Vite + Vue app (needs network access)
```

`scripts/build.mjs` generates each element's attributes, properties, and events from `crate/lib/docs.generated.json`, the same prop data as the docs, and fails if the bundle grows past its size budget.
