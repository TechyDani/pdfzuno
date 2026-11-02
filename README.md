# ZivraTools

**Every Tool. One Place.**

Free online tools for PDFs, images, documents, and everyday productivity. Fast, simple, and private.

Next.js App Router + React + TypeScript + Tailwind CSS toolkit with 26 local PDF/image tools, a Pinterest downloader, and a YouTube video/Shorts downloader. Document processing runs in a cancellable browser Web Worker; selected documents, images and passwords never go to a processing server. Pinterest downloader separately sends a public Pin link to a server endpoint and streams the selected media back to the browser.

## Run the project

Requires Node.js 22.13+ and pnpm 11.25.0 (Node 24 recommended).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`. No API keys or database setup is required for local document tools or Pinterest. For YouTube, run the one-time local setup below. The engine preparation script copies the pinned MuPDF JavaScript and WebAssembly assets into `public/engines/` automatically.

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

## YouTube downloader locally

Before using YouTube downloads on your computer, run:

```sh
npm run youtube:setup
npm run dev
```

If the development server is already running, stop it with Ctrl+C before starting it again. Setup installs yt-dlp, ffmpeg, and ffprobe inside ignored `.local/youtube/bin/`, verifies the downloaded executables' SHA-256 checksums, and creates a random shared token plus local service settings in ignored `.env.local`. It preserves existing environment settings and does not install system-wide software or require Docker. The automatic installer supports macOS x64/arm64, Linux x64/arm64, and Windows x64.

`npm run dev` now starts the downloader at `http://127.0.0.1:8787` alongside Next.js, waits for it to be ready, and stops both when you press Ctrl+C. You no longer need a separate terminal or a manually copied token for local development. If you have configured a remote service URL, development uses that service instead. Run `npm run youtube:setup -- --update` to refresh yt-dlp when YouTube changes its delivery. Installed dependency notices are kept alongside the binaries.

The message **"YouTube downloads are not configured yet"** means `YOUTUBE_SERVICE_URL` or a valid `YOUTUBE_SERVICE_TOKEN` is missing. For local development, run setup and restart `npm run dev`. Setting a URL alone does not start a downloader; the new development command handles that. For manual testing, `npm run youtube:service` reads `.env.local` and starts just the service.

## YouTube downloader on Vercel

Open `/tools/youtube-downloader/` or choose the Download category. Paste a public YouTube watch URL, `youtu.be` share URL, or Shorts URL, review the preview, choose an MP4 quality ceiling, and download with audio. Limits are twenty minutes and 100 MB. Playlists, live/upcoming streams, private, paid, age-restricted, and region-restricted videos are unsupported. No YouTube login or cookies are used. Availability can change when YouTube blocks a hosting region or changes its delivery; no implementation can guarantee every public link.

The Next.js website stays on **Vercel**. A separate container runs yt-dlp, its JavaScript challenge support, Node.js, and ffmpeg. The website only requests metadata and creates signed links; video files transfer **directly from the container to the browser**, without passing through a Vercel function. This also means the service needs its own publicly accessible HTTPS URL. The feature returns a clear unavailable message until the service is configured.

**If only the website is deployed, YouTube downloads are not live yet.** Running local setup does not configure Vercel. The `127.0.0.1:8787` URL in `.env.local` points to your computer and must not be used for Vercel production.

### Deploy the downloader on Render

The repository includes `render.yaml` for the separate Docker service. Push this file and `Dockerfile.youtube.dockerignore` to GitHub, then open [Deploy the downloader on Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2FTechyDani%2Fpdfzuno%2Ftree%2Fcodex%2Frender-youtube). Review the service before creating it. The Blueprint selects Free for an initial test; Render's free service sleeps when idle, so use an always-on instance for production. If testing the free instance, open its `/health` URL and wait for it to respond before trying a download. A sleeping service can take longer to start than Vercel's request timeout.

1. The Blueprint sets `YOUTUBE_ALLOWED_ORIGINS` to `https://pdfzuno-iota.vercel.app`. If you already created the Render service, set this value in its Environment settings and redeploy or sync the Blueprint. Add any custom domain after a comma if applicable. Include `https://` and omit paths and trailing slashes.
2. Wait for the service to finish deploying. Open its public `/health` URL and confirm it returns `{"ok":true,"service":"zivratools-youtube"}`.
3. In the Render service's Environment settings, copy its generated `YOUTUBE_SERVICE_TOKEN`. Keep this value private; do not put it in GitHub or chat.
4. In your Vercel project, open **Settings → Environment Variables** and add the following to **Production** (and Preview if needed):

   | Name                    | Value                                                                       |
   | ----------------------- | --------------------------------------------------------------------------- |
   | `YOUTUBE_SERVICE_URL`   | The Render service's actual HTTPS origin, without `/health` or another path |
   | `YOUTUBE_SERVICE_TOKEN` | The exact token generated by Render                                         |

5. **Redeploy the Vercel website.** Changing environment variables does not update an existing deployment. Then retry the YouTube tool on the new deployment.

The Blueprint does not deploy itself when committed. Both the Render deployment and the Vercel environment setup must be completed. Reference: [Render Blueprints](https://render.com/docs/blueprint-spec), [Render free instance limits](https://render.com/docs/free), and [Vercel environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).

### Deploy on another Docker host

1. Generate a shared secret with `openssl rand -hex 32`. Keep it server-side.
2. Build `Dockerfile.youtube` from the repository root and deploy the image on a Docker-capable host. Set these container environment variables:

   ```text
   YOUTUBE_SERVICE_TOKEN=<the generated secret>
   YOUTUBE_ALLOWED_ORIGINS=https://your-website.vercel.app,https://your-custom-domain.example
   PORT=8787
   ```

   Use your actual website origins, including `https://`, with no paths or trailing slashes. Configure the host to route to `PORT`; its health check is `GET /health`. Allow requests lasting at least three minutes and temporary storage of at least 500 MB. The worker permits two concurrent jobs per container and removes temporary files after transfers, cancellations, and errors. Do not attach a persistent media volume. Recreating the container clears any files left by a forced process termination.

3. In the Vercel project's **Settings → Environment Variables**, set:

   ```text
   YOUTUBE_SERVICE_URL=https://your-downloader-service.example
   YOUTUBE_SERVICE_TOKEN=<the same generated secret>
   ```

   Redeploy Vercel after setting these variables. The service URL must be an HTTPS origin without a path. Neither variable should have a `NEXT_PUBLIC_` prefix. Add each preview deployment's exact origin to the service allowlist if downloads should work in that preview.

For local Docker testing:

```sh
docker build -f Dockerfile.youtube -t zivratools-youtube .
docker run --rm -p 8787:8787 \
  -e YOUTUBE_SERVICE_TOKEN \
  -e YOUTUBE_ALLOWED_ORIGINS=http://localhost:3000 \
  zivratools-youtube
```

Export `YOUTUBE_SERVICE_TOKEN` in that terminal first. Set `YOUTUBE_SERVICE_URL=http://localhost:8787` and the same token in `.env.local`, then run `pnpm dev`. Alternatively install a current `yt-dlp[default]`, ffmpeg, and Node.js 22.13+ locally and run `pnpm youtube:service` with those environment variables. Optional `YT_DLP_PATH` and `FFMPEG_PATH` select installed executables. Docker installs the current yt-dlp release at build time; rebuild periodically because YouTube extraction changes. See the [yt-dlp installation documentation](https://github.com/yt-dlp/yt-dlp#installation) and [JavaScript support requirements](https://github.com/yt-dlp/yt-dlp/wiki/EJS).

`POST /api/youtube/resolve/` accepts `{ "url": "https://www.youtube.com/watch?v=..." }`. It validates and canonicalizes an individual video ID, authenticates to the service's `POST /resolve`, and returns metadata and signed download URLs valid for fifteen minutes. The service's `GET /download` verifies the signature, video ID, quality and expiry before invoking yt-dlp without a shell. Credentials and arbitrary media URLs are never accepted from visitors. File size, process output, execution time, and temporary disk use are bounded. Signed links should be treated as temporary bearer links and kept out of analytics logs.

## Dedicated tool pages

All 28 tools have their own prerendered URL, including `/tools/merge-pdf/`, `/tools/compress-pdf/`, `/tools/pdf-to-word/`, `/tools/remove-background/`, `/tools/pinterest-downloader/`, and `/tools/youtube-downloader/`. The home catalog and popular carousel link to these pages. Each page contains its inline file or link workspace followed by 400–500 words of server-rendered guidance: a tool-specific introduction, four tutorial steps, practical use cases, and tool-specific FAQs. Content describes the actual processor behavior, including conversion and OCR limitations.

Privacy, terms, and about content is available at `/privacy-policy/`, `/terms/`, and `/about-us/`, with footer links on every page. The existing wording has been updated to cover the dedicated tool pages and guidance. Legacy root tool URLs and `/terms-of-service/` remain accessible for bookmarks and identify the new canonical URLs; internal links use the new routes.

Routes are defined by `slug` in `lib/pdf/tools.ts`; editorial content is maintained in `lib/pdf/guides.ts`. The shared page template is `app/tools/[slug]/page.tsx`. Each tool has a unique title and description. Optionally set `NEXT_PUBLIC_SITE_URL` to your deployed origin before building to generate absolute canonical URLs for that domain.

Every local PDF/image tool also has a long-form post at `/blogs/<tool-slug>-guide/`. Editorial sections live in `lib/blog/tool-articles.ts`, while instructions, use cases, and FAQs share the tool guide source so product details stay consistent. Each post includes at least 900 words of prose, a direct opening answer, a table of contents, related guides, and a link to the tool. The shared server-rendered template is `app/blogs/[slug]/page.tsx`; metadata includes canonical URLs, Open Graph, Twitter cards, and JSON-LD for the article, breadcrumbs, and visible FAQs. These features support discovery and comprehension without guaranteeing search rankings, rich results, or AI citations. Keep instructions and article text aligned when tool behaviour changes. Run `npm run test:blogs` after `npm run build` to check coverage, rendered word counts, metadata, schema, and links, including the existing specialised posts.

After building, run `npm run test:pages` to verify all 28 prerendered routes, internal links, metadata, input workspaces, guide word counts, and compliance pages. Run `npm run test:browser -- --skip-ai` for routing, direct refreshes, mobile layout, and real image conversions without downloading the background-removal model.

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

`npm run test:youtube` checks YouTube URLs, audio-aware format validation, signed-link expiry/tampering, subprocess execution, cancellation, file limits, concurrency, service authentication, CORS, MP4 streaming, and temporary-file cleanup using offline fixtures. `npm run test:youtube:dev` verifies the normal development startup in an isolated project: loading `.env.local`, starting the downloader automatically, resolving and transferring an MP4 through Next.js, custom-port CORS, and shutting both processes down. After building, `npm run test:youtube:browser` exercises the actual Next.js API and separate service with a deterministic video fixture, covering watch/Shorts links, MP4 bytes, quality selection, expired links, cancellation, and mobile layouts. These fixtures do not establish live YouTube availability; test your deployed service from its hosting region with your own public video.

`npm run test:pinterest` checks extraction, short-link resolution, MP4 export discovery and quality fallback, canonical video aliases, HTML fallback, redirect/host validation, streaming and size limits without network access. `npm run test:pinterest -- --live` adds current public-Pin checks, including the two reported Idea Pins. After building, `npm run test:pinterest:browser` checks the downloader interface, errors, image/video downloads and cancellation using deterministic browser fixtures plus real API validation. Add `-- --live` to fully download both reported videos and verify that Chrome decodes them and that their MP4 files include audio tracks.

`pnpm test` checks the 24 PDF tool paths and extra modes using generated documents, plus the offline Pinterest extraction and download tests. Checks include valid PDF/ZIP/Office containers, encryption plus unlock round-trip, wrong-password rejection, page-range validation and text removal after redaction. Generated test outputs are written under `.test-output/` and are not shipped in the ZIP.

After `pnpm build`, run `pnpm test:browser` (or `npm run test:browser`) with Google Chrome installed. This serves the production Next.js application and checks all 28 dedicated tool pages and direct refreshes, JPG/PNG-to-PDF page order with missing MIME types, genuine WebP-to-JPG downloads and transparency handling, invalid-image rejection, cancellation, real AI background removal with a public-domain NASA astronaut photo, PNG transparency and retained subject pixels, filters, search, mobile overflow, and browser exceptions/failed application assets. It needs internet access for the test photo and AI model unless `--skip-ai` is supplied. Screenshots are saved under `.test-output/`.

Browser UI testing is environment-dependent; passing processor tests and a production build does not replace testing downloads, touch interactions and document appearance in your target browsers.

## Licensing

This build uses **MuPDF under AGPL-3.0-or-later**, so the generated application is distributed with corresponding source under the same license. See `LICENSE` and `THIRD_PARTY_NOTICES.md`. MuPDF also offers separate commercial licensing. The source download in the footer is part of this distribution.

The visual typefaces are Manrope and DM Sans, requested from Google Fonts. Self-host them if all external font requests must be eliminated.
