"use client";

import type { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { AgentState } from "@/components/agent-wait-states/agent-state";
import { useAgentStatus } from "@/hooks/use-agent-status";

function textOf(message: UIMessage) {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function Messages({ chat }: { chat: ReturnType<typeof useChat> }) {
  const status = useAgentStatus(chat);

  // The reply being written right now: the last message, while the chat is busy.
  const busy = chat.status === "submitted" || chat.status === "streaming";
  const last = chat.messages.at(-1);
  const live = busy && last?.role === "assistant" ? last : undefined;

  return (
    <>
      {/* Finished messages only. AgentState shows the live reply, so it appears once. */}
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
          text={live ? textOf(live) : undefined}
          errorMessage={chat.error?.message}
          onRetry={() => chat.regenerate()}
        />
      ) : null}
    </>
  );
}
