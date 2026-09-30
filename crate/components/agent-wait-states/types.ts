export type AgentStatus =
  | "thinking"
  | "reasoning"
  | "sources"
  | "tool"
  | "plan"
  | "approval"
  | "queue"
  | "file"
  | "streaming"
  | "stalled"
  | "error"
  | "done";

export type AgentSource = {
  id?: string;
  url?: string;
  domain?: string;
  title: string;
};

export type AgentStatusSnapshot = {
  state: AgentStatus;
  activeToolName?: string;
  reasoning?: string;
  sources: AgentSource[];
  elapsedMs: number;
  showCancel: boolean;
  label: string;
  cancel?: () => void;
};

export type WaitStateProps = {
  className?: string;
  accent?: boolean;
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
