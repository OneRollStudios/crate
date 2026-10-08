"use client";

import * as Crate from "@/components/agent-wait-states";
import { samples } from "./samples";

// The small live preview on a docs home card: the real component with the
// playground's sample props. Docs without a visual component (the hook, the
// provider, adapters) show a line of their code instead. Previews are inert:
// the card's title link covers the whole card, so nothing inside can take focus or clicks.
export function DocPreview({ name, title, code }: { name: string; title: string; code: string }) {
  const Component = (Crate as unknown as Record<string, React.ComponentType<Record<string, unknown>> | undefined>)[title];
  const sample = samples[name];
  return (
    <div className="docs-preview" aria-hidden="true" inert>
      {Component && sample ? (
        <div className="docs-preview-stage"><Component {...sample} /></div>
      ) : (
        <pre className="docs-preview-code"><code>{code}</code></pre>
      )}
    </div>
  );
}
