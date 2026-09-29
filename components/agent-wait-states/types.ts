export type AgentStatus =
  | "thinking"
  | "tool"
  | "streaming"
  | "stalled"
  | "error"
  | "done";

export type AgentStatusSnapshot = {
  state: AgentStatus;
  activeToolName?: string;
  elapsedMs: number;
  showCancel: boolean;
  label: string;
  cancel?: () => void;
};

export type WaitStateProps = {
  className?: string;
  duotone?: boolean;
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const duoBackground =
  "linear-gradient(120deg, #9E8CF2 0%, #6FB6F0 100%)";
