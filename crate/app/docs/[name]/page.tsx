import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardView, DocCard, DocsHeader, DocsSidebar, OnThisPage, cardsFor, categoryOf, docs, docsIn } from "../docs-ui";
import { Playground } from "../playground";
import { samples } from "../samples";
import "../docs.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return docs.map((doc) => ({ name: doc.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const doc = docs.find((item) => item.name === name);
  return doc ? { title: `${doc.title} | Crate Docs`, description: doc.description, alternates: { canonical: `/docs/${doc.name}/` } } : {};
}

export default async function DocPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const doc = docs.find((item) => item.name === name);
  if (!doc) notFound();
  const category = categoryOf(doc);
  const cards = cardsFor(doc);
  const related = category ? docsIn(category).filter((item) => item.name !== doc.name) : [];
  const toc = [
    ...(doc.playground ? [{ id: "preview", title: "Preview and Playground" }] : []),
    ...cards.map((card) => ({ id: card.id, title: card.title })),
    ...(related.length ? [{ id: "related", title: "Related Components" }] : []),
  ];

  return (
    <div className="docs">
      <DocsHeader />
      <div className="docs-layout">
        <DocsSidebar current={doc.name} />
        <main className="docs-page">
          <p className="docs-breadcrumb"><Link href="/docs/">Docs</Link>{category ? <> / {category.title}</> : null}</p>
          <h1>{doc.title}</h1>
          <p className="docs-lead">{doc.description}</p>
          <div className="docs-cards">
            {doc.playground ? (
              <DocCard id="preview" title="Preview and Playground">
                <Playground title={doc.title} props={doc.playground} sample={samples[doc.name] ?? {}} />
              </DocCard>
            ) : null}
            {cards.map((card) => <CardView key={card.id} card={card} />)}
            {related.length ? (
              <DocCard id="related" title="Related Components">
                <ul className="docs-related">
                  {related.map((item) => (
                    <li key={item.name}><Link href={`/docs/${item.name}/`}><strong>{item.title}</strong><span>{item.description}</span></Link></li>
                  ))}
                </ul>
              </DocCard>
            ) : null}
          </div>
          <p className="docs-note">For coding agents: <a href={`/llms/${doc.name}.md`}>{`/llms/${doc.name}.md`}</a>, generated from the same source.</p>
        </main>
        <OnThisPage items={toc} />
      </div>
    </div>
  );
}
