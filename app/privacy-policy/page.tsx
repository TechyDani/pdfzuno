import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/pdf/info-page";

export const metadata: Metadata = {
  title: "Privacy Policy | PDFzuno",
  alternates: { canonical: "/privacy-policy/" },
  description:
    "Learn how PDFzuno processes files locally on your device without uploading your documents or passwords to a server, and how website connections work.",
};

export default function PrivacyPolicyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      description="Your files stay on your device. Here is how PDFzuno handles your privacy."
      updated
    >
      <p className="guide-intro">
        PDFzuno was built by Danyal Khan to make everyday document tasks easier
        while keeping you in control of your files. This policy explains what
        happens when you visit the website and use its PDF and image tools. This
        policy applies to the home page, individual tool pages, guides, and
        other informational pages on PDFzuno.
      </p>
      <section className="guide-section">
        <h2>Your files are processed locally</h2>
        <p>
          When you choose a PDF, Office document, or image, PDFzuno reads and
          processes it locally on your device inside your browser. Your files
          are not uploaded to a server for processing. Document contents,
          selected filenames, passwords, and drawn signatures are not sent to
          PDFzuno or to an external processing service.
        </p>
        <p>
          The browser creates your result locally and gives you a download link.
          Your original file is not overwritten. PDFzuno does not receive a
          server-side copy of either your selected file or its processed result,
          so we cannot retrieve those files for you later.
        </p>
      </section>
      <section className="guide-section">
        <h2>Temporary data and downloads</h2>
        <p>
          Selected files, settings, previews, and results are held in the
          page&apos;s working memory while you use a tool. Leaving the tool or
          closing its page ends that working session. The application does not
          intentionally save your documents or passwords in cookies, local
          storage, or a server database.
        </p>
        <p>
          Files you download remain in the location chosen by your browser until
          you delete them. Your browser may cache application code, fonts, and
          AI model assets to speed up future visits. Those cached software
          assets are different from your selected documents. Browser extensions,
          your operating system, and any device backup or synchronization
          services are governed by your own settings; closing a page is not a
          guarantee of secure erasure from your device.
        </p>
      </section>
      <section className="guide-section">
        <h2>Website and external service connections</h2>
        <p>
          Local file processing does not mean the website makes no network
          requests. Your browser connects to the website&apos;s host to load
          pages, scripts, and processing engines. The host may receive ordinary
          connection information, such as your IP address, requested URL,
          browser information, and request time, and may retain operational
          access logs. These website requests do not include the files you
          select.
        </p>
        <p>
          Typefaces load from Google Fonts. Background removal downloads an AI
          model and runtime assets from IMG.LY&apos;s asset service, including
          staticimgly.com, when needed. Providers may receive connection
          information when serving these assets. The background-removal image is
          still processed locally and is not uploaded to IMG.LY. See{" "}
          <a
            href="https://developers.google.com/fonts/faq/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Google Fonts&apos; privacy information
          </a>{" "}
          for details about font requests.
        </p>
      </section>
      <section className="guide-section">
        <h2>Accounts, advertising, and tracking</h2>
        <p>
          The current toolkit does not require an account, collect payment
          information, or include application-level advertising or analytics
          trackers. PDFzuno does not use your document contents for advertising,
          sell them, or use them to train an AI model. No document contents
          reach a processing server through the tools.
        </p>
      </section>
      <section className="guide-section">
        <h2>Your choices and responsibilities</h2>
        <p>
          Each tool has a dedicated page with instructions, use cases, and
          frequently asked questions below its file interface. Read that
          guidance before selecting files, especially when converting formats,
          removing information, or creating a protected copy. You can browse
          these pages and read their guidance without choosing a document.
        </p>
        <p>
          You decide which files to select and which results to download or
          share. Use a device and browser you trust, keep sensitive downloads in
          an appropriate location, and review outputs before sharing them. You
          can cancel processing or close the page. Browser settings let you
          manage cached site assets and browsing data.
        </p>
        <p>
          Because we do not hold your document contents, we cannot access,
          restore, or delete your local copies on your behalf. External
          providers handle any technical request information they receive under
          their own policies.
        </p>
      </section>
      <section className="guide-section">
        <h2>When you contact us</h2>
        <p>
          If you email info@pdfzuno.pk, your email address, any name you
          provide, and the contents of your message are received through the
          email service and used to respond to your inquiry. Correspondence may
          be kept for as long as needed to handle the request and related
          follow-up. Email is separate from local tool processing: information
          you choose to send in a message leaves your device. Please do not
          email confidential files or passwords.
        </p>
      </section>
      <section className="guide-section">
        <h2>Updates and privacy questions</h2>
        <p>
          If the website&apos;s data practices change, this policy should be
          updated to describe them. The date above identifies this version. For
          questions about this policy or privacy practices, email{" "}
          <a href="mailto:info@pdfzuno.pk">info@pdfzuno.pk</a>. Please do not
          attach sensitive documents or passwords to a privacy inquiry.
        </p>
        <p>
          You can also read our <Link href="/terms/">Terms of Service</Link> and
          learn about the creator on our <Link href="/about-us/">About Us</Link>{" "}
          page.
        </p>
      </section>
    </InfoPage>
  );
}
