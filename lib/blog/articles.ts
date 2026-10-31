import { toolArticles } from "./tool-articles.ts";

export const securePdfArticle = {
  slug: "securely-manage-pdf-documents-without-uploading",
  title:
    "How to Securely Manage PDF Documents Without Uploading to Online Servers",
  excerpt:
    "A practical guide to organizing, compressing, redacting, and protecting PDFs locally, with clear advice on browser privacy and checking your final document.",
  category: "Privacy & Security",
  author: "Danyal Khan",
  publishedAt: "2026-10-22",
  publishedLabel: "October 22, 2026",
} as const;

export const irsPdfToWordArticle = {
  slug: "convert-pdf-to-word-for-irs-tax-forms",
  title: "How to Convert PDF to Word for IRS Tax Forms (US Guide)",
  excerpt:
    "Learn how to convert IRS tax form PDFs to Word for review, handle scanned forms, check tax data, and keep official forms ready for filing.",
  category: "PDF Conversion",
  author: "Danyal Khan",
  publishedAt: "2026-10-26",
  publishedLabel: "October 26, 2026",
} as const;

export const landRegistryCompressArticle = {
  slug: "compress-pdf-for-uk-hm-land-registry-uploads",
  title: "How to Compress PDF for UK HM Land Registry Uploads",
  excerpt:
    "Learn how to compress a PDF for HM Land Registry uploads, check the 40 MB limit, and preserve clear deeds and plans for England and Wales applications.",
  category: "PDF Compression",
  author: "Danyal Khan",
  publishedAt: "2026-10-26",
  publishedLabel: "26 October 2026",
} as const;

export const blogArticles = [
  ...toolArticles,
  landRegistryCompressArticle,
  irsPdfToWordArticle,
  securePdfArticle,
] as const;
