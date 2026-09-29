"use client";

import { Thinking } from "./thinking";
import { Streaming } from "./streaming";
import { ToolCall, type ToolStep } from "./tool-call";
import { Stalled } from "./stalled";
import { ErrorState } from "./error-state";
import { Done } from "./done";
import {
  cx,
  type AgentStatus,
  type AgentStatusSnapshot,
  type WaitStateProps,
} from "./types";

export type AgentStateProps = WaitStateProps & {
  status: AgentStatus | AgentStatusSnapshot;
  text?: string;
  toolName?: string;
  steps?: ToolStep[];
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
};

function isSnapshot(value: AgentStatus | AgentStatusSnapshot): value is AgentStatusSnapshot {
  return typeof value === "object";
}

export function AgentState({
  status,
  className,
  duotone = false,
  text,
  toolName,
  steps,
  errorMessage,
  onRetry,
  onCancel,
}: AgentStateProps) {
  const snapshot = isSnapshot(status) ? status : undefined;
  const state: AgentStatus = snapshot ? snapshot.state : (status as AgentStatus);
  const cancel = onCancel ?? snapshot?.cancel;

  return (
    <div
      key={state}
      className={cx(
        "crate-state-in motion-reduce:opacity-100",
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      {state === "thinking" ? (
        <Thinking
          duotone={duotone}
          elapsedMs={snapshot?.elapsedMs}
          label={snapshot?.label === "Thinking…" ? undefined : snapshot?.label}
          onCancel={cancel}
        />
      ) : null}
      {state === "tool" ? (
        <ToolCall
          duotone={duotone}
          toolName={toolName ?? snapshot?.activeToolName}
          steps={steps}
        />
      ) : null}
      {state === "streaming" ? <Streaming duotone={duotone} text={text} /> : null}
      {state === "stalled" ? <Stalled duotone={duotone} /> : null}
      {state === "error" ? <ErrorState message={errorMessage} onRetry={onRetry} /> : null}
      {state === "done" ? <Done duotone={duotone} /> : null}
      <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes crate-state-enter { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } } .crate-state-in { animation: crate-state-enter 260ms ease-out both; } }`}</style>
    </div>
  );
}
