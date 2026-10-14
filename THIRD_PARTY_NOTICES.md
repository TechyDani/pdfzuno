# Third-party software

PDFzuno uses MuPDF 1.28.1, copyright Artifex Software, under AGPL-3.0-or-later. The bundled engine is unmodified. The generated application source is distributed under AGPL-3.0-or-later for compatibility with this dependency; the complete license is in `LICENSE`. A source download is available in the site footer.

MuPDF source and build instructions: https://github.com/ArtifexSoftware/mupdf/tree/1.28.1
MuPDF JavaScript package: https://www.npmjs.com/package/mupdf/v/1.28.1
Alternative engine licensing is available from Artifex: https://mupdf.com/licensing

Other main libraries retain their own notices and licenses, installed with their packages:

- Next.js / React / Tailwind CSS / Radix UI — MIT
- pdf-lib — MIT
- docx — MIT
- ExcelJS — MIT
- PptxGenJS — MIT
- JSZip — MIT or GPL-3.0-or-later (used under MIT)
- Lucide — ISC
- Manrope and DM Sans — SIL Open Font License; loaded from Google Fonts

See `pnpm-lock.yaml` for exact dependency versions and each installed package for its full license text. The downloadable project contains the application source, not installed dependencies or generated WebAssembly binaries; `pnpm install` followed by `pnpm build` restores these from their pinned packages.
