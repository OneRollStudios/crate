"use client";

import { useEffect, useState } from "react";
import { Thinking } from "./thinking";
import { Streaming } from "./streaming";
import { ToolCall, type ToolStep } from "./tool-call";
import { Stalled } from "./stalled";
import { ErrorState } from "./error-state";
import { Done } from "./done";
import { ReasoningTrace } from "./reasoning-trace";
import { Sources, type SourceItem } from "./sources";
import { AgentPlan, type PlanStep } from "./agent-plan";
import { Approval } from "./approval";
import { Queue } from "./queue";
import { FileProcessing, type FileStage } from "./file-processing";
import { cx, type AgentStatus, type AgentStatusSnapshot, type WaitStateProps } from "./types";

export type AgentStateProps = WaitStateProps & {
  status: AgentStatus | AgentStatusSnapshot;
  text?: string;
  toolName?: string;
  steps?: ToolStep[];
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  reasoning?: string;
  reasoningDone?: boolean;
  reasoningDurationSeconds?: number;
  sources?: SourceItem[];
  planSteps?: PlanStep[];
  approvalTitle?: string;
  approvalPreview?: React.ReactNode;
  onAllow?: () => void;
  onDeny?: () => void;
  approvalExpiresIn?: number;
  queueVariant?: "line" | "rate-limit";
  queuePosition?: number;
  retryIn?: number;
  filename?: string;
  fileSize?: string;
  fileStage?: FileStage;
  fileProgress?: number;
  /**
   * How long a tool call or sources stay on screen at least, in ms. One that ends sooner stays,
   * shown as finished, until this has passed. Errors, approvals, and stalls never wait. 0 turns it off.
   */
  minDisplayMs?: number;
};

// States kept readable for minDisplayMs, and states that always show at once.
const HELD_STATES = new Set<AgentStatus>(["tool", "sources"]);
const URGENT_STATES = new Set<AgentStatus>(["error", "approval", "stalled"]);

type Shown = { id: number; state: AgentStatus; toolName?: string; sources?: SourceItem[]; settled: boolean };

/**
 * The state to show. Usually the live state; a tool call or sources that ended before minDisplayMs
 * stay (with the tool name and sources they had) until it has passed, then the latest state shows.
 */
function useShownState(state: AgentStatus, toolName: string | undefined, sources: SourceItem[], minDisplayMs: number) {
  const settledAt = (value: AgentStatus) => minDisplayMs <= 0 || !HELD_STATES.has(value);
  const [shown, setShown] = useState<Shown>(() => ({ id: 0, state, toolName, sources, settled: settledAt(state) }));
  const holding = state !== shown.state && !shown.settled && !URGENT_STATES.has(state);

  // Adjusted during render, so a new state never flashes before a hold starts.
  if (state !== shown.state && !holding) {
    setShown({ id: shown.id + 1, state, toolName, sources, settled: settledAt(state) });
  } else if (state === shown.state && (toolName !== shown.toolName || sources.length !== (shown.sources?.length ?? 0))) {
    setShown({ ...shown, toolName, sources });
  }

  useEffect(() => {
    if (shown.settled) return;
    const timer = window.setTimeout(
      () => setShown((current) => (current.id === shown.id ? { ...current, settled: true } : current)),
      minDisplayMs,
    );
    return () => window.clearTimeout(timer);
  }, [shown.id, shown.settled, minDisplayMs]);

  return { shown, held: holding };
}

function isSnapshot(value: AgentStatus | AgentStatusSnapshot): value is AgentStatusSnapshot {
  return typeof value === "object";
}

export function AgentState({
  status, className, accent = false, labels, text, toolName, steps, errorMessage, onRetry, onCancel,
  reasoning, reasoningDone, reasoningDurationSeconds, sources, planSteps = [], approvalTitle,
  approvalPreview, onAllow, onDeny, approvalExpiresIn,
  queueVariant, queuePosition, retryIn, filename, fileSize,
  fileStage, fileProgress, minDisplayMs = 600,
}: AgentStateProps) {
  const snapshot = isSnapshot(status) ? status : undefined;
  const liveState: AgentStatus = snapshot ? snapshot.state : (status as AgentStatus);
  const cancel = onCancel ?? snapshot?.cancel;
  const liveToolName = toolName ?? snapshot?.activeToolName;
  const liveSources = sources ?? snapshot?.sources ?? [];
  const { shown, held } = useShownState(liveState, liveToolName, liveSources, minDisplayMs);
  const state = held ? shown.state : liveState;

  return (
    <div key={state} className={cx("crate-state-in motion-reduce:opacity-100", className)} aria-live="polite" aria-atomic="true">
      {state === "thinking" ? <Thinking accent={accent} labels={labels} elapsedMs={snapshot?.elapsedMs} onCancel={cancel} /> : null}
      {state === "reasoning" ? <ReasoningTrace accent={accent} labels={labels} text={reasoning ?? snapshot?.reasoning} done={reasoningDone} durationSeconds={reasoningDurationSeconds} /> : null}
      {state === "sources" ? <Sources accent={accent} labels={labels} sources={held ? shown.sources ?? [] : liveSources} /> : null}
      {state === "tool" ? <ToolCall accent={accent} labels={labels} toolName={held ? shown.toolName : liveToolName} steps={steps} done={held} /> : null}
      {state === "plan" ? <AgentPlan accent={accent} labels={labels} steps={planSteps} /> : null}
      {state === "approval" ? <Approval accent={accent} labels={labels} title={approvalTitle} preview={approvalPreview} onAllow={onAllow} onDeny={onDeny} expiresIn={approvalExpiresIn} /> : null}
      {state === "queue" ? <Queue accent={accent} labels={labels} variant={queueVariant} position={queuePosition} retryIn={retryIn} /> : null}
      {state === "file" ? <FileProcessing accent={accent} labels={labels} filename={filename} size={fileSize} stage={fileStage} progress={fileProgress} /> : null}
      {state === "streaming" ? <Streaming accent={accent} labels={labels} text={text} /> : null}
      {state === "stalled" ? <Stalled accent={accent} labels={labels} text={text} /> : null}
      {state === "error" ? <ErrorState labels={labels} message={errorMessage} onRetry={onRetry} /> : null}
      {state === "done" ? <Done accent={accent} labels={labels} /> : null}
      <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes crate-state-enter { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } } .crate-state-in { animation: crate-state-enter 260ms ease-out both; } }`}</style>
    </div>
  );
}
