"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [status, setStatus] = useState(label);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied");
    } catch {
      setStatus("Select to copy");
    }
    window.setTimeout(() => setStatus(label), 2500);
  }
  return (
    <button type="button" className="copy-button" onClick={copy} aria-label={status} title={status}>
      {status === "Copied" ? <Check size={16} /> : <Copy size={16} />}
      <span className="sr-only" role="status">{status}</span>
    </button>
  );
}
