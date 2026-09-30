"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentSource, AgentStatus, AgentStatusSnapshot } from "@/components/agent-wait-states/types";

type UnknownPart = {
  type?: string;
  text?: string;
  state?: string;
  toolName?: string;
  url?: string;
  title?: string;
  sourceId?: string;
  filename?: string;
  toolInvocation?: { toolName?: string; state?: string };
};

type ChatLike = {
  status: "submitted" | "streaming" | "ready" | "error" | string;
  messages: Array<{ role?: string; parts?: UnknownPart[]; content?: string }>;
  error?: unknown;
  stop?: () => void;
};

export type UseAgentStatusOptions = { manualStatus?: AgentStatus; onCancel?: () => void; stallAfterMs?: number };

const FINISHED_TOOL_STATES = new Set(["output-available", "output-error", "result", "error"]);

function readTool(part: UnknownPart) {
  const type = part.type ?? "";
  const invocation = part.toolInvocation;
  const name = part.toolName ?? invocation?.toolName ?? (type.startsWith("tool-") ? type.slice(5) : undefined);
  const state = part.state ?? invocation?.state;
  const isTool = type === "dynamic-tool" || type === "tool-invocation" || type.startsWith("tool-");
  return isTool && name && !FINISHED_TOOL_STATES.has(state ?? "") ? name : undefined;
}

function inspectMessages(messages: ChatLike["messages"]) {
  let activeToolName: string | undefined;
  let content = "";
  let reasoning = "";
  let latestPart: "text" | "reasoning" | "source" | "other" = "other";
  const sources: AgentSource[] = [];

  for (const message of messages) {
    if (message.content) content += message.content;
    for (const part of message.parts ?? []) {
      const type = part.type ?? "";
      if (type === "text" && part.text) { content += part.text; latestPart = "text"; }
      if (type === "reasoning" || type === "reasoning-text") {
        reasoning += part.text ?? "";
        latestPart = "reasoning";
      }
      if (type === "source-url" || type === "source-document" || type === "source") {
        sources.push({
          id: part.sourceId,
          url: part.url,
          title: part.title ?? part.filename ?? part.url ?? "Source",
        });
        latestPart = "source";
      }
      const toolName = readTool(part);
      if (toolName) { activeToolName = toolName; latestPart = "other"; }
    }
  }

  return {
    activeToolName,
    reasoning,
    sources,
    latestPart,
    contentSignature: `${content.length}:${content.slice(-80)}:${reasoning.length}:${sources.length}`,
  };
}

export function useAgentStatus(chat: ChatLike, options: UseAgentStatusOptions = {}): AgentStatusSnapshot {
  const inspected = useMemo(() => inspectMessages(chat.messages), [chat.messages]);
  const [now, setNow] = useState(() => Date.now());
  const busySince = useRef<number | null>(null);
  const lastContentAt = useRef(Date.now());
  const previousSignature = useRef(inspected.contentSignature);
  const busy = chat.status === "submitted" || chat.status === "streaming";

  useEffect(() => {
    if (busy && busySince.current === null) busySince.current = Date.now();
    if (!busy) busySince.current = null;
  }, [busy]);

  useEffect(() => {
    if (inspected.contentSignature !== previousSignature.current) {
      previousSignature.current = inspected.contentSignature;
      lastContentAt.current = Date.now();
      setNow(Date.now());
    }
  }, [inspected.contentSignature]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [busy]);

  const elapsedMs = busySince.current ? Math.max(0, now - busySince.current) : 0;
  const stalled = chat.status === "streaming" && now - lastContentAt.current >= (options.stallAfterMs ?? 5000);

  let state: AgentStatus;
  if (options.manualStatus) state = options.manualStatus;
  else if (chat.status === "error" || chat.error) state = "error";
  else if (stalled) state = "stalled";
  else if (inspected.activeToolName && busy) state = "tool";
  else if (chat.status === "streaming" && inspected.latestPart === "reasoning") state = "reasoning";
  else if (chat.status === "streaming" && inspected.latestPart === "source") state = "sources";
  else if (chat.status === "streaming") state = "streaming";
  else if (chat.status === "submitted") state = "thinking";
  else state = "done";

  const label = elapsedMs >= 8000 ? "Still thinking…" : "Thinking…";
  const cancel = options.onCancel ?? chat.stop;

  return {
    state,
    activeToolName: inspected.activeToolName,
    reasoning: inspected.reasoning || undefined,
    sources: inspected.sources,
    elapsedMs,
    showCancel: elapsedMs >= 20000 && Boolean(cancel),
    label,
    cancel,
  };
}
