"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState } from "react";
import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function Chat({ mock, model }: { mock: boolean; model: string }) {
  // useChat posts to /api/chat (app/api/chat/route.ts) and reads its stream.
  const chat = useChat();
  // One line connects the chat to Crate: the hook maps it to a wait state.
  const status = useAgentStatus(chat);
  const [input, setInput] = useState("");

  const busy = chat.status === "submitted" || chat.status === "streaming";
  const last = chat.messages.at(-1);
  const live = busy && last?.role === "assistant" ? last : undefined;
  const streamedText = live ? textOf(live) : undefined;

  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    chat.sendMessage({ text });
    setInput("");
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Crate Real Chat</h1>
        <p className="text-sm text-muted-foreground" data-testid="mode">
          {mock
            ? "Mock mode: a scripted stream. Set ANTHROPIC_API_KEY in .env.local to talk to a real model."
            : `Live mode: ${model}.`}
        </p>
      </header>

      <ol className="flex flex-col gap-4">
        {chat.messages.filter((message) => message !== live).map((message) => (
          <li key={message.id} className={message.role === "user" ? "self-end rounded-lg bg-muted px-4 py-2" : "leading-7"}>
            {textOf(message)}
          </li>
        ))}
      </ol>

      {chat.messages.length > 0 ? (
        <AgentState
          status={status}
          text={streamedText}
          errorMessage={chat.error?.message}
          onRetry={() => chat.regenerate()}
        />
      ) : null}

      <form onSubmit={send} className="sticky bottom-4 mt-auto flex gap-2">
        <label htmlFor="prompt" className="sr-only">Message</label>
        <input
          id="prompt"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask which Crate component fits a moment"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-primary"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Send
        </button>
      </form>
    </main>
  );
}
