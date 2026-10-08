"use client";

import { Check, Copy, FileText, MessageSquare } from "lucide-react";
import { useState } from "react";

// Humans / Machines: the same page as the rendered docs or as its Markdown
// (the generated /llms docs), plus actions to copy it, open it, or start a chat
// with it. The human view stays mounted while hidden, so a playground keeps its
// state when switching back.
export function DocView({ markdown, mdPath, mdUrl, subject, children }: { markdown: string; mdPath: string; mdUrl: string; subject: string; children: React.ReactNode }) {
  const [mode, setMode] = useState<"humans" | "machines">("humans");
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const prompt = `Read ${mdUrl} and help me use ${subject} in my project.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2500);
  }

  return (
    <>
      <div className="docs-view-bar">
        <div className="docs-view-toggle" role="group" aria-label="Show this page for">
          <button type="button" aria-pressed={mode === "humans"} onClick={() => setMode("humans")}>Humans</button>
          <button type="button" aria-pressed={mode === "machines"} onClick={() => setMode("machines")}>Machines</button>
        </div>
        <div className="docs-actions">
          <button type="button" onClick={copy}>
            {copied === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied === "copied" ? "Copied" : copied === "failed" ? "Copy Failed" : "Copy as Markdown"}
          </button>
          <a href={mdPath} target="_blank" rel="noreferrer"><FileText size={15} aria-hidden="true" />View as Markdown</a>
          <a href={`https://claude.ai/new?q=${encodeURIComponent(prompt)}`} target="_blank" rel="noreferrer"><MessageSquare size={15} aria-hidden="true" />Open in Claude</a>
          <a href={`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`} target="_blank" rel="noreferrer"><MessageSquare size={15} aria-hidden="true" />Open in ChatGPT</a>
          <span className="sr-only" role="status">{copied === "copied" ? "Markdown copied" : copied === "failed" ? "Copy failed. Use View as Markdown instead." : ""}</span>
        </div>
      </div>
      <div hidden={mode !== "humans"}>{children}</div>
      {mode === "machines" ? (
        <section className="docs-md" aria-label="This page as Markdown">
          <pre><code>{markdown}</code></pre>
        </section>
      ) : null}
    </>
  );
}
