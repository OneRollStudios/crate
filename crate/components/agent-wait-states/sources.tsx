import { Globe2 } from "lucide-react";
import { cx, type AgentSource, type WaitStateProps } from "./types";

export type SourceItem = AgentSource;
export type SourcesProps = WaitStateProps & { sources: SourceItem[]; maxVisible?: number };

function sourceDomain(source: SourceItem) {
  if (source.domain) return source.domain;
  if (!source.url) return "source";
  try { return new URL(source.url).hostname.replace(/^www\./, ""); } catch { return "source"; }
}

export function Sources({ className, accent = false, sources, maxVisible = 3 }: SourcesProps) {
  const visible = sources.slice(0, maxVisible);
  const overflow = Math.max(0, sources.length - visible.length);

  return (
    <div className={cx("flex max-w-xl flex-wrap gap-2", className)} aria-live="polite" aria-label="Sources">
      {visible.map((source, index) => {
        const content = <><span className={cx("grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground", accent && "text-primary")} aria-hidden="true"><Globe2 className="size-3.5" /></span><span className="min-w-0"><span className="block truncate text-[11px] text-muted-foreground">{sourceDomain(source)}</span><span className="block max-w-44 truncate text-xs font-medium text-foreground">{source.title}</span></span></>;
        const classes = "crate-source flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-2";
        return source.url ? <a key={source.id ?? source.url ?? index} href={source.url} target="_blank" rel="noreferrer" className={classes} style={{ animationDelay: `${index * 90}ms` }}>{content}</a> : <span key={source.id ?? index} className={classes} style={{ animationDelay: `${index * 90}ms` }}>{content}</span>;
      })}
      {overflow ? <span className="inline-flex items-center rounded-xl border border-border bg-muted px-3 text-xs text-muted-foreground">+{overflow} more</span> : null}
      <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes crate-source-in { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: none } } .crate-source { animation: crate-source-in 220ms ease-out both; } }`}</style>
    </div>
  );
}
