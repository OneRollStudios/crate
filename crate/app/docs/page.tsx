import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Blueprint } from "./blueprints";
import { CodeBlock, DocsHeader, categories, docsIn } from "./docs-ui";
import { SITE_URL } from "@/lib/config";
import "./docs.css";

export const metadata: Metadata = {
  title: "Docs | Crate",
  description: "Reference for every Crate component, hook, and stream adapter: props, states, labels, and a live playground.",
  alternates: { canonical: "/docs/" },
};

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
        <div className="docs-groups">
          {categories.map((category) => (
            <section className="docs-group" key={category.key} aria-labelledby={`group-${category.key}`}>
              <div className="docs-group-art"><Blueprint kind={category.key} /></div>
              <div className="docs-group-text">
                <h2 id={`group-${category.key}`}>{category.title}</h2>
                <p>{category.blurb}</p>
                <ul className="docs-group-links">
                  {docsIn(category).map((doc) => (
                    <li key={doc.name}><Link href={`/docs/${doc.name}/`}>{doc.title}</Link></li>
                  ))}
                  {category.links?.map((link) => (
                    <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer">{link.title} <ArrowUpRight size={13} aria-hidden="true" /></a></li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
