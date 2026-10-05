// The LangChain adapter, against real streamEvents output from a LangGraph
// graph and a LangChain chain, with LangChain's fake chat models in place of
// a provider.
import assert from "node:assert/strict";
import { test } from "node:test";
import { AIMessageChunk } from "@langchain/core/messages";
import { RunnableLambda } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import { FakeListChatModel, FakeStreamingChatModel } from "@langchain/core/utils/testing";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { agentStreamText } from "../../lib/agent-stream";
import { fromLangChain } from "../../lib/agent-stream-langchain";
import { collect, shownStates } from "./helpers";

const searchDocs = tool(async ({ query }) => `Found results for ${query}.`, {
  name: "searchDocs",
  description: "Search the docs.",
  schema: z.object({ query: z.string() }),
});

// A graph that searches with a tool, then answers with a streaming model that
// reasons first (a standard reasoning content block) and then writes text.
function buildGraph() {
  const model = new FakeStreamingChatModel({
    chunks: [
      new AIMessageChunk({ content: [{ type: "reasoning", reasoning: "The docs mention a stall state." }] }),
      new AIMessageChunk({ content: "Use " }),
      new AIMessageChunk({ content: [{ type: "text", text: "Stalled." }] }),
    ],
  });
  const State = Annotation.Root({ question: Annotation<string>(), notes: Annotation<string>(), reply: Annotation<string>() });
  return new StateGraph(State)
    .addNode("search", async (state, config) => ({ notes: await searchDocs.invoke({ query: state.question }, config) }))
    .addNode("respond", async (state, config) => ({ reply: String((await model.invoke(state.notes, config)).content) }))
    .addEdge(START, "search")
    .addEdge("search", "respond")
    .addEdge("respond", END)
    .compile();
}

test("a LangGraph run becomes tool, reasoning, text, and done events", async () => {
  const events = await collect(fromLangChain(buildGraph().streamEvents({ question: "stall" }, { version: "v2" })));
  const toolStart = events.find((event) => event.type === "tool-start");
  assert.ok(toolStart && toolStart.type === "tool-start");
  assert.deepEqual(events, [
    { type: "tool-start", id: toolStart.id, name: "searchDocs" },
    { type: "tool-end", id: toolStart.id },
    { type: "reasoning", delta: "The docs mention a stall state." },
    { type: "text", delta: "Use " },
    { type: "text", delta: "Stalled." },
    { type: "done" },
  ]);
});

test("useAgentStatus follows the graph through every state", async () => {
  const { shown, state } = await shownStates(fromLangChain(buildGraph().streamEvents({ question: "stall" }, { version: "v2" })));
  assert.deepEqual(shown, ["thinking", "tool", "thinking", "reasoning", "streaming", "done"]);
  assert.equal(agentStreamText(state), "Use Stalled.");
});

test("a plain chain with a string-streaming model works too", async () => {
  const model = new FakeListChatModel({ responses: ["Hi there"] });
  const chain = RunnableLambda.from(async (question: string, config) => model.invoke(question, config));
  const events = await collect(fromLangChain(chain.streamEvents("Hello", { version: "v2" })));
  assert.equal(events.filter((event) => event.type === "text").map((event) => (event.type === "text" ? event.delta : "")).join(""), "Hi there");
  assert.deepEqual(events.at(-1), { type: "done" });
});

test("a failing tool marks the tool as failed, and a failing run ends in the error state", async () => {
  const broken = tool(async () => { throw new Error("Search is down"); }, { name: "searchDocs", description: "Search.", schema: z.object({ query: z.string() }) });
  const chain = RunnableLambda.from(async (question: string, config) => broken.invoke({ query: question }, config));
  const events = await collect(fromLangChain(chain.streamEvents("stall", { version: "v2" })));
  const end = events.find((event) => event.type === "tool-end");
  assert.ok(end && end.type === "tool-end" && end.error === true, `expected a failed tool-end, got ${JSON.stringify(events)}`);
  assert.equal(events.at(-1)?.type, "error");
  const { shown } = await shownStates(fromLangChain(chain.streamEvents("stall", { version: "v2" })));
  assert.equal(shown.at(-1), "error");
});

test("Anthropic thinking blocks count as reasoning", async () => {
  const events = await collect(
    fromLangChain(
      (async function* () {
        yield { event: "on_chat_model_stream", data: { chunk: { content: [{ type: "thinking", thinking: "Hmm." }, { type: "text", text: "Yes." }] } } };
      })(),
    ),
  );
  assert.deepEqual(events, [{ type: "reasoning", delta: "Hmm." }, { type: "text", delta: "Yes." }, { type: "done" }]);
});
