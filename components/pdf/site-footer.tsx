import Link from "next/link";
import { FileText } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell site-footer-content">
        <div className="site-footer-brand">
          <Link href="/" className="brand" aria-label="PDFzuno home">
            <FileText size={24} color="#315be8" /> PDFzuno.
          </Link>
          <p>A little less paperwork. A little more possibility.</p>
        </div>
        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link href="/privacy-policy/">Privacy Policy</Link>
          <Link href="/terms-of-service/">Terms of Service</Link>
          <Link href="/about-us/">About Us</Link>
          <a href="mailto:info@pdfzuno.pk">Contact</a>
        </nav>
        <p className="site-footer-credit">
          © {new Date().getFullYear()} PDFzuno · Built by Danyal Khan
        </p>
      </div>
    </footer>
  );
}
