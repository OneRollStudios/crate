// The OpenAI Agents SDK adapter, against a real streamed run of the SDK's
// runner with a scripted model in place of the OpenAI API.
import assert from "node:assert/strict";
import { test } from "node:test";
import { Agent, run, setTracingDisabled, tool, type Model } from "@openai/agents";
import { z } from "zod";
import { agentStreamText } from "../../lib/agent-stream";
import { fromOpenAIAgents } from "../../lib/agent-stream-openai-agents";
import { collect, shownStates } from "./helpers";

setTracingDisabled(true);

const usage = { requests: 1, inputTokens: 1, outputTokens: 1, totalTokens: 2 };

// Turn 1: reasoning and a tool call. Turn 2: the answer, streamed as deltas.
function scriptedModel({ failOnTurn }: { failOnTurn?: number } = {}): Model {
  let turn = 0;
  return {
    async getResponse() {
      throw new Error("This test only streams.");
    },
    async *getStreamedResponse() {
      turn += 1;
      if (turn === failOnTurn) throw new Error("Model unavailable");
      yield { type: "response_started" };
      if (turn === 1) {
        yield {
          type: "response_done",
          response: {
            id: "response-1",
            usage,
            output: [
              { type: "reasoning", id: "reasoning-1", content: [{ type: "input_text", text: "Check the docs first." }] },
              { type: "function_call", id: "item-1", callId: "call-1", name: "searchDocs", status: "completed", arguments: JSON.stringify({ query: "stall" }) },
            ],
          },
        };
        return;
      }
      for (const delta of ["Use ", "Stalled."]) yield { type: "output_text_delta", delta };
      yield {
        type: "response_done",
        response: {
          id: "response-2",
          usage,
          output: [{ type: "message", id: "message-1", role: "assistant", status: "completed", content: [{ type: "output_text", text: "Use Stalled." }] }],
        },
      };
    },
  } as Model;
}

const searchDocs = tool({
  name: "searchDocs",
  description: "Search the docs.",
  parameters: z.object({ query: z.string() }),
  execute: async ({ query }) => `Found results for ${query}.`,
});

test("a streamed run becomes reasoning, tool, text, and done events", async () => {
  const agent = new Agent({ name: "Helper", instructions: "Help.", model: scriptedModel(), tools: [searchDocs] });
  const events = await collect(fromOpenAIAgents(await run(agent, "Which component fits a stall?", { stream: true })));
  assert.deepEqual(events, [
    { type: "reasoning", delta: "Check the docs first." },
    { type: "tool-start", id: "call-1", name: "searchDocs" },
    { type: "tool-end", id: "call-1", error: false },
    { type: "text", delta: "Use " },
    { type: "text", delta: "Stalled." },
    { type: "done" },
  ]);
});

test("useAgentStatus follows the run through every state", async () => {
  const agent = new Agent({ name: "Helper", instructions: "Help.", model: scriptedModel(), tools: [searchDocs] });
  const { shown, state } = await shownStates(fromOpenAIAgents(await run(agent, "Which component fits a stall?", { stream: true })));
  assert.deepEqual(shown, ["thinking", "reasoning", "tool", "reasoning", "streaming", "done"]);
  assert.equal(agentStreamText(state), "Use Stalled.");
});

test("a failing model run ends in the error state", async () => {
  const agent = new Agent({ name: "Helper", instructions: "Help.", model: scriptedModel({ failOnTurn: 2 }), tools: [searchDocs] });
  const { shown, state } = await shownStates(fromOpenAIAgents(await run(agent, "Which component fits a stall?", { stream: true })));
  assert.equal(shown.at(-1), "error");
  assert.match(state.error?.message ?? "", /Model unavailable/);
});

test("reasoning summary deltas are used once, not repeated by the finished item", async () => {
  const events = await collect(
    fromOpenAIAgents(
      (async function* () {
        yield { type: "raw_model_stream_event", data: { type: "response_started" } };
        yield { type: "raw_model_stream_event", data: { type: "model", event: { type: "response.reasoning_summary_text.delta", delta: "Weighing " } } };
        yield { type: "raw_model_stream_event", data: { type: "model", event: { type: "response.reasoning_summary_text.delta", delta: "options." } } };
        yield { type: "run_item_stream_event", name: "reasoning_item_created", item: { type: "reasoning_item", rawItem: { type: "reasoning", content: [{ type: "input_text", text: "Weighing options." }] } } };
        yield { type: "raw_model_stream_event", data: { type: "output_text_delta", delta: "Done." } };
      })(),
    ),
  );
  assert.deepEqual(events, [
    { type: "reasoning", delta: "Weighing " },
    { type: "reasoning", delta: "options." },
    { type: "text", delta: "Done." },
    { type: "done" },
  ]);
});
