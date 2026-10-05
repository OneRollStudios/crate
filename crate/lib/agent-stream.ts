// Agent stream: one small event format that any AI backend can produce, and a
// reducer that turns those events into the chat shape useAgentStatus reads.
//
// Server: convert your framework's stream to AgentStreamEvents (see the
// OpenAI Agents SDK and LangChain adapters), then send them with
// agentEventsResponse(). Client: read them with useAgentStream(), or with
// agentEventsFromSSE() for any other server-sent events format.

export type AgentStreamEvent =
  | { type: "text"; delta: string }
  | { type: "reasoning"; delta: string }
  | { type: "source"; title: string; url?: string; id?: string }
  | { type: "tool-start"; id: string; name: string }
  | { type: "tool-end"; id: string; error?: boolean }
  | { type: "error"; message: string }
  | { type: "done" };

export type AgentStreamPart =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "source-url"; sourceId?: string; url?: string; title: string }
  | { type: "dynamic-tool"; toolCallId: string; toolName: string; state: "input-available" | "output-available" | "output-error" };

export type AgentStreamState = {
  /** The same values as the AI SDK's useChat, so useAgentStatus reads it directly. */
  status: "ready" | "submitted" | "streaming" | "error";
  /** The assistant turn being streamed, as one message of parts. */
  messages: Array<{ role: "assistant"; parts: AgentStreamPart[] }>;
  error?: Error;
};

export type AgentStreamAction = AgentStreamEvent | { type: "request" } | { type: "stopped" };

export const initialAgentStreamState: AgentStreamState = { status: "ready", messages: [] };

/** All text streamed so far in the current turn. */
export function agentStreamText(state: AgentStreamState) {
  return (state.messages[0]?.parts ?? []).map((part) => (part.type === "text" ? part.text : "")).join("");
}

function finishTools(parts: AgentStreamPart[]): AgentStreamPart[] {
  return parts.map((part) => (part.type === "dynamic-tool" && part.state === "input-available" ? { ...part, state: "output-available" } : part));
}

function appendDelta(parts: AgentStreamPart[], type: "text" | "reasoning", delta: string): AgentStreamPart[] {
  const last = parts.at(-1);
  if (last?.type === type) return [...parts.slice(0, -1), { type, text: last.text + delta }];
  return [...parts, { type, text: delta }];
}

/** Applies one event to the state. Pure, so it works with useReducer or anywhere else. */
export function reduceAgentStream(state: AgentStreamState, action: AgentStreamAction): AgentStreamState {
  if (action.type === "request") return { status: "submitted", messages: [{ role: "assistant", parts: [] }] };
  if (action.type === "stopped") return { ...state, status: state.status === "error" ? "error" : "ready" };
  if (action.type === "done") return { ...state, status: "ready", messages: state.messages.map((m) => ({ ...m, parts: finishTools(m.parts) })) };
  if (action.type === "error") return { ...state, status: "error", error: new Error(action.message) };

  let parts = state.messages[0]?.parts ?? [];
  switch (action.type) {
    case "text":
      // The model is writing again, so any tool without an end event has finished.
      parts = appendDelta(finishTools(parts), "text", action.delta);
      break;
    case "reasoning":
      parts = appendDelta(parts, "reasoning", action.delta);
      break;
    case "source":
      parts = [...parts, { type: "source-url", sourceId: action.id, url: action.url, title: action.title }];
      break;
    case "tool-start":
      parts = [...parts, { type: "dynamic-tool", toolCallId: action.id, toolName: action.name, state: "input-available" }];
      break;
    case "tool-end":
      parts = parts.map((part) =>
        part.type === "dynamic-tool" && part.toolCallId === action.id ? { ...part, state: action.error ? "output-error" : "output-available" } : part,
      );
      break;
  }
  // Only content moves the turn to "streaming". Tool steps before any content
  // keep it "submitted", so the wait reads as thinking, not an empty stream.
  const content = action.type === "text" || action.type === "reasoning" || action.type === "source";
  const status = content || state.status === "streaming" ? "streaming" : "submitted";
  return { ...state, status, messages: [{ role: "assistant", parts }] };
}

// ---------- Server-sent events ----------

export type SSEMessage = { event?: string; data: string; id?: string };

/** Parses a server-sent events body into messages, following the SSE format. */
export async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<SSEMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let message: SSEMessage = { data: "" };
  let hasData = false;
  // Reads one line; returns the finished message when the line is blank.
  const take = (line: string) => {
    if (line === "") {
      const finished = hasData ? message : undefined;
      message = { data: "" };
      hasData = false;
      return finished;
    }
    if (line.startsWith(":")) return undefined;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "data") {
      message.data = hasData ? `${message.data}\n${value}` : value;
      hasData = true;
    } else if (field === "event") message.event = value;
    else if (field === "id") message.id = value;
    return undefined;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // A trailing "\r" may be the first half of "\r\n", so keep it for the next chunk.
      const lines = buffer.split(/\r\n|\r(?!$)|\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const finished = take(line);
        if (finished) yield finished;
      }
    }
    buffer += decoder.decode();
    // Servers sometimes end without a final blank line; keep that last message.
    for (const line of buffer.replace(/\r$/, "").split(/\r\n|\r|\n/)) take(line);
    if (hasData) yield message;
  } finally {
    reader.releaseLock();
  }
}

export type SSEMapper = (message: SSEMessage) => AgentStreamEvent | AgentStreamEvent[] | null | undefined;

/**
 * The default mapping: JSON AgentStreamEvents (what agentEventsResponse sends),
 * "[DONE]" as the end, and any other data as text.
 */
export const defaultSSEMapper: SSEMapper = (message) => {
  if (message.data === "[DONE]") return { type: "done" };
  try {
    const value = JSON.parse(message.data);
    if (value && typeof value.type === "string") return value as AgentStreamEvent;
  } catch {
    // Not JSON: treat it as text below.
  }
  return { type: "text", delta: message.data };
};

/** The raw SSE adapter: reads any server-sent events stream as AgentStreamEvents. */
export async function* agentEventsFromSSE(body: ReadableStream<Uint8Array>, map: SSEMapper = defaultSSEMapper): AsyncGenerator<AgentStreamEvent> {
  let finished = false;
  for await (const message of readSSE(body)) {
    const mapped = map(message);
    for (const event of Array.isArray(mapped) ? mapped : mapped ? [mapped] : []) {
      if (event.type === "done" || event.type === "error") finished = true;
      yield event;
    }
  }
  if (!finished) yield { type: "done" };
}

/** Encodes AgentStreamEvents as server-sent events. Errors thrown by the source become an error event. */
export function agentEventsToSSE(events: AsyncIterable<AgentStreamEvent>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const send = (event: AgentStreamEvent) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
  return new ReadableStream({
    async start(controller) {
      let finished = false;
      try {
        for await (const event of events) {
          if (event.type === "done" || event.type === "error") finished = true;
          controller.enqueue(send(event));
        }
        if (!finished) controller.enqueue(send({ type: "done" }));
      } catch (error) {
        controller.enqueue(send({ type: "error", message: error instanceof Error ? error.message : String(error) }));
      }
      controller.close();
    },
  });
}

/** A streaming Response for route handlers (Next.js, Hono, Remix, and others). */
export function agentEventsResponse(events: AsyncIterable<AgentStreamEvent>, init?: ResponseInit) {
  return new Response(agentEventsToSSE(events), {
    ...init,
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive", ...init?.headers },
  });
}
