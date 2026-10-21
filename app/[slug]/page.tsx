import { SiteHeader } from "@/components/pdf/site-header";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Workspace } from "@/components/pdf/workspace";
import { tools } from "@/lib/pdf/tools";
import { commonFaqs, guides } from "@/lib/pdf/guides";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);
  if (!tool) notFound();
  const title = `${tool.name} — Free Online Tool | PDFzuno`;
  const description = `${tool.description} Free local processing, a step-by-step guide, practical use cases, and answers about formats, security, and file sizes.`;
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    title,
    description,
    ...(origin && { alternates: { canonical: new URL(`/${slug}/`, origin) } }),
    openGraph: { title, description, type: "website" },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = tools.find((candidate) => candidate.slug === slug);
  if (!tool) notFound();
  const guide = guides[tool.id];
  const related = tools
    .filter(
      (candidate) =>
        candidate.id !== tool.id && candidate.category === tool.category,
    )
    .slice(0, 4);

  return (
    <>
      <SiteHeader />
      <main className="shell tool-page">
        <nav className="tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{tool.name}</span>
        </nav>
        <div className="tool-page-heading">
          <span className="eyebrow">{tool.category}</span>
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>
          <div className="trust">
            <span>
              <ShieldCheck size={15} /> Files stay on your device
            </span>
            <span>Free · No sign-up · 50 MB total input</span>
          </div>
        </div>
        <Workspace key={tool.id} tool={tool} />
        <article className="tool-guide" aria-label={`${tool.name} guide`}>
          <nav className="guide-navigation" aria-label="On this page">
            <a href="#how-to">How to use</a>
            <a href="#use-cases">Use cases</a>
            <a href="#faq">FAQs</a>
          </nav>
          <p className="guide-intro">{guide.intro}</p>
          <section id="how-to" className="guide-section">
            <h2>How to use {tool.name}</h2>
            <ol className="guide-steps">
              {guide.steps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
          <section id="use-cases" className="guide-section">
            <h2>When to use {tool.name}</h2>
            <div className="guide-use-cases">
              {guide.useCases.map((useCase) => (
                <div key={useCase.title}>
                  <h3>{useCase.title}</h3>
                  <p>{useCase.text}</p>
                </div>
              ))}
            </div>
          </section>
          <section id="faq" className="guide-section">
            <h2>{tool.name}: frequently asked questions</h2>
            <div className="guide-faqs">
              {[...guide.faqs, ...commonFaqs].map((faq) => (
                <div key={faq.title}>
                  <h3>{faq.title}</h3>
                  <p>{faq.text}</p>
                </div>
              ))}
            </div>
          </section>
        </article>
        <nav className="related-tools" aria-label="Related tools">
          <h2>More {tool.category.toLowerCase()} tools</h2>
          <div>
            {related.map((candidate) => (
              <Link key={candidate.id} href={`/${candidate.slug}/`}>
                {candidate.name}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </nav>
      </main>
    </>
  );
}
