import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsHeader, SectionView, docs } from "../docs-ui";
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
  const [install, ...rest] = doc.sections;

  return (
    <div className="docs">
      <DocsHeader />
      <main className="docs-main">
        <p className="docs-breadcrumb"><Link href="/docs/">Docs</Link> / {doc.title}</p>
        <h1>{doc.title}</h1>
        <p className="docs-lead">{doc.description}</p>
        <SectionView section={install} />
        {doc.playground ? (
          <section className="docs-section" aria-labelledby="section-playground">
            <h2 id="section-playground">Playground</h2>
            <Playground title={doc.title} props={doc.playground} sample={samples[doc.name] ?? {}} />
          </section>
        ) : null}
        {rest.map((section) => <SectionView key={section.heading} section={section} />)}
        <p className="docs-note">For coding agents: <a href={`/llms/${doc.name}.md`}>{`/llms/${doc.name}.md`}</a>, generated from the same source.</p>
      </main>
    </div>
  );
}
