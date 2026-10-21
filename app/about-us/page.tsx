import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/pdf/info-page";

export const metadata: Metadata = {
  title: "About Us — Built by Danyal Khan | PDFzuno",
  description:
    "PDFzuno was built by Danyal Khan, a software engineer, to help people handle everyday PDF and image tasks with free tools that process files locally.",
};

export default function AboutUsPage() {
  return (
    <InfoPage
      title="About Us"
      description="Built by Danyal Khan to help people spend less time on paperwork and more time on what matters."
    >
      <p className="guide-intro">
        PDFzuno was built by Danyal Khan, a software engineer, to help other
        people complete everyday document tasks more easily. The mission is
        straightforward: make useful PDF and image tools accessible,
        understandable, and respectful of the files people trust them with.
      </p>
      <section className="guide-section">
        <h2>A practical tool for everyday problems</h2>
        <p>
          A small document task can interrupt a much bigger goal. A student
          needs to compress an assignment for a university portal. A job
          applicant needs to combine certificates into one PDF. A teacher wants
          to share a few pages from a longer handout, and a small business needs
          a clear copy of a document for a customer.
        </p>
        <p>
          Danyal created PDFzuno to help with those moments. The toolkit brings
          together tools for merging, splitting, compressing, organizing,
          converting, and editing documents, along with useful image tasks. Each
          tool has its own page with instructions, practical examples, and
          answers to common questions, so people can understand the options
          before working on a file.
        </p>
      </section>
      <section className="guide-section">
        <h2>Privacy is part of the design</h2>
        <p>
          Helping people also means respecting the personal and professional
          information in their documents. PDFzuno processes selected files
          locally in the user&apos;s browser, rather than uploading them to a
          processing server. You choose your files, run the tool on your device,
          and download the result.
        </p>
        <p>
          The website still downloads the code, fonts, and model assets needed
          to run its tools. Our{" "}
          <Link href="/privacy-policy/">Privacy Policy</Link> explains those
          connections and the difference between loading website assets and
          uploading a document.
        </p>
      </section>
      <section className="guide-section">
        <h2>Useful tools with clear expectations</h2>
        <p>
          The current toolkit is free to use and does not require an account.
          Its goal is to reduce unnecessary steps for students, teachers,
          professionals, and anyone dealing with digital paperwork.
        </p>
        <p>
          Clear expectations matter as much as convenience. Some conversions can
          change layout, scanned pages need a separate OCR workflow to become
          editable text, and important outputs should always be checked. PDFzuno
          explains these limitations so you can decide whether a tool fits the
          task in front of you.
        </p>
      </section>
      <section className="guide-section">
        <h2>Built to help, with room to improve</h2>
        <p>
          Danyal&apos;s aim is to use software engineering to make everyday work
          a little easier for other people. PDFzuno reflects that aim through
          focused tools, local file processing, and guidance that helps people
          use each feature with confidence.
        </p>
        <p>
          Questions, feedback, and suggestions are welcome at{" "}
          <a href="mailto:info@pdfzuno.pk">info@pdfzuno.pk</a>. Please describe
          the issue without sending confidential documents or passwords. You can
          also read the <Link href="/terms-of-service/">Terms of Service</Link>{" "}
          or <Link href="/#tools">explore all tools</Link> to find the one you
          need.
        </p>
      </section>
    </InfoPage>
  );
}
