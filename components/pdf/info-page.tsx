import { SiteHeader } from "@/components/pdf/site-header";
import type { ReactNode } from "react";
import Link from "next/link";

export function InfoPage({
  title,
  description,
  updated,
  children,
}: {
  title: string;
  description: string;
  updated?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="shell tool-page">
        <nav className="tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <div className="tool-page-heading info-page-heading">
          <span className="eyebrow">PDFzuno</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {updated && (
            <p className="info-updated">
              Last updated: <time dateTime="2026-10-22">October 22, 2026</time>
            </p>
          )}
        </div>
        <article className="tool-guide info-content" aria-label={title}>
          {children}
        </article>
      </main>
    </>
  );
}
