import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CodeBlock, DocsHeader, categories, docsIn, type Doc } from "./docs-ui";
import { DocPreview } from "./doc-preview";
import { SITE_URL } from "@/lib/config";
import "./docs.css";

export const metadata: Metadata = {
  title: "Docs | Crate",
  description: "Reference for every Crate component, hook, and stream adapter: props, states, labels, and a live playground.",
  alternates: { canonical: "/docs/" },
};

// The line of code a card shows when the doc has no visual component.
function codeLine(doc: Doc) {
  const code = (heading: string) => doc.sections.find((section) => section.heading === heading)?.blocks.find((block) => block.type === "code");
  const block = code("Import") ?? code("Install");
  return block && block.type === "code" ? block.code.split("\n")[0] : doc.title;
}

export default function DocsIndex() {
  return (
    <div className="docs">
      <DocsHeader />
      <main className="docs-home">
        <div className="docs-home-intro">
          <h1>Docs</h1>
          <p className="docs-lead">Every Crate component, hook, and stream adapter, generated from the source on every build. Each page has its props, states, labels, and an example; components also have a live playground.</p>
          <CodeBlock code={`npx shadcn@latest add ${SITE_URL}/r/all.json`} copy />
          <p className="docs-note">For coding agents, the same docs are at <a href="/llms.txt">/llms.txt</a>.</p>
        </div>
        {categories.map((category) => (
          <section className="docs-group" key={category.key} aria-labelledby={`group-${category.key}`}>
            <h2 id={`group-${category.key}`}>{category.title}</h2>
            <ul className="docs-grid">
              {docsIn(category).map((doc) => (
                <li key={doc.name}>
                  <div className="docs-tile">
                    <DocPreview name={doc.name} title={doc.title} code={codeLine(doc)} />
                    <div className="docs-tile-text">
                      <Link className="docs-tile-link" href={`/docs/${doc.name}/`}>{doc.title}</Link>
                      <p>{doc.description}</p>
                    </div>
                  </div>
                </li>
              ))}
              {category.links?.map((link) => (
                <li key={link.href}>
                  <div className="docs-tile">
                    <DocPreview name="" title="" code={link.preview} />
                    <div className="docs-tile-text">
                      <a className="docs-tile-link" href={link.href} target="_blank" rel="noreferrer">{link.title} <ArrowUpRight size={14} aria-hidden="true" /></a>
                      <p>{link.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
