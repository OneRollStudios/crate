// Renders the docs that scripts/llms.mjs generates into lib/docs.generated.json:
// the same sections and blocks as the Markdown docs for agents in public/llms.
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import docsData from "@/lib/docs.generated.json";
import { CopyButton } from "./copy-button";
import { ThemeToggle } from "./theme-toggle";
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

// How the docs are grouped and laid out. Only presentation: every page and
// section still comes from lib/docs.generated.json, so a doc missing from the
// categories below still shows up, under "More".
export type Category = { key: string; title: string; names: string[]; links?: { title: string; description: string; href: string; preview: string }[] };
const categoryList: Category[] = [
  { key: "start", title: "Start Here", names: ["use-agent-status", "agent-state", "crate-provider", "crate-skill"] },
  { key: "before", title: "Before It Answers", names: ["thinking", "queue", "file-processing"] },
  { key: "while", title: "While It Works", names: ["reasoning-trace", "tool-call", "agent-plan", "streaming", "sources"] },
  { key: "needs", title: "When It Needs You, or Breaks", names: ["approval", "stalled", "error"] },
  { key: "done", title: "When It\u2019s Done", names: ["done"] },
  { key: "adapters", title: "Adapters", names: ["agent-stream", "openai-agents-adapter", "langchain-adapter"] },
  {
    key: "web",
    title: "Web Components",
    names: [],
    links: [{
      title: "Crate Elements",
      description: "Every component as a custom element, for Vue, Svelte, Angular, or plain HTML.",
      href: "https://github.com/OneRollStudios/crate/tree/main/crate/elements#readme",
      preview: "<crate-thinking></crate-thinking>",
    }],
  },
];
const placed = new Set(categoryList.flatMap((category) => category.names));
const unplaced = docs.filter((doc) => !placed.has(doc.name)).map((doc) => doc.name);
export const categories: Category[] = unplaced.length ? [...categoryList, { key: "more", title: "More", names: unplaced }] : categoryList;
export const docsIn = (category: Category) => category.names.map((name) => docs.find((doc) => doc.name === name)).filter((doc): doc is Doc => Boolean(doc));
export const categoryOf = (doc: Doc) => categories.find((category) => category.names.includes(doc.name));

// A component page as separate cards, in this order. Sections that belong
// together share a card (Import goes with Install, Types with Props or
// Functions); a section not named here gets its own card before Related.
export type Card = { id: string; title: string; parts: { heading: string | null; blocks: Block[] }[] };
const cardOrder: { title: string; id: string; sections: string[] }[] = [
  { title: "Install", id: "install", sections: ["Install", "Import"] },
  { title: "Usage", id: "usage", sections: ["Example"] },
  { title: "Props", id: "props", sections: ["Props", "Types"] },
  { title: "Functions", id: "functions", sections: ["Functions", "Types"] },
  { title: "Signature", id: "signature", sections: ["Signature"] },
  { title: "Options", id: "options", sections: ["Options"] },
  { title: "Returns", id: "returns", sections: ["Returns"] },
  { title: "States", id: "states", sections: ["States"] },
  { title: "Labels", id: "labels", sections: ["Labels"] },
  { title: "Files", id: "files", sections: ["Files"] },
];
export function cardsFor(doc: Doc): Card[] {
  const used = new Set<string>();
  const cards: Card[] = [];
  for (const card of cardOrder) {
    const parts = card.sections
      .filter((heading) => !used.has(heading))
      .map((heading) => doc.sections.find((section) => section.heading === heading))
      .filter((section): section is Doc["sections"][number] => Boolean(section));
    if (!parts.length || parts[0].heading !== card.sections[0]) continue;
    parts.forEach((section) => used.add(section.heading));
    cards.push({ id: card.id, title: card.title, parts: parts.map((section, index) => ({ heading: index ? section.heading : null, blocks: section.blocks })) });
  }
  for (const section of doc.sections) {
    if (used.has(section.heading)) continue;
    cards.push({ id: section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: section.heading, parts: [{ heading: null, blocks: section.blocks }] });
  }
  return cards;
}

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

export function DocCard({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section className="docs-card" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {children}
    </section>
  );
}

export function CardView({ card }: { card: Card }) {
  return (
    <DocCard id={card.id} title={card.title}>
      {card.parts.map((part) => (
        <div className="docs-card-part" key={part.heading ?? "main"}>
          {part.heading ? <h3 className="docs-card-subheading">{part.heading}</h3> : null}
          {part.blocks.map((block, index) => <BlockView key={index} block={block} />)}
        </div>
      ))}
    </DocCard>
  );
}

// All docs by category: the left sidebar on wide screens, a menu on narrow ones.
function DocsNavList({ current }: { current?: string }) {
  return (
    <>
      <Link href="/docs/" className="docs-nav-home" aria-current={current ? undefined : "page"}>All Docs</Link>
      {categories.map((category) => (
        <div className="docs-nav-group" key={category.key}>
          <p className="docs-nav-title">{category.title}</p>
          <ul>
            {docsIn(category).map((doc) => (
              <li key={doc.name}><Link href={`/docs/${doc.name}/`} aria-current={doc.name === current ? "page" : undefined}>{doc.title}</Link></li>
            ))}
            {category.links?.map((link) => (
              <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer">{link.title} <ArrowUpRight size={12} aria-hidden="true" /></a></li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function DocsSidebar({ current }: { current?: string }) {
  return (
    <>
      <nav className="docs-sidebar" aria-label="All docs"><DocsNavList current={current} /></nav>
      <details className="docs-menu">
        <summary>All Docs</summary>
        <nav aria-label="All docs menu"><DocsNavList current={current} /></nav>
      </details>
    </>
  );
}

export function OnThisPage({ items }: { items: { id: string; title: string }[] }) {
  return (
    <nav className="docs-toc" aria-label="On this page">
      <p className="docs-nav-title">On This Page</p>
      <ul>{items.map((item) => <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ul>
    </nav>
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
      <ThemeToggle />
    </header>
  );
}
