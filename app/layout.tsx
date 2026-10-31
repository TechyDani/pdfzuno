import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/pdf/site-footer";

const title = "ZivraTools — Every Tool. One Place.";
const description =
  "Free online tools for PDFs, images, documents, and everyday productivity. Fast, simple, and private.";

export const metadata: Metadata = {
  title,
  description,
  applicationName: "ZivraTools",
  openGraph: { title, description, siteName: "ZivraTools", type: "website" },
  twitter: { card: "summary", title, description },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
