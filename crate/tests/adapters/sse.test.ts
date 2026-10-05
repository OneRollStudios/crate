// The raw SSE adapter and the shared core: parsing, encoding, and the reducer.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agentEventsFromSSE,
  agentStreamText,
  readSSE,
  type AgentStreamEvent,
  type SSEMessage,
} from "../../lib/agent-stream";
import { collect, fromArray, shownStates } from "./helpers";

// A body delivered in uneven network chunks, split mid-line and mid-character.
function body(text: string, sizes = [3, 7, 1, 11, 5]) {
  const bytes = new TextEncoder().encode(text);
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let at = 0;
      for (let i = 0; at < bytes.length; i++) {
        const size = sizes[i % sizes.length];
        controller.enqueue(bytes.slice(at, at + size));
        at += size;
      }
      controller.close();
    },
  });
}

test("readSSE follows the SSE format across chunk boundaries", async () => {
  const text = ": comment\nevent: delta\nid: 1\ndata: Héllo\ndata: world\n\ndata:no space\r\n\r\nretry: 1000\n\ndata: last";
  const messages = await collect(readSSE(body(text)));
  assert.deepEqual(messages, [
    { event: "delta", id: "1", data: "Héllo\nworld" },
    { data: "no space" },
    { data: "last" },
  ] satisfies SSEMessage[]);
});

test("raw SSE: a custom mapper reads any server's format", async () => {
  // A chat-completions style stream, as many servers send it.
  const text = [
    'data: {"choices":[{"delta":{"content":"Hel"}}]}',
    'data: {"choices":[{"delta":{"content":"lo"}}]}',
    "data: [DONE]",
    "",
  ].join("\n\n");
  const events = await collect(
    agentEventsFromSSE(body(text), (message) => {
      if (message.data === "[DONE]") return { type: "done" };
      const delta = JSON.parse(message.data).choices[0].delta.content;
      return delta ? { type: "text", delta } : null;
    }),
  );
  assert.deepEqual(events, [
    { type: "text", delta: "Hel" },
    { type: "text", delta: "lo" },
    { type: "done" },
  ]);
});

test("raw SSE: the default mapper treats plain data as text and ends the stream", async () => {
  const events = await collect(agentEventsFromSSE(body("data: plain words\n\n")));
  assert.deepEqual(events, [{ type: "text", delta: "plain words" }, { type: "done" }]);
});

test("every event type drives useAgentStatus through the right states", async () => {
  const events: AgentStreamEvent[] = [
    { type: "reasoning", delta: "Thinking it over." },
    { type: "source", title: "Docs", url: "https://example.com/docs" },
    { type: "tool-start", id: "1", name: "searchDocs" },
    { type: "tool-end", id: "1" },
    { type: "text", delta: "Here " },
    { type: "text", delta: "it is." },
    { type: "done" },
  ];
  const { shown, state } = await shownStates(fromArray(events));
  assert.deepEqual(shown, ["thinking", "reasoning", "sources", "tool", "sources", "streaming", "done"]);
  assert.equal(agentStreamText(state), "Here it is.");
});

test("an error event shows the error state", async () => {
  const { shown, state } = await shownStates(fromArray<AgentStreamEvent>([{ type: "text", delta: "Hi" }, { type: "error", message: "Rate limited" }]));
  assert.deepEqual(shown, ["thinking", "streaming", "error"]);
  assert.equal(state.error?.message, "Rate limited");
});

test("a source that throws becomes an error event on the wire", async () => {
  async function* failing(): AsyncGenerator<AgentStreamEvent> {
    yield { type: "text", delta: "Hi" };
    throw new Error("Upstream closed");
  }
  const { shown, state } = await shownStates(failing());
  assert.deepEqual(shown, ["thinking", "streaming", "error"]);
  assert.equal(state.error?.message, "Upstream closed");
});

test("a tool without an end event finishes when text resumes", async () => {
  const { shown } = await shownStates(fromArray<AgentStreamEvent>([
    { type: "tool-start", id: "web", name: "web_search" },
    { type: "text", delta: "Found it." },
    { type: "done" },
  ]));
  assert.deepEqual(shown, ["thinking", "tool", "streaming", "done"]);
});
