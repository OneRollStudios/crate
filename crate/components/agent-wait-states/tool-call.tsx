import { Check, Circle, LoaderCircle, Search, FileText, Wrench } from "lucide-react";
import { cx, type WaitStateProps } from "./types";

export type ToolStep = { id?: string; label: string; toolName?: string; state?: "pending" | "active" | "complete" };
export type ToolCallProps = WaitStateProps & { steps?: ToolStep[]; toolName?: string; label?: string };

function ToolIcon({ name, active }: { name?: string; active: boolean }) {
  const iconClass = "size-3.5";
  if (active) return <LoaderCircle className={cx(iconClass, "motion-safe:animate-spin")} />;
  if (name?.toLowerCase().includes("search")) return <Search className={iconClass} />;
  if (name?.toLowerCase().includes("file") || name?.toLowerCase().includes("read")) return <FileText className={iconClass} />;
  return <Wrench className={iconClass} />;
}

export function ToolCall({ className, accent = false, steps, toolName = "tool", label }: ToolCallProps) {
  const items = steps?.length ? steps : [{ label: label ?? `Running ${toolName}…`, toolName, state: "active" as const }];
  return (
    <div className={cx("w-full max-w-sm rounded-[16px] border border-border bg-background p-2 text-foreground shadow-[0_14px_34px_-24px_color-mix(in_srgb,var(--primary)_30%,transparent)]", className)} aria-live="polite" aria-label="Agent tool activity">
      <ol className="space-y-1">
        {items.map((step, index) => {
          const state = step.state ?? (index === items.length - 1 ? "active" : "complete");
          return <li key={step.id ?? `${step.label}-${index}`} className={cx("flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm", state === "active" ? "bg-muted text-foreground" : "text-muted-foreground")}>
            <span className={cx("grid size-6 shrink-0 place-items-center rounded-lg border border-border bg-background text-muted-foreground", state === "active" && accent && "text-primary")} aria-hidden="true">
              {state === "complete" ? <Check className="size-3.5" /> : state === "pending" ? <Circle className="size-3" /> : <ToolIcon name={step.toolName} active />}
            </span>
            <span>{step.label}</span>
          </li>;
        })}
      </ol>
    </div>
  );
}
