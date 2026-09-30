import { Check, Circle, LoaderCircle, X } from "lucide-react";
import { cx, type WaitStateProps } from "./types";

export type PlanStep = { id?: string; label: string; state: "pending" | "active" | "complete" | "failed" };
export type AgentPlanProps = WaitStateProps & { steps: PlanStep[] };

export function AgentPlan({ className, accent = false, steps }: AgentPlanProps) {
  const complete = steps.filter((step) => step.state === "complete").length;
  const activeIndex = steps.findIndex((step) => step.state === "active");
  const progress = Math.max(complete, activeIndex >= 0 ? activeIndex + 1 : complete);

  return (
    <div className={cx("w-full max-w-md rounded-[16px] border border-border bg-background p-4 text-foreground", className)} aria-live="polite">
      <div className="mb-3 flex items-center justify-between text-xs"><span className="font-medium">Plan</span><span className="text-muted-foreground">{Math.min(progress, steps.length)} of {steps.length}</span></div>
      <ol className="space-y-2">
        {steps.map((step, index) => <li key={step.id ?? `${step.label}-${index}`} className={cx("flex items-center gap-2.5 text-sm", step.state === "pending" && "text-muted-foreground")}>
          <span className={cx("grid size-6 shrink-0 place-items-center rounded-full border border-border", step.state === "active" && accent && "border-primary text-primary", step.state === "failed" && "text-destructive")} aria-hidden="true">
            {step.state === "complete" ? <Check className="size-3.5" /> : step.state === "failed" ? <X className="size-3.5" /> : step.state === "active" ? <LoaderCircle className="size-3.5 motion-safe:animate-spin" /> : <Circle className="size-3" />}
          </span>
          <span className={cx(step.state === "complete" && "text-muted-foreground line-through")}>{step.label}</span>
        </li>)}
      </ol>
    </div>
  );
}
