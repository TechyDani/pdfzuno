import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/pdf/site-header";
import { articleWordCount, toolArticles } from "@/lib/blog/tool-articles";
import { toolPath } from "@/lib/pdf/tools";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return toolArticles.map(({ slug }) => ({ slug }));
}

function getArticle(slug: string) {
  const article = toolArticles.find((candidate) => candidate.slug === slug);
  if (!article) notFound();
  return article;
}

function pageUrl(path: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  return origin ? new URL(path, origin).href : path;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle((await params).slug);
  const url = pageUrl(`/blogs/${article.slug}/`);
  return {
    title: article.metaTitle,
    description: article.excerpt,
    authors: [{ name: article.author }],
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url,
      locale: "en_US",
      publishedTime: article.publishedAt,
      authors: [article.author],
      section: article.category,
    },
    twitter: {
      card: "summary",
      title: article.title,
      description: article.excerpt,
    },
  };
}

export default async function ToolArticlePage({ params }: Props) {
  const article = getArticle((await params).slug);
  const { tool, guide } = article;
  const url = pageUrl(`/blogs/${article.slug}/`);
  const wordCount = articleWordCount(article);
  const relatedArticles = article.relatedToolIds.map((id) =>
    toolArticles.find((candidate) => candidate.toolId === id)!,
  );
  const contents = [
    { id: "overview", title: `What ${tool.name} does` },
    { id: "how-to", title: "Step-by-step instructions" },
    ...article.sections.map(({ id, title }) => ({ id, title })),
    { id: "use-cases", title: "Practical use cases" },
    { id: "faq", title: "Frequently asked questions" },
    { id: "related-guides", title: "Related guides" },
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.excerpt,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        datePublished: article.publishedAt,
        inLanguage: "en",
        articleSection: article.category,
        wordCount,
        author: { "@type": "Organization", name: article.author },
        publisher: { "@type": "Organization", name: "ZivraTools" },
        about: { "@type": "Thing", name: tool.name },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: pageUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blogs",
            item: pageUrl("/blogs/"),
          },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: guide.faqs.map(({ title, text }) => ({
          "@type": "Question",
          name: title,
          acceptedAnswer: { "@type": "Answer", text },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main className="shell blog-article-page">
        <nav className="tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blogs/">Blogs</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{tool.name} guide</span>
        </nav>
        <article className="blog-article" aria-labelledby="article-title">
          <header className="article-masthead">
            <span className="eyebrow">
              <BookOpen size={14} aria-hidden="true" /> {article.category}
            </span>
            <h1 id="article-title">{article.title}</h1>
            <p className="article-deck">{article.excerpt}</p>
            <div className="article-byline">
              <span className="article-author-icon" aria-hidden="true">
                <UserRound size={20} />
              </span>
              <div>
                <span className="article-author-name">By {article.author}</span>
                <span>
                  Published{" "}
                  <time dateTime={article.publishedAt}>
                    {article.publishedLabel}
                  </time>
                  {" · "}
                  {Math.ceil(wordCount / 200)} min read
                </span>
              </div>
            </div>
          </header>
          <div className="article-layout">
            <aside>
              <nav className="article-toc" aria-label="In this article">
                <h2>In this article</h2>
                <ol>
                  {contents.map(({ id, title }) => (
                    <li key={id}>
                      <a href={`#${id}`}>{title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
            <div className="article-prose">
              <p className="article-lead">{article.answer}</p>
              <div className="article-takeaway">
                <strong>Ready to work on your file?</strong>
                <p>
                  <Link href={toolPath(tool)}>Open {tool.name}</Link>
                  {" — "}Free, no sign-up, and local processing in your browser.
                </p>
              </div>
              <section id="overview" aria-labelledby="overview-title">
                <h2 id="overview-title">What does {tool.name} do?</h2>
                <p>{guide.intro}</p>
              </section>
              <section id="how-to" aria-labelledby="how-to-title">
                <h2 id="how-to-title">How to use {tool.name}: step by step</h2>
                <ol className="article-steps">
                  {guide.steps.map(({ title, text }) => (
                    <li key={title}>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </li>
                  ))}
                </ol>
              </section>
              {article.sections.map(({ id, title, paragraphs }) => (
                <section key={id} id={id} aria-labelledby={`${id}-title`}>
                  <h2 id={`${id}-title`}>{title}</h2>
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </section>
              ))}
              <section id="use-cases" aria-labelledby="use-cases-title">
                <h2 id="use-cases-title">Practical ways to use {tool.name}</h2>
                {guide.useCases.map(({ title, text }) => (
                  <div className="article-faq" key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </section>
              <section id="faq" aria-labelledby="faq-title">
                <h2 id="faq-title">{tool.name}: frequently asked questions</h2>
                {guide.faqs.map(({ title, text }) => (
                  <div className="article-faq" key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
              </section>
              <section
                id="related-guides"
                aria-labelledby="related-guides-title"
              >
                <h2 id="related-guides-title">Continue with related guides</h2>
                <ul className="article-related-guides">
                  {relatedArticles.map((related) => (
                    <li key={related.slug}>
                      <Link href={`/blogs/${related.slug}/`}>
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
              <nav
                className="article-next-links"
                aria-label="Article navigation"
              >
                <Link href="/blogs/">
                  <ArrowLeft size={16} aria-hidden="true" />
                  All articles
                </Link>
                <Link href={toolPath(tool)}>
                  Try {tool.name}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
