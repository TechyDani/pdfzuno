import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/pdf/info-page";

export const metadata: Metadata = {
  title: "Terms of Service | PDFzuno",
  description:
    "Read the rules for using PDFzuno, including authorized file use, local processing, tool limitations, output review, and software licensing.",
};

export default function TermsOfServicePage() {
  return (
    <InfoPage
      title="Terms of Service"
      description="Simple rules for using PDFzuno responsibly and understanding what its tools can do."
      updated
    >
      <p className="guide-intro">
        These terms govern your use of PDFzuno, a browser-based PDF and image
        toolkit built by Danyal Khan. By using the website&apos;s tools, you
        agree to these terms. If you do not agree, do not use the tools.
      </p>
      <section className="guide-section">
        <h2>Using the toolkit</h2>
        <p>
          PDFzuno currently provides its tools free of charge without requiring
          an account. You may use them for personal, educational, or business
          tasks, subject to these terms and the rights that apply to your files.
          You are responsible for choosing the correct files, settings, and
          recipients for your results.
        </p>
        <p>
          Only process documents and images that you own or have permission to
          use and modify. Respect other people&apos;s privacy, copyright, and
          confidentiality. You retain whatever rights you already hold in your
          files; using a tool does not transfer ownership of your documents to
          PDFzuno.
        </p>
      </section>
      <section className="guide-section">
        <h2>Acceptable use</h2>
        <ul className="info-list">
          <li>
            Do not use the tools for unlawful activity, infringement, fraud,
            harassment, or creating misleading documents.
          </li>
          <li>
            Only unlock password-protected files when you are authorized to do
            so and have the credentials needed to open them.
          </li>
          <li>
            Do not place another person&apos;s signature on a document without
            their authorization or present a modified document as an authentic
            original when that would mislead someone.
          </li>
          <li>
            Do not attempt to compromise the website, distribute malicious code
            through it, or interfere with other people&apos;s access.
          </li>
        </ul>
      </section>
      <section className="guide-section">
        <h2>Local processing and your copies</h2>
        <p>
          File processing takes place on your device. PDFzuno does not upload
          your selected documents or passwords to a processing server. Website
          assets, fonts, and background-removal models may need network
          connections as explained in the{" "}
          <Link href="/privacy-policy/">Privacy Policy</Link>.
        </p>
        <p>
          Keep an original copy of important files and download your result
          before leaving a tool. We cannot recover local documents, downloaded
          results, or forgotten passwords for you. You are responsible for
          protecting the files stored on your device and deciding where to share
          them.
        </p>
      </section>
      <section className="guide-section">
        <h2>Tool limits and reviewing results</h2>
        <p>
          The current combined input limit is 50 MB per operation. Image
          conversion and background removal also have a 25 megapixel limit.
          Available memory, browser support, and document complexity can affect
          whether an operation finishes. Features and limits may change as the
          toolkit develops.
        </p>
        <p>
          Conversion may change formatting or omit unsupported features. Office
          conversion reflows content, editable PDF conversion does not include
          OCR, and image-based compression can remove searchable text, forms,
          and links. Repair is best effort, and background removal may produce
          imperfect edges.
        </p>
        <p>
          Sign PDF adds a visual electronic mark rather than a certificate-based
          digital signature. Redact PDF targets a selected rectangle on one page
          and does not automatically sanitize every page, attachment, or item of
          metadata. Review the relevant tool instructions and inspect the
          downloaded output before submitting or distributing it. Confirm that
          your recipient accepts the format and signing method you choose.
        </p>
      </section>
      <section className="guide-section">
        <h2>Availability and responsibility</h2>
        <p>
          The toolkit is provided as available, without a promise of
          uninterrupted access, error-free processing, or suitability for every
          document or purpose. It is not a substitute for a recipient&apos;s
          required submission system or a specialist workflow when exact
          rendering, verified signing, or comprehensive sanitization is needed.
        </p>
        <p>
          To the extent permitted by applicable law, PDFzuno and its developer
          are not liable for losses arising from use of the tools, processing
          errors, or reliance on unchecked outputs. Nothing in these terms
          excludes any right, remedy, or responsibility that cannot lawfully be
          excluded.
        </p>
      </section>
      <section className="guide-section">
        <h2>Software and third-party services</h2>
        <p>
          The application uses open-source components, including MuPDF, and its
          distributed source is provided under AGPL-3.0-or-later. The{" "}
          <a href="/pdfzuno-source.zip" download>
            source download
          </a>{" "}
          includes the project license and third-party notices. Those software
          licenses govern applicable rights to copy, modify, and redistribute
          the software; these website terms do not replace them.
        </p>
        <p>
          External services and linked websites operate under their own terms
          and privacy policies. Their availability is outside the toolkit&apos;s
          control.
        </p>
      </section>
      <section className="guide-section">
        <h2>Changes and questions</h2>
        <p>
          Updated terms will be posted on this page with a revised date. Review
          the current version when returning to the service. For questions about
          these terms, contact{" "}
          <a href="mailto:info@pdfzuno.pk">info@pdfzuno.pk</a>. Learn more about
          the project on the <Link href="/about-us/">About Us</Link> page.
        </p>
      </section>
    </InfoPage>
  );
}
