"use client";

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
};

function isSnapshot(value: AgentStatus | AgentStatusSnapshot): value is AgentStatusSnapshot {
  return typeof value === "object";
}

export function AgentState({
  status, className, accent = false, text, toolName, steps, errorMessage, onRetry, onCancel,
  reasoning, reasoningDone, reasoningDurationSeconds, sources, planSteps = [], approvalTitle,
  approvalPreview = "Review this action before it runs.", onAllow, onDeny, approvalExpiresIn,
  queueVariant, queuePosition, retryIn, filename = "document.pdf", fileSize = "2.4 MB",
  fileStage, fileProgress,
}: AgentStateProps) {
  const snapshot = isSnapshot(status) ? status : undefined;
  const state: AgentStatus = snapshot ? snapshot.state : (status as AgentStatus);
  const cancel = onCancel ?? snapshot?.cancel;

  return (
    <div key={state} className={cx("crate-state-in motion-reduce:opacity-100", className)} aria-live="polite" aria-atomic="true">
      {state === "thinking" ? <Thinking accent={accent} elapsedMs={snapshot?.elapsedMs} label={snapshot?.label === "Thinking…" ? undefined : snapshot?.label} onCancel={cancel} /> : null}
      {state === "reasoning" ? <ReasoningTrace accent={accent} text={reasoning ?? snapshot?.reasoning} done={reasoningDone} durationSeconds={reasoningDurationSeconds} /> : null}
      {state === "sources" ? <Sources accent={accent} sources={sources ?? snapshot?.sources ?? []} /> : null}
      {state === "tool" ? <ToolCall accent={accent} toolName={toolName ?? snapshot?.activeToolName} steps={steps} /> : null}
      {state === "plan" ? <AgentPlan accent={accent} steps={planSteps} /> : null}
      {state === "approval" ? <Approval accent={accent} title={approvalTitle} preview={approvalPreview} onAllow={onAllow} onDeny={onDeny} expiresIn={approvalExpiresIn} /> : null}
      {state === "queue" ? <Queue accent={accent} variant={queueVariant} position={queuePosition} retryIn={retryIn} /> : null}
      {state === "file" ? <FileProcessing accent={accent} filename={filename} size={fileSize} stage={fileStage} progress={fileProgress} /> : null}
      {state === "streaming" ? <Streaming accent={accent} text={text} /> : null}
      {state === "stalled" ? <Stalled accent={accent} /> : null}
      {state === "error" ? <ErrorState message={errorMessage} onRetry={onRetry} /> : null}
      {state === "done" ? <Done accent={accent} /> : null}
      <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes crate-state-enter { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } } .crate-state-in { animation: crate-state-enter 260ms ease-out both; } }`}</style>
    </div>
  );
}
