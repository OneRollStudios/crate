"use client";

import { Check, FileText, LoaderCircle } from "lucide-react";
import { useCrate } from "./crate-provider";
import { cx, type WaitStateProps } from "./types";

export type FileStage = "uploading" | "reading" | "chunking" | "ready";
export type FileProcessingProps = WaitStateProps & { filename?: string; size?: string; stage?: FileStage; progress?: number };

const stages: Array<{ key: FileStage; label: "fileUploading" | "fileReading" | "fileChunking" | "fileReady" }> = [
  { key: "uploading", label: "fileUploading" },
  { key: "reading", label: "fileReading" },
  { key: "chunking", label: "fileChunking" },
  { key: "ready", label: "fileReady" },
];

export function FileProcessing({ className, accent = false, filename, size, stage = "uploading", progress = 0, labels }: FileProcessingProps) {
  const { labels: l, format } = useCrate(labels);
  const activeIndex = stages.findIndex((item) => item.key === stage);
  const percent = stage === "ready" ? 100 : Math.max(0, Math.min(100, progress));
  return (
    <div className={cx("w-full max-w-md rounded-sm border border-border bg-background p-4 text-foreground", className)} aria-live="polite">
      <div className="flex items-center gap-3"><span className={cx("grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground", accent && "text-primary")} aria-hidden="true"><FileText className="size-4" /></span><div className="min-w-0 flex-1">{filename ? <p className="m-0 truncate text-sm font-medium">{filename}</p> : null}{size ? <p className="m-0 text-xs text-muted-foreground">{size}</p> : null}</div><span className="text-xs text-muted-foreground">{l.fileProgress(percent, format)}</span></div>
      <div className="my-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true"><span className={cx("block h-full rounded-full bg-muted-foreground transition-[width] motion-reduce:transition-none", accent && "bg-primary")} style={{ width: `${percent}%` }} /></div>
      <ol className="grid grid-cols-4 gap-1 text-center text-[10px] text-muted-foreground">
        {stages.map((item, index) => <li key={item.key} className={cx("flex min-w-0 flex-col items-center gap-1", index === activeIndex && "text-foreground")}><span className={cx("grid size-5 place-items-center rounded-full border border-border", index === activeIndex && accent && "border-primary text-primary")} aria-hidden="true">{index < activeIndex || stage === "ready" ? <Check className="size-3" /> : index === activeIndex ? <LoaderCircle className="size-3 motion-safe:animate-spin" /> : null}</span><span className="truncate">{l[item.label]}</span></li>)}
      </ol>
    </div>
  );
}
