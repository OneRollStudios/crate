"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Messages } from "./messages";

export function Chat({ mock, model }: { mock: boolean; model: string }) {
  // useChat posts to /api/chat (app/api/chat/route.ts) and reads its stream.
  // Messages connects it to Crate (useAgentStatus) and renders the replies.
  // A fixed id: without one, useChat makes a random id while rendering, which
  // Next.js with Cache Components refuses to prerender.
  const chat = useChat({ id: "chat" });
  const [input, setInput] = useState("");

  const busy = chat.status === "submitted" || chat.status === "streaming";

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

      <Messages chat={chat} />

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
