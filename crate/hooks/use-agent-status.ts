"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentStatus, AgentStatusSnapshot } from "@/components/agent-wait-states/types";

type UnknownPart = {
  type?: string;
  text?: string;
  state?: string;
  toolName?: string;
  toolInvocation?: {
    toolName?: string;
    state?: string;
  };
};

type ChatLike = {
  status: "submitted" | "streaming" | "ready" | "error" | string;
  messages: Array<{
    role?: string;
    parts?: UnknownPart[];
    content?: string;
  }>;
  error?: unknown;
  stop?: () => void;
};

export type UseAgentStatusOptions = {
  manualStatus?: AgentStatus;
  onCancel?: () => void;
  stallAfterMs?: number;
};

const FINISHED_TOOL_STATES = new Set([
  "output-available",
  "output-error",
  "result",
  "error",
]);

function readTool(part: UnknownPart) {
  const type = part.type ?? "";
  const invocation = part.toolInvocation;
  const name =
    part.toolName ??
    invocation?.toolName ??
    (type.startsWith("tool-") ? type.slice(5) : undefined);
  const state = part.state ?? invocation?.state;
  const isTool = type === "dynamic-tool" || type === "tool-invocation" || type.startsWith("tool-");
  return isTool && name && !FINISHED_TOOL_STATES.has(state ?? "") ? name : undefined;
}

function inspectMessages(messages: ChatLike["messages"]) {
  let activeToolName: string | undefined;
  let content = "";

  for (const message of messages) {
    if (message.content) content += message.content;
    for (const part of message.parts ?? []) {
      if (part.type === "text" && part.text) content += part.text;
      const toolName = readTool(part);
      if (toolName) activeToolName = toolName;
    }
  }

  return { activeToolName, contentSignature: `${content.length}:${content.slice(-80)}` };
}

export function useAgentStatus(
  chat: ChatLike,
  options: UseAgentStatusOptions = {},
): AgentStatusSnapshot {
  const { activeToolName, contentSignature } = useMemo(
    () => inspectMessages(chat.messages),
    [chat.messages],
  );
  const [now, setNow] = useState(() => Date.now());
  const busySince = useRef<number | null>(null);
  const lastContentAt = useRef(Date.now());
  const previousSignature = useRef(contentSignature);
  const wasBusy = useRef(false);

  const busy = chat.status === "submitted" || chat.status === "streaming";

  useEffect(() => {
    if (busy && busySince.current === null) busySince.current = Date.now();
    if (!busy) busySince.current = null;
    if (busy) wasBusy.current = true;
  }, [busy]);

  useEffect(() => {
    if (contentSignature !== previousSignature.current) {
      previousSignature.current = contentSignature;
      lastContentAt.current = Date.now();
      setNow(Date.now());
    }
  }, [contentSignature]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [busy]);

  const elapsedMs = busySince.current ? Math.max(0, now - busySince.current) : 0;
  const stalled =
    chat.status === "streaming" && now - lastContentAt.current >= (options.stallAfterMs ?? 5000);

  let state: AgentStatus;
  if (options.manualStatus) state = options.manualStatus;
  else if (chat.status === "error" || chat.error) state = "error";
  else if (stalled) state = "stalled";
  else if (activeToolName && busy) state = "tool";
  else if (chat.status === "streaming") state = "streaming";
  else if (chat.status === "submitted") state = "thinking";
  else state = "done";

  const label = elapsedMs >= 8000 ? "Still thinking…" : "Thinking…";
  const cancel = options.onCancel ?? chat.stop;

  return {
    state,
    activeToolName,
    elapsedMs,
    showCancel: elapsedMs >= 20000 && Boolean(cancel),
    label,
    cancel,
  };
}
