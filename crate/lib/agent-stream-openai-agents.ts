// Adapter for the OpenAI Agents SDK (@openai/agents). Converts the events of a
// streamed run, run(agent, input, { stream: true }), into AgentStreamEvents.
// It reads the events by shape, so it adds no dependency on the SDK.
import type { AgentStreamEvent } from "./agent-stream";

type RawItem = {
  type?: string;
  name?: string;
  callId?: string;
  id?: string;
  status?: string;
  content?: Array<{ type?: string; text?: string }>;
};

/** The parts of the SDK's RunStreamEvent this adapter reads. Accepts the SDK's own stream as is. */
export type OpenAIAgentsStreamEvent = {
  type: string;
  data?: { type?: string; delta?: string; event?: { type?: string; delta?: string } };
  name?: string;
  item?: { type?: string; rawItem?: RawItem };
};

/**
 * Yields AgentStreamEvents for a streamed run:
 * agentEventsResponse(fromOpenAIAgents(await run(agent, input, { stream: true }))).
 */
export async function* fromOpenAIAgents(stream: AsyncIterable<unknown>): AsyncGenerator<AgentStreamEvent> {
  // Reasoning can arrive as live summary deltas and again as a finished item.
  let streamedReasoning = false;
  try {
    for await (const value of stream) {
      const event = value as OpenAIAgentsStreamEvent;
      if (event.type === "raw_model_stream_event") {
        const data = event.data;
        if (data?.type === "response_started") streamedReasoning = false;
        if (data?.type === "output_text_delta" && data.delta) yield { type: "text", delta: data.delta };
        // Responses API reasoning summaries, passed through as raw model events.
        const raw = data?.type === "model" ? data.event : undefined;
        if (raw?.type === "response.reasoning_summary_text.delta" && raw.delta) {
          streamedReasoning = true;
          yield { type: "reasoning", delta: raw.delta };
        }
        continue;
      }
      if (event.type !== "run_item_stream_event") continue;
      const raw = event.item?.rawItem ?? {};
      const id = raw.callId ?? raw.id ?? raw.name ?? "tool";
      if (event.name === "tool_called" || event.name === "handoff_requested") {
        yield { type: "tool-start", id, name: raw.name ?? raw.type ?? "tool" };
      } else if (event.name === "tool_output" || event.name === "handoff_occurred") {
        yield { type: "tool-end", id, error: raw.status === "failed" || raw.status === "incomplete" };
      } else if (event.name === "reasoning_item_created" && !streamedReasoning) {
        const text = (raw.content ?? []).map((part) => part.text ?? "").join("");
        if (text) yield { type: "reasoning", delta: text };
      }
    }
    yield { type: "done" };
  } catch (error) {
    yield { type: "error", message: error instanceof Error ? error.message : String(error) };
  }
}
