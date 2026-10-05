// Shared helpers: run events through the SSE round trip and the reducer, and
// ask the real useAgentStatus hook which state it would show for each step.
import { createRequire } from "node:module";
import {
  agentEventsFromSSE,
  agentEventsToSSE,
  initialAgentStreamState,
  reduceAgentStream,
  type AgentStreamEvent,
  type AgentStreamState,
} from "../../lib/agent-stream";
import { useAgentStatus } from "../../hooks/use-agent-status";

// The hook resolves React from crate/node_modules; render with that same copy.
const crateRequire = createRequire(new URL("../../package.json", import.meta.url));
const React = crateRequire("react") as typeof import("react");
const { renderToStaticMarkup } = crateRequire("react-dom/server") as typeof import("react-dom/server");

export async function collect<T>(source: AsyncIterable<T>) {
  const items: T[] = [];
  for await (const item of source) items.push(item);
  return items;
}

/** The state useAgentStatus shows for one stream state (no stall timing involved). */
export function shownState(state: AgentStreamState) {
  let shown = "";
  function Probe() {
    shown = useAgentStatus(state).state;
    return null;
  }
  renderToStaticMarkup(React.createElement(Probe));
  return shown;
}

/**
 * Sends events through the full path a browser sees: encoded as server-sent
 * events, decoded, reduced. Returns the state useAgentStatus shows after each
 * event, with repeats collapsed.
 */
export async function shownStates(events: AsyncIterable<AgentStreamEvent>) {
  let state = reduceAgentStream(initialAgentStreamState, { type: "request" });
  const shown = [shownState(state)];
  for await (const event of agentEventsFromSSE(agentEventsToSSE(events))) {
    state = reduceAgentStream(state, event);
    const next = shownState(state);
    if (next !== shown.at(-1)) shown.push(next);
  }
  return { shown, state };
}

export async function* fromArray<T>(items: T[]) {
  for (const item of items) yield item;
}
