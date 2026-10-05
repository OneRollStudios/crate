// Adapter for LangChain and LangGraph. Converts the events of
// runnable.streamEvents(input, { version: "v2" }) into AgentStreamEvents. Works
// with chains, agents, and compiled LangGraph graphs. It reads the events by
// shape, so it adds no dependency on LangChain.
import type { AgentStreamEvent } from "./agent-stream";

type ContentBlock = { type?: string; text?: string; reasoning?: string; thinking?: string };

/** The parts of LangChain's StreamEvent this adapter reads. */
export type LangChainStreamEvent = {
  event: string;
  name?: string;
  run_id?: string;
  data?: { chunk?: { content?: string | ContentBlock[] }; error?: unknown };
};

function* contentEvents(content: string | ContentBlock[] | undefined): Generator<AgentStreamEvent> {
  if (typeof content === "string") {
    if (content) yield { type: "text", delta: content };
    return;
  }
  for (const block of content ?? []) {
    if (block.type === "text" && block.text) yield { type: "text", delta: block.text };
    // Standard reasoning blocks, and Anthropic's thinking blocks.
    const reasoning = block.type === "reasoning" ? block.reasoning : block.type === "thinking" ? block.thinking : undefined;
    if (reasoning) yield { type: "reasoning", delta: reasoning };
  }
}

/**
 * Yields AgentStreamEvents for a LangChain or LangGraph run:
 * agentEventsResponse(fromLangChain(graph.streamEvents(input, { version: "v2" }))).
 */
export async function* fromLangChain(events: AsyncIterable<LangChainStreamEvent>): AsyncGenerator<AgentStreamEvent> {
  try {
    for await (const event of events) {
      const id = event.run_id ?? event.name ?? "tool";
      switch (event.event) {
        case "on_chat_model_stream":
          yield* contentEvents(event.data?.chunk?.content);
          break;
        case "on_tool_start":
          yield { type: "tool-start", id, name: event.name ?? "tool" };
          break;
        case "on_tool_end":
          yield { type: "tool-end", id };
          break;
        case "on_tool_error":
          yield { type: "tool-end", id, error: true };
          break;
      }
    }
    yield { type: "done" };
  } catch (error) {
    yield { type: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
