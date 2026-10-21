import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InfoPage } from "@/components/pdf/info-page";
import { securePdfArticle } from "@/lib/blog/articles";

export const metadata: Metadata = {
  title: "Blogs — PDF Tips and Practical Guides | PDFzuno",
  description:
    "Read practical PDFzuno articles about PDF privacy and managing documents locally without uploading files to online processing servers.",
};

export default function BlogsPage() {
  return (
    <InfoPage
      title="Blogs"
      description="Practical articles to help you work with PDFs thoughtfully and privately."
    >
      <p className="guide-intro">
        Understand how your documents are handled, choose the right tools, and
        build better habits for everyday paperwork. Start with our guide to
        managing PDFs on your own device.
      </p>
      <section
        className="blog-grid blog-grid-single"
        aria-label="Blog articles"
      >
        <Link className="blog-card" href={`/blogs/${securePdfArticle.slug}/`}>
          <span className="blog-category">{securePdfArticle.category}</span>
          <h2>{securePdfArticle.title}</h2>
          <p>{securePdfArticle.excerpt}</p>
          <span className="blog-card-meta">
            {securePdfArticle.author} ·{" "}
            <time dateTime={securePdfArticle.publishedAt}>
              {securePdfArticle.publishedLabel}
            </time>
          </span>
          <span className="blog-read-link">
            Read article <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </section>
    </InfoPage>
  );
}
