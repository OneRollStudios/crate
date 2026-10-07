// Renders every component with its docs sample props. Bundled twice by
// test/parity.mjs: once with React, once with react aliased to preact/compat.
import { renderToStaticMarkup } from "react-dom/server";
import * as Crate from "../../components/agent-wait-states";
import { samples } from "../../app/docs/samples";
import { specs } from "../src/generated/specs";

const noop = () => {};
const out: Record<string, string> = {};
for (const spec of specs) {
  const Component = (Crate as unknown as Record<string, (props: Record<string, unknown>) => React.ReactNode>)[spec.component];
  const props: Record<string, unknown> = { ...(samples[spec.tag.slice(6)] ?? {}) };
  for (const prop of Object.keys(spec.events)) props[prop] = noop;
  // Every state AgentState renders, not just the sample's.
  const states = spec.component === "AgentState" ? ["thinking", "reasoning", "sources", "tool", "plan", "approval", "queue", "file", "streaming", "stalled", "error", "done"] : [null];
  for (const state of states) {
    const key = state ? `${spec.tag}[${state}]` : spec.tag;
    out[key] = renderToStaticMarkup(<Component {...props} {...(state ? { status: state } : {})} />);
  }
}
console.log(JSON.stringify(out));
