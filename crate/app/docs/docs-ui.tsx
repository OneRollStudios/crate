// Renders the docs that scripts/llms.mjs generates into lib/docs.generated.json:
// the same sections and blocks as the Markdown docs for agents in public/llms.
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import docsData from "@/lib/docs.generated.json";
import { CopyButton } from "./copy-button";
import type { PlaygroundProp } from "./playground";

type Cell = string | { code: string };
export type Block =
  | { type: "text"; text: string }
  | { type: "h3"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "list"; items: string[] }
  | { type: "table"; head: string[]; rows: Cell[][] };
export type Doc = {
  name: string;
  title: string;
  description: string;
  group: "start" | "components" | "adapters" | "agents";
  sections: { heading: string; blocks: Block[] }[];
  playground: PlaygroundProp[] | null;
};

export const docs = docsData as Doc[];
export const groups: { key: Doc["group"]; title: string }[] = [
  { key: "start", title: "Start Here" },
  { key: "components", title: "Components" },
  { key: "adapters", title: "Stream Adapters" },
  { key: "agents", title: "For Coding Agents" },
];

// Text with `inline code`, as written in the generated docs.
export function Inline({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, index) => (part.startsWith("`") && part.endsWith("`") && part.length > 1 ? <code key={index}>{part.slice(1, -1)}</code> : part))}</>;
}

export function CodeBlock({ code, copy = false }: { code: string; copy?: boolean }) {
  return (
    <div className="docs-code-wrap">
      <pre className="docs-code"><code>{code}</code></pre>
      {copy ? <CopyButton text={code} /> : null}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "text") return <p><Inline text={block.text} /></p>;
  if (block.type === "h3") return <h3><code>{block.text}</code></h3>;
  if (block.type === "list") return <ul>{block.items.map((item) => <li key={item}><Inline text={item} /></li>)}</ul>;
  if (block.type === "code") return <CodeBlock code={block.code} copy={block.lang === "bash"} />;
  return (
    <table className="docs-table">
      <thead><tr>{block.head.map((head) => <th key={head} scope="col">{head}</th>)}</tr></thead>
      <tbody>
        {block.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, index) => (
              <td key={index} data-label={block.head[index]}>{typeof cell === "string" ? <Inline text={cell} /> : <code>{cell.code}</code>}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SectionView({ section }: { section: Doc["sections"][number] }) {
  return (
    <section className="docs-section" aria-labelledby={`section-${section.heading}`}>
      <h2 id={`section-${section.heading}`}>{section.heading}</h2>
      {section.blocks.map((block, index) => <BlockView key={index} block={block} />)}
    </section>
  );
}

export function DocsHeader() {
  return (
    <header className="docs-header">
      <Link href="/" className="docs-logo" aria-label="Crate home">crate<span className="logo-period">.</span></Link>
      <nav aria-label="Docs navigation">
        <Link href="/#crates">Components</Link>
        <Link href="/docs/">Docs</Link>
        <a href="https://github.com/OneRollStudios/crate" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a>
      </nav>
    </header>
  );
}
