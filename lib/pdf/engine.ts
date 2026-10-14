import type * as MuPDF from "mupdf";
type Engine = typeof MuPDF;
let engine: Promise<Engine> | undefined;
// Served as native ES modules so WebAssembly stays out of Next.js's JS bundles.
export function getEngine(): Promise<Engine> {
  const injected = (globalThis as unknown as { __PDFZUNO_ENGINE__?: Engine })
    .__PDFZUNO_ENGINE__;
  if (injected) return Promise.resolve(injected);
  if (!engine) {
    const url = new URL("/engines/mupdf/mupdf.js", globalThis.location.origin)
      .href;
    engine = import(/* webpackIgnore: true */ url).catch((error) => {
      engine = undefined;
      throw error;
    });
  }
  return engine!;
}
export async function openPdf(bytes: Uint8Array, password = "") {
  const m = await getEngine();
  const doc = m.Document.openDocument(
    bytes,
    "application/pdf",
  ).asPDF() as MuPDF.PDFDocument | null;
  if (!doc) throw new Error("This file is not a PDF.");
  if (doc.needsPassword() && !doc.authenticatePassword(password)) {
    doc.destroy();
    throw new Error("Enter the correct password to open this PDF.");
  }
  if (!doc.countPages()) {
    doc.destroy();
    throw new Error("The PDF contains no readable pages.");
  }
  return { m, doc };
}
export function savePdf(
  doc: MuPDF.PDFDocument,
  options: Record<string, string | number> = {},
) {
  const buffer = doc.saveToBuffer({
    garbage: "deduplicate",
    compress: "yes",
    ...options,
  });
  try {
    return new Uint8Array(buffer.asUint8Array());
  } finally {
    buffer.destroy();
  }
}
export async function inspectPdf(
  bytes: Uint8Array,
  password: string,
  pageNumber: number,
) {
  const { m, doc } = await openPdf(bytes, password);
  try {
    const count = doc.countPages();
    if (pageNumber < 1 || pageNumber > count)
      throw new Error(`Choose a page from 1 to ${count}.`);
    const page = doc.loadPage(pageNumber - 1);
    try {
      const bounds = page.getBounds();
      const w = bounds[2] - bounds[0],
        h = bounds[3] - bounds[1];
      const scale = Math.min(1.25, 800 / Math.max(w, h));
      const pix = page.toPixmap(
        m.Matrix.scale(scale, scale),
        m.ColorSpace.DeviceRGB,
        false,
      );
      try {
        return {
          bytes: new Uint8Array(pix.asPNG()),
          count,
          width: w,
          height: h,
        };
      } finally {
        pix.destroy();
      }
    } finally {
      page.destroy();
    }
  } finally {
    doc.destroy();
  }
}
