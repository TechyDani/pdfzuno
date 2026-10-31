# ZivraTools

**Every Tool. One Place.**

Free online tools for PDFs, images, documents, and everyday productivity. Fast, simple, and private.

Next.js App Router + React + TypeScript + Tailwind CSS toolkit with 26 local PDF/image tools and a Pinterest downloader. Document processing runs in a cancellable browser Web Worker; selected documents, images and passwords never go to a processing server. Pinterest downloader separately sends a public Pin link to a server endpoint and streams the selected media back to the browser.

## Run the project

Requires Node.js 22.13+ and pnpm 11.25.0 (Node 24 recommended).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. No API keys or database setup is required. The engine preparation script copies the pinned MuPDF JavaScript and WebAssembly assets into `public/engines/` automatically.

```sh
pnpm test
pnpm build
```

Deploy as a **Next.js application on Vercel**, or run `npm run build` followed by `npm start` on Node.js hosting. Vercel can use the Next.js framework preset and the existing build command; leave Output Directory at the framework default. The build is in `.next/`. Pinterest downloads require a running server, so uploading an `out/` directory to a static host no longer provides the complete application. Existing PDF/image pages are still prerendered, and their file processing remains local. No Pinterest API key, login cookie, or database is required.

## Pinterest downloader

Open `/tools/pinterest-downloader/` or choose the Download category. Paste a public Pinterest Pin URL, a regional Pinterest link, or a `pin.it` share URL. The results show the largest exposed image or progressive MP4 per media item, including supported multi-page Idea Pins. Each file has a preview and a download button, with progress and cancellation. The limit is 100 MB per file.

Idea Pin metadata can list only an HLS stream even when Pinterest provides a downloadable MP4 export. The resolver reads the playlist's available renditions, checks the matching Pinterest `expMp4` exports in descending resolution, and verifies the response type and MP4 signature before returning a file. If the highest rendition is unavailable it tries the next. It retains the complete exported video with audio instead of saving a video-only stream or thumbnail. Share-link resolution accepts `/pin/<id>/sent/`, nested Pinterest shortener URLs, and canonical or refresh responses from `pin.it`. A canonical alias is accepted only when its video asset matches the requested Pin's metadata.

`POST /api/pinterest/resolve/` accepts `{ "url": "https://www.pinterest.com/pin/.../" }`. It follows only allowlisted Pinterest redirects, reads the Pin metadata endpoint with a public-page fallback, and returns media-specific download links. `GET /api/pinterest/download/?pin=...&media=...` resolves that Pin again, verifies the requested media belongs to it, and streams the file from Pinterest's CDN with an attachment filename. It never accepts an arbitrary download target. Redirects, media types, response sizes, and request durations are bounded. No media files are intentionally persisted by the application.

Private/deleted Pins, login or regional restrictions, external embeds, and HLS-only videos without an exposed MP4 are not supported. Such videos are reported as unavailable instead of downloading a thumbnail or playlist under an MP4 extension. Pinterest may change its responses or restrict the deployment's IP addresses; run `npm run test:pinterest -- --live` from your deployment region to check real public Pins. The live test reads metadata and a small media sample, without downloading full videos.

The media endpoint streams its response to avoid buffering whole videos in server memory. The browser collects the stream before saving so an interrupted transfer is reported instead of saving an incomplete file. For Vercel, allow the download function's configured 60-second duration. Hosting bandwidth and duration limits still apply. Configure hosting request protections as appropriate for production traffic.

## Dedicated tool pages

All 27 tools have their own prerendered URL, including `/tools/merge-pdf/`, `/tools/compress-pdf/`, `/tools/pdf-to-word/`, `/tools/remove-background/`, and `/tools/pinterest-downloader/`. The home catalog and popular carousel link to these pages. Each page contains its inline file or link workspace followed by 400–500 words of server-rendered guidance: a tool-specific introduction, four tutorial steps, practical use cases, and tool-specific FAQs. Content describes the actual processor behavior, including conversion and OCR limitations.

Privacy, terms, and about content is available at `/privacy-policy/`, `/terms/`, and `/about-us/`, with footer links on every page. The existing wording has been updated to cover the dedicated tool pages and guidance. Legacy root tool URLs and `/terms-of-service/` remain accessible for bookmarks and identify the new canonical URLs; internal links use the new routes.

Routes are defined by `slug` in `lib/pdf/tools.ts`; editorial content is maintained in `lib/pdf/guides.ts`. The shared page template is `app/tools/[slug]/page.tsx`. Each tool has a unique title and description. Optionally set `NEXT_PUBLIC_SITE_URL` to your deployed origin before building to generate absolute canonical URLs for that domain.

Every local PDF/image tool also has a long-form post at `/blogs/<tool-slug>-guide/`. Editorial sections live in `lib/blog/tool-articles.ts`, while instructions, use cases, and FAQs share the tool guide source so product details stay consistent. Each post includes at least 900 words of prose, a direct opening answer, a table of contents, related guides, and a link to the tool. The shared server-rendered template is `app/blogs/[slug]/page.tsx`; metadata includes canonical URLs, Open Graph, Twitter cards, and JSON-LD for the article, breadcrumbs, and visible FAQs. These features support discovery and comprehension without guaranteeing search rankings, rich results, or AI citations. Keep instructions and article text aligned when tool behaviour changes. Run `npm run test:blogs` after `npm run build` to check coverage, rendered word counts, metadata, schema, and links, including the existing specialised posts.

After building, run `npm run test:pages` to verify all 27 prerendered routes, internal links, metadata, input workspaces, guide word counts, and compliance pages. Run `npm run test:browser -- --skip-ai` for routing, direct refreshes, mobile layout, and real image conversions without downloading the background-removal model.

To regenerate the downloadable source archive, run `node scripts/package-source.mjs`. It excludes credentials, Sites identity, node_modules, builds and test outputs. Source is available at `/zivratools-source.zip` after building.

## Folder structure

| Path                               | Purpose                                                 |
| ---------------------------------- | ------------------------------------------------------- |
| `app/`                             | Page, metadata and shared Tailwind theme                |
| `components/pdf/toolkit.tsx`       | Searchable tool catalog and categories                  |
| `components/pdf/workspace.tsx`     | Files, settings, progress, cancellation and downloads   |
| `components/pdf/page-preview.tsx`  | Visual rectangle selection for signatures/redaction     |
| `components/pdf/signature-pad.tsx` | Pointer and touch signature drawing                     |
| `components/ui/`                   | Accessible reusable UI primitives                       |
| `lib/pdf/tools.ts`                 | Tool definitions                                        |
| `lib/pdf/process.ts`               | Basic PDF manipulation                                  |
| `lib/pdf/advanced.ts`              | Office conversions, encryption, rendering and redaction |
| `lib/pdf/engine.ts`                | Native module/WASM loader and PDF preview               |
| `lib/pdf/process.worker.ts`        | Background processing and progress messages             |
| `lib/pdf/types.ts`                 | Shared processing options/result types                  |
| `lib/image/process.ts`             | WebP conversion and local AI background removal         |
| `scripts/`                         | Engine preparation and source packaging                 |
| `tests/`                           | Real-file processing and validation checks              |
| `public/`                          | Favicon, generated engine assets and source download    |

## Tool behavior

| Tool              | Output and behavior                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Merge PDF         | Combines files in the selected order                                                                        |
| Split PDF         | Selected pages in one PDF, or separate PDFs in a ZIP                                                        |
| Compress PDF      | Lossless stream optimization or lossy image-page compression; keeps original if output would be larger      |
| PDF to Word       | Editable selectable text, or page images preserving appearance; real DOCX                                   |
| Word to PDF       | Reflow conversion of modern `.docx` content                                                                 |
| JPG to PDF        | JPG/PNG images combined into PDF pages                                                                      |
| WebP to JPG       | One WebP image converted to JPG at its original dimensions; transparent areas become white; quality control |
| Remove background | Local AI subject segmentation; downloadable transparent PNG at the original dimensions; marked Popular      |
| PDF to JPG        | Selected/all pages rendered to JPG images in a ZIP                                                          |
| Edit PDF          | Adds Latin text to every page at a specified position                                                       |
| Rotate PDF        | Rotates all pages by 90/180/270 degrees                                                                     |
| Organize PDF      | Reorders/duplicates pages using page numbers                                                                |
| Watermark PDF     | Adds a translucent text watermark to every page                                                             |
| Page numbers      | Adds sequential numbering                                                                                   |
| Remove pages      | Removes selected pages, preserving at least one                                                             |
| Extract pages     | Creates a PDF from selected pages/ranges                                                                    |
| Crop PDF          | Changes the page viewport; not destructive redaction                                                        |
| Excel to PDF      | Reflows readable `.xlsx` worksheet content                                                                  |
| PDF to Excel      | Groups selectable text into rows and columns; one XLSX sheet per PDF page                                   |
| PowerPoint to PDF | Reflows readable `.pptx` slide content                                                                      |
| PDF to PowerPoint | Page-image slides or positioned editable text; real PPTX                                                    |
| Protect PDF       | AES-256 encryption with a supplied password                                                                 |
| Unlock PDF        | Removes encryption after successful password authentication                                                 |
| Sign PDF          | Embeds a drawn signature or typed italic name at the selected location                                      |
| Redact PDF        | Permanently removes text, image pixels and intersecting graphics in the selected rectangle; full rewrite    |
| Repair PDF        | Recovers readable structure and rewrites PDF objects/cross-references                                       |

## Practical limits

- Office conversion is **reflow**, not Microsoft Office or LibreOffice rendering. Exact slide layouts, charts, drawings, formulas, fonts and advanced document styling are not guaranteed. This limitation is shown before conversion.
- PDF-to-Word and PDF-to-PowerPoint editable modes extract text, not the complete original layout or graphics. Appearance mode embeds page images and does not make their text editable.
- There is **no OCR**. Image-only PDFs cannot become editable text/spreadsheets unless OCR is performed separately. Word/PPT appearance modes work for scanned pages.
- PDF-to-Excel uses text positions; review cell alignment. PDF files do not contain the original spreadsheet formulas.
- Lossy compression flattens pages to images and removes searchability, links and forms. Lossless optimization cannot always shrink an already optimized file.
- Signatures are visual electronic marks, not certificate-based cryptographic signatures.
- Redaction affects one chosen rectangle on one page. Inspect the output and separately review attachments, metadata, form data and other pages for sensitive information.
- Repair is best-effort recovery, not a guarantee that missing/corrupted content can be reconstructed.
- Basic PDF text insertion uses Latin standard fonts. Office reflow supports the fonts/scripts available in MuPDF.
- Maximum combined input is 50 MB. Available memory varies by device; large or complex documents may need a desktop browser. The initial processing-engine download is about 11 MB.
- WebP conversion and background removal accept one image at a time, up to 25 megapixels. They require a recent browser supporting `createImageBitmap` and `OffscreenCanvas`. Animated WebP files export as a still image.
- Background removal uses `@imgly/background-removal` 1.7.0 and ONNX Runtime Web 1.21.0, loaded only when that tool runs. First use downloads IMG.LY's quantized ISNet model (about 40 MB) and runtime assets from `staticimgly.com`; an internet connection is required for uncached assets. No image is uploaded. CPU/WASM runs inside the existing cancellable worker without requiring special isolation headers. AI results vary by image; review fine edges and complex subjects.
- This project does not implement user accounts, billing, cloud imports, legally certified signing workflows or full iLovePDF feature parity.

## Verification

`npm run test:pinterest` checks extraction, short-link resolution, MP4 export discovery and quality fallback, canonical video aliases, HTML fallback, redirect/host validation, streaming and size limits without network access. `npm run test:pinterest -- --live` adds current public-Pin checks, including the two reported Idea Pins. After building, `npm run test:pinterest:browser` checks the downloader interface, errors, image/video downloads and cancellation using deterministic browser fixtures plus real API validation. Add `-- --live` to fully download both reported videos and verify that Chrome decodes them and that their MP4 files include audio tracks.

`pnpm test` checks the 24 PDF tool paths and extra modes using generated documents, plus the offline Pinterest extraction and download tests. Checks include valid PDF/ZIP/Office containers, encryption plus unlock round-trip, wrong-password rejection, page-range validation and text removal after redaction. Generated test outputs are written under `.test-output/` and are not shipped in the ZIP.

After `pnpm build`, run `pnpm test:browser` (or `npm run test:browser`) with Google Chrome installed. This serves the production Next.js application and checks all 27 dedicated tool pages and direct refreshes, JPG/PNG-to-PDF page order with missing MIME types, genuine WebP-to-JPG downloads and transparency handling, invalid-image rejection, cancellation, real AI background removal with a public-domain NASA astronaut photo, PNG transparency and retained subject pixels, filters, search, mobile overflow, and browser exceptions/failed application assets. It needs internet access for the test photo and AI model unless `--skip-ai` is supplied. Screenshots are saved under `.test-output/`.

Browser UI testing is environment-dependent; passing processor tests and a production build does not replace testing downloads, touch interactions and document appearance in your target browsers.

## Licensing

This build uses **MuPDF under AGPL-3.0-or-later**, so the generated application is distributed with corresponding source under the same license. See `LICENSE` and `THIRD_PARTY_NOTICES.md`. MuPDF also offers separate commercial licensing. The source download in the footer is part of this distribution.

The visual typefaces are Manrope and DM Sans, requested from Google Fonts. Self-host them if all external font requests must be eliminated.
