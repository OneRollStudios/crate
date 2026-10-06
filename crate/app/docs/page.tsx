import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock, DocsHeader, docs, groups } from "./docs-ui";
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
      <main className="docs-main">
        <h1>Docs</h1>
        <p className="docs-lead">Every Crate component, hook, and stream adapter, generated from the source on every build. Each page has its props, states, labels, and an example; components also have a live playground.</p>
        <CodeBlock code={`npx shadcn@latest add ${SITE_URL}/r/all.json`} copy />
        <p className="docs-note">For coding agents, the same docs are at <a href="/llms.txt">/llms.txt</a>.</p>
        {groups.map((group) => (
          <section className="docs-section" key={group.key} aria-labelledby={`group-${group.key}`}>
            <h2 id={`group-${group.key}`}>{group.title}</h2>
            <ul className="docs-index">
              {docs.filter((doc) => doc.group === group.key).map((doc) => (
                <li key={doc.name}>
                  <Link href={`/docs/${doc.name}/`}><strong>{doc.title}</strong><span>{doc.description}</span></Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
