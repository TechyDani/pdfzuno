import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, UserRound } from "lucide-react";
import { SiteHeader } from "@/components/pdf/site-header";
import {
  landRegistryCompressArticle as article,
  securePdfArticle,
} from "@/lib/blog/articles";

const articlePath = `/blogs/${article.slug}/`;
const origin = process.env.NEXT_PUBLIC_SITE_URL;
const articleUrl = origin ? new URL(articlePath, origin).href : articlePath;
const uploadGuidance =
  "https://www.gov.uk/government/news/enhancements-to-the-hm-land-registry-portal";
const planGuidance =
  "https://www.gov.uk/government/publications/preparing-plans-for-land-registry-applications/guidance-for-preparing-plans-for-land-registry-applications";
const apiGuidance =
  "https://landregistry.github.io/bg-dev-pack-redesign/apis/send-a-document/1.0/technical-guide/";

export const metadata: Metadata = {
  title: "Compress PDF for HM Land Registry Uploads: UK Guide | PDFZivra",
  description: article.excerpt,
  authors: [{ name: article.author }],
  alternates: { canonical: articleUrl },
  openGraph: {
    title: article.title,
    description: article.excerpt,
    type: "article",
    url: articleUrl,
    locale: "en_GB",
    publishedTime: article.publishedAt,
    authors: [article.author],
  },
  twitter: {
    card: "summary",
    title: article.title,
    description: article.excerpt,
  },
};

const contents = [
  { id: "check-upload-limit", title: "Check the upload limit and service" },
  { id: "choose-compression", title: "Choose the right compression" },
  { id: "compress-step-by-step", title: "Compress your PDF step by step" },
  { id: "protect-plan-quality", title: "Preserve plan detail and scale" },
  { id: "upload-problems", title: "If the PDF still will not upload" },
  { id: "document-privacy", title: "Keep conveyancing documents private" },
  { id: "faq", title: "Frequently asked questions" },
];

const faqs = [
  {
    question: "What is the HM Land Registry PDF upload size limit?",
    answer:
      "HM Land Registry announced a portal increase from 20 MB to 40 MB in July 2024, including Business Gateway. Its current Send a document API specifies 40 MiB per document. Check the particular service's guidance and on-screen limit before submitting; a solicitor's separate client portal may use a different limit.",
  },
  {
    question: "Can I compress a Land Registry plan without losing quality?",
    answer:
      "Start with Lossless to preserve text and vector content without deliberately lowering image resolution. The reduction may be small. PDFZivra's Balanced and Smallest settings rasterise pages below the 200 dpi minimum recommended for scanned plans, so use Lossless for plans and compare the output with the original.",
  },
  {
    question: "Does compressing a PDF guarantee HM Land Registry acceptance?",
    answer:
      "No. File size is only one check. The document must also be complete, readable and suitable for the application, with any required certification and execution requirements satisfied. PDFZivra optimises a file; it does not certify a copy or check the legal sufficiency of an application.",
  },
  {
    question: "Can I upload a password-protected PDF?",
    answer:
      "The Business Gateway Send a document guidance says PDFs must not be password protected. Check your own submission service's requirements too. Confirm that the final file opens without a password before uploading; do not assume compression removed protection, especially if the tool returned the original file unchanged.",
  },
  {
    question: "Is PDFZivra free, and does it upload my deeds?",
    answer:
      "The current Compress PDF tool is free and requires no account. Selected documents are processed locally in your browser, with a 50 MB combined input limit per operation. Downloading the result does not submit anything to HM Land Registry; you must attach the reviewed copy through the appropriate service yourself.",
  },
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: article.title,
  description: article.excerpt,
  datePublished: article.publishedAt,
  inLanguage: "en-GB",
  articleSection: article.category,
  author: { "@type": "Person", name: article.author },
  publisher: { "@type": "Organization", name: "PDFZivra" },
  ...(origin && {
    url: articleUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  }),
};

export default function LandRegistryCompressArticlePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <SiteHeader />
      <main className="shell blog-article-page" lang="en-GB">
        <nav className="tool-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/blogs/">Blogs</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Compress PDF for HM Land Registry</span>
        </nav>
        <article className="blog-article" aria-labelledby="article-title">
          <header className="article-masthead">
            <span className="eyebrow">
              <FileText size={14} aria-hidden="true" /> {article.category}
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
                  Software engineer · Published{" "}
                  <time dateTime={article.publishedAt}>
                    {article.publishedLabel}
                  </time>
                </span>
              </div>
            </div>
          </header>
          <div className="article-layout">
            <aside>
              <nav className="article-toc" aria-label="In this article">
                <h2>In this article</h2>
                <ol>
                  {contents.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`}>{section.title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
            <div className="article-prose">
              <p className="article-lead">
                To compress a PDF for HM Land Registry uploads, keep the
                original, open{" "}
                <Link href="/tools/compress-pdf/">Compress PDF</Link>, and start
                with Lossless. Download the result, check its actual file size,
                and compare every page with the source before attaching it to
                your application. A smaller file is useful only if deeds,
                signatures and plan details remain clear.
              </p>
              <div className="article-takeaway">
                <strong>
                  UK focus: HM Land Registry covers England and Wales
                </strong>
                <p>
                  <a href="https://www.gov.uk/government/organisations/land-registry/about">
                    HM Land Registry registers land and property in England and
                    Wales
                  </a>
                  . Use the relevant registration service for property in
                  Scotland or Northern Ireland. This guide focuses on preparing
                  PDF attachments for HM Land Registry services.
                </p>
              </div>

              <section
                id="check-upload-limit"
                aria-labelledby="check-upload-limit-title"
              >
                <h2 id="check-upload-limit-title">
                  What is the HM Land Registry upload limit?
                </h2>
                <p>
                  Older guidance may mention 20 MB. HM Land Registry&apos;s{" "}
                  <a href={uploadGuidance}>15 July 2024 portal update</a>{" "}
                  increased the limit to 40 MB and extended the change to
                  Business Gateway. Its current{" "}
                  <a href={apiGuidance}>Send a document API guidance</a>{" "}
                  specifies 40 MiB (41,943,040 bytes) for a single document.
                  Check the limit displayed by your specific service, rather
                  than treating a rounded file-size label as a guarantee.
                </p>
                <p>
                  An attachment limit concerns an individual file. Combining
                  several deeds into one PDF can make that attachment too large.
                  Follow the service&apos;s document categories and instructions
                  instead of assuming the entire application should be a single
                  bundle. If a solicitor has asked you to upload documents to
                  their client portal, check that portal&apos;s own
                  requirements.
                </p>
                <p>
                  Confirm that an online application is the right route. The{" "}
                  <a href="https://www.gov.uk/government/publications/digital-registration-service">
                    Digital Registration Service guidance
                  </a>{" "}
                  explains business customer access and directs first
                  registrations using FR1 to the postal route. Making a PDF
                  smaller does not change how an application must be lodged.
                </p>
              </section>

              <section
                id="choose-compression"
                aria-labelledby="choose-compression-title"
              >
                <h2 id="choose-compression-title">
                  Choose compression that preserves the document
                </h2>
                <p>
                  <strong>Lossless</strong> optimises PDF storage while
                  preserving text and vectors. It is the starting choice for
                  deeds, detailed plans and documents whose existing image
                  resolution matters. An already efficient PDF may barely
                  shrink; there is no fixed reduction percentage or automatic
                  target-size setting.
                </p>
                <p>
                  <strong>Balanced</strong> and <strong>Smallest</strong> turn
                  pages into JPEG images, removing searchable text, interactive
                  fields and links. Their output resolution is at most 108 dpi
                  and 72 dpi respectively, and can be lower for large pages.
                  These settings are unsuitable for plans requiring the scanned
                  plan standard described below. For other documents, use them
                  only if your submission requirements permit the resulting
                  image-based copy and every detail remains readable.
                </p>
                <p>
                  A digitally signed PDF needs separate care. Rewriting a signed
                  file can affect signature verification even when the page
                  looks unchanged. Retain the signed original and confirm the
                  appropriate submission copy with the conveyancer responsible
                  for the application before processing it.
                </p>
              </section>

              <section
                id="compress-step-by-step"
                aria-labelledby="compress-step-by-step-title"
              >
                <h2 id="compress-step-by-step-title">
                  How to compress your PDF for upload
                </h2>
                <ol className="article-steps">
                  <li>
                    <h3>
                      Keep the original and check the attachment requirements
                    </h3>
                    <p>
                      Save an untouched source file. Check the required document
                      type, current upload limit and any certification
                      instructions. If your file already fits and meets the
                      requirements, further compression may be unnecessary.
                    </p>
                  </li>
                  <li>
                    <h3>Add your PDF to the compressor</h3>
                    <p>
                      Open{" "}
                      <Link href="/tools/compress-pdf/">
                        PDFZivra Compress PDF
                      </Link>{" "}
                      and select your working copy. The tool accepts up to 50 MB
                      of combined input per operation. A source above that limit
                      needs a suitable desktop workflow or a fresh,
                      appropriately configured scan before using this tool.
                    </p>
                  </li>
                  <li>
                    <h3>Start with Lossless and download the result</h3>
                    <p>
                      Select Lossless under Compression, press Compress PDF,
                      then download the PDF. Check its saved size in your file
                      manager. If the attempted compression would not reduce
                      size, PDFZivra returns the original instead; read the
                      result message before assuming anything changed.
                    </p>
                  </li>
                  <li>
                    <h3>Compare every page with the source</h3>
                    <p>
                      Check the page count, sequence, orientation and
                      dimensions. Read small text and inspect signatures, stamps
                      and faint marks. For a plan, follow the checks below. Use
                      the downloaded file for this review so you assess the
                      exact copy you will attach.
                    </p>
                  </li>
                  <li>
                    <h3>Attach the reviewed copy in the appropriate service</h3>
                    <p>
                      Choose the correct document category and complete any
                      required certification statement. Where the service lets
                      you open the attached file, verify it again. Follow the
                      application&apos;s submission and confirmation steps;
                      downloading a compressed PDF does not lodge an
                      application.
                    </p>
                  </li>
                </ol>
              </section>

              <section
                id="protect-plan-quality"
                aria-labelledby="protect-plan-quality-title"
              >
                <h2 id="protect-plan-quality-title">
                  Preserve plan colours, dimensions and fine detail
                </h2>
                <p>
                  HM Land Registry&apos;s{" "}
                  <a href={planGuidance}>
                    guidance for preparing plans, section 10
                  </a>
                  , recommends scanning plans at their original size, in full
                  colour, at 200–600 dpi. Its guidance also addresses limits on
                  scanned plan pages and paper size. Use the full guidance for
                  the particular plan you are lodging.
                </p>
                <p>
                  Compare coloured edging, hatching, labels, measurements and
                  the scale bar with the source. Keep the original page
                  dimensions; avoid printing and rescanning with a fit-to-page
                  setting. If lines become indistinct or colour references
                  become ambiguous, return to the source. Do not trade away plan
                  clarity merely to reach a smaller file size.
                </p>
              </section>

              <section
                id="upload-problems"
                aria-labelledby="upload-problems-title"
              >
                <h2 id="upload-problems-title">
                  What if the PDF still will not upload?
                </h2>
                <p>
                  Read the exact error. A file can be under the size limit and
                  still fail because it is damaged, in the wrong format or
                  protected. The{" "}
                  <a href={apiGuidance}>Business Gateway document guidance</a>{" "}
                  excludes password-protected PDFs. Open your final copy to
                  check it works and confirm its protection status; compression
                  may have returned your original file unchanged.
                </p>
                <p>
                  If size remains the problem, return to the source scan or
                  export settings. For plans, keep within the recommended scan
                  range and preserve original dimensions. Avoid repeatedly
                  compressing an already degraded copy. A clean source often
                  gives you better options than processing the same download
                  again.
                </p>
                <p>
                  Use <Link href="/tools/split-pdf/">Split PDF</Link> or{" "}
                  <Link href="/tools/extract-pdf-pages/">Extract pages</Link>{" "}
                  only when the receiving service permits separate attachments
                  and the application remains complete. Do not remove a deed
                  page, plan or required evidence to fit a limit. If you cannot
                  make a suitable attachment, consult the service guidance or
                  the conveyancer handling the application about the next step.
                </p>
              </section>

              <section
                id="document-privacy"
                aria-labelledby="document-privacy-title"
              >
                <h2 id="document-privacy-title">
                  Keep conveyancing documents private during preparation
                </h2>
                <p>
                  Deeds and supporting documents may contain names, addresses,
                  signatures and financial information. PDFZivra processes
                  selected files locally in your browser without sending
                  document contents to a compression server. The site still
                  downloads application resources; our{" "}
                  <Link href="/privacy-policy/">Privacy Policy</Link> explains
                  the current connections.
                </p>
                <p>
                  Use a trusted device and follow your organisation&apos;s
                  document-handling rules. Check whether the downloads folder
                  syncs to a shared or cloud location, and keep working copies
                  with the intended matter records. Our guide to{" "}
                  <Link href={`/blogs/${securePdfArticle.slug}/`}>
                    managing PDFs without uploading
                  </Link>{" "}
                  covers local processing and storage in more detail.
                </p>
              </section>

              <section id="faq" aria-labelledby="faq-title">
                <h2 id="faq-title">
                  HM Land Registry PDF compression: frequently asked questions
                </h2>
                {faqs.map((faq) => (
                  <div key={faq.question} className="article-faq">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))}
              </section>

              <div className="article-takeaway">
                <strong>Prepare a smaller PDF and check the result</strong>
                <p>
                  Start with{" "}
                  <Link href="/tools/compress-pdf/">
                    free lossless PDF compression
                  </Link>
                  , compare the saved size and inspect the output. Keep the
                  original, preserve essential detail and submit the reviewed
                  copy through the appropriate HM Land Registry service.
                </p>
              </div>
              <div className="article-author-note">
                <strong>About the author and this guide</strong>
                <p>
                  Danyal Khan is a software engineer and the creator of PDFZivra.
                  Official guidance was checked on 26 October 2026. This article
                  covers file preparation; follow HM Land Registry&apos;s
                  current instructions and your conveyancer&apos;s advice for
                  application requirements.{" "}
                  <Link href="/about-us/">About PDFZivra</Link>.
                </p>
              </div>
              <nav className="article-next-links" aria-label="Article links">
                <Link href="/blogs/">
                  <ArrowLeft size={16} aria-hidden="true" /> Back to Blogs
                </Link>
                <Link href="/tools/compress-pdf/">
                  Try Compress PDF <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
