"use client";

// Test page for scripts/install-test.sh: drives AgentState with a real useChat
// and a mocked AI SDK stream. Copied into the Next.js and Vite consumer apps.

import { useChat } from "@ai-sdk/react";
import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";

// A mocked AI SDK stream: no server, no API key. Each request opens a stream
// that the test feeds one chunk at a time through window.__crateMock.
type CrateMock = {
  requests: number;
  push: (chunk: UIMessageChunk) => void;
  close: () => void;
};

declare global {
  interface Window {
    __crateMock?: CrateMock;
  }
}

let controller: ReadableStreamDefaultController<UIMessageChunk> | undefined;
const mock: CrateMock = {
  requests: 0,
  push: (chunk) => controller?.enqueue(chunk),
  close: () => controller?.close(),
};
if (typeof window !== "undefined") window.__crateMock = mock;

const transport: ChatTransport<UIMessage> = {
  async sendMessages() {
    mock.requests += 1;
    return new ReadableStream<UIMessageChunk>({
      start(next) {
        controller = next;
      },
    });
  },
  async reconnectToStream() {
    return null;
  },
};

export default function Page() {
  const chat = useChat({ transport });
  const status = useAgentStatus(chat, { stallAfterMs: 1500 });
  // The reply being written, shown inside AgentState (see the README's Show the Reply Once).
  const busy = chat.status === "submitted" || chat.status === "streaming";
  const last = chat.messages.at(-1);
  const live = busy && last?.role === "assistant"
    ? last.parts.map((part) => (part.type === "text" ? part.text : "")).join("")
    : undefined;

  return (
    <main>
      <button type="button" onClick={() => chat.sendMessage({ text: "Find the docs" })}>
        Send
      </button>
      <p data-testid="chat-status">{chat.status}</p>
      <AgentState
        status={status}
        text={live}
        errorMessage={chat.error?.message}
        onRetry={() => chat.regenerate()}
      />
    </main>
  );
}
