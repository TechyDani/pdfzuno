import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InfoPage } from "@/components/pdf/info-page";
import { blogArticles } from "@/lib/blog/articles";

export const metadata: Metadata = {
  title: "Blogs — PDF Tips and Practical Guides | ZivraTools",
  description:
    "Explore step-by-step guides for ZivraTools's 26 PDF and image tools: merge, split, compress, convert, edit, protect PDFs, and work with images in your browser.",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL
      ? new URL("/blogs/", process.env.NEXT_PUBLIC_SITE_URL).href
      : "/blogs/",
  },
};

export default function BlogsPage() {
  return (
    <InfoPage
      title="Blogs"
      description="Step-by-step guides for every PDF and image tool, with practical examples and answers to common questions."
    >
      <p className="guide-intro">
        Learn how to merge, split, compress, convert, edit, and protect
        documents. Find a complete guide for each of our 26 PDF and image tools,
        including image background removal and WebP conversion, plus focused
        articles on document privacy and specific submission workflows.
      </p>
      <section className="blog-grid" aria-label="Blog articles">
        {blogArticles.map((article) => (
          <Link
            key={article.slug}
            className="blog-card"
            href={`/blogs/${article.slug}/`}
          >
            <span className="blog-category">{article.category}</span>
            <h2>{article.title}</h2>
            <p>{article.excerpt}</p>
            <span className="blog-card-meta">
              {article.author} ·{" "}
              <time dateTime={article.publishedAt}>
                {article.publishedLabel}
              </time>
            </span>
            <span className="blog-read-link">
              Read article <ArrowRight size={16} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>
    </InfoPage>
  );
}
