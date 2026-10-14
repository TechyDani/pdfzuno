import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFzuno — Your everyday PDF toolkit",
  description: "Merge, split, organize and edit PDFs right in your browser.",
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
</body>
    </html>
  );
}
