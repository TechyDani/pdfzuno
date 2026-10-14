import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getEngine, openPdf, savePdf } from "./engine.ts";
import type { ProcessOptions, Progress, ToolResult } from "./types";
import { pageIndices, processPdf } from "./process.ts";

const mime = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
};
function result(
  bytes: Uint8Array,
  extension: keyof typeof mime,
  id: string,
  message: string,
): ToolResult {
  return {
    bytes,
    filename: `pdfzuno-${id}.${extension}`,
    mime: mime[extension],
    message,
  };
}
function numbers(o: ProcessOptions) {
  const v = [o.x, o.y, o.width, o.height].map(Number);
  if (
    v.some((n) => !Number.isFinite(n)) ||
    v[0] < 0 ||
    v[1] < 0 ||
    v[2] <= 0 ||
    v[3] <= 0
  )
    throw new Error("Choose a valid rectangle on the page.");
  return v;
}
function selectedPage(value: string, count: number) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > count)
    throw new Error(`Choose a page from 1 to ${count}.`);
  return n - 1;
}

export async function runTool(
  id: string,
  files: File[],
  o: ProcessOptions,
  progress: Progress = () => {},
): Promise<ToolResult> {
  if (!files.length) throw new Error("Choose a file first.");
  if (files.reduce((s, f) => s + f.size, 0) > 50 * 1024 * 1024)
    throw new Error("Please keep the combined file size below 50 MB.");
  progress("Loading document engine…", 5);
  if (["word-pdf", "excel-pdf", "ppt-pdf"].includes(id))
    return officeToPdf(id, files[0], progress);
  const basic = [
    "merge",
    "split",
    "extract",
    "organize",
    "remove",
    "rotate",
    "numbers",
    "watermark",
    "edit",
    "crop",
    "jpg-pdf",
  ];
  if (basic.includes(id)) {
    if (id === "split" && o.mode === "individual") {
      const { doc } = await openPdf(
        new Uint8Array(await files[0].arrayBuffer()),
        o.password,
      );
      try {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        const indices = o.pages.trim()
          ? pageIndices(o.pages, doc.countPages())
          : Array.from({ length: doc.countPages() }, (_, i) => i);
        const clean = savePdf(doc, { encrypt: "none" });
        const source = await PDFDocument.load(clean);
        for (const [n, index] of indices.entries()) {
          const output = await PDFDocument.create();
          const [page] = await output.copyPages(source, [index]);
          output.addPage(page);
          zip.file(`page-${index + 1}-${n + 1}.pdf`, await output.save());
          progress(
            `Extracting page ${n + 1} of ${indices.length}`,
            10 + (80 * (n + 1)) / indices.length,
          );
        }
        return result(
          await zip.generateAsync({ type: "uint8array" }),
          "zip",
          id,
          `${indices.length} separate PDFs are ready.`,
        );
      } finally {
        doc.destroy();
      }
    }
    let ready = files;
    if (id !== "jpg-pdf" && o.password) {
      ready = [];
      for (const file of files) {
        const { doc } = await openPdf(
          new Uint8Array(await file.arrayBuffer()),
          o.password,
        );
        try {
          ready.push(
            new File([savePdf(doc, { encrypt: "none" })], file.name, {
              type: "application/pdf",
            }),
          );
        } finally {
          doc.destroy();
        }
      }
    }
    progress("Processing your document…", 40);
    return result(
      new Uint8Array(await processPdf(id, ready, o)),
      "pdf",
      id,
      "Your PDF is ready. The original file is unchanged.",
    );
  }
  if (id === "sign") return signPdf(files[0], o);
  const bytes = new Uint8Array(await files[0].arrayBuffer());
  const { m, doc } = await openPdf(bytes, o.password);
  try {
    const count = doc.countPages();
    if (id === "protect") {
      if (
        o.newPassword.length < 8 ||
        o.newPassword.length > 64 ||
        !/^[\x20-\x7e]+$/.test(o.newPassword) ||
        o.newPassword.includes(",")
      )
        throw new Error(
          "Use 8–64 ASCII characters, without commas, for the new password.",
        );
      return result(
        savePdf(doc, {
          encrypt: "aes-256",
          "user-password": o.newPassword,
          "owner-password": o.newPassword,
        }),
        "pdf",
        id,
        "AES-256 password protection applied. Keep the password in a safe place.",
      );
    }
    if (id === "unlock")
      return result(
        savePdf(doc, { encrypt: "none" }),
        "pdf",
        id,
        "Password protection removed from your authorized copy.",
      );
    if (id === "repair")
      return result(
        savePdf(doc, { encrypt: "none", sanitize: "yes" }),
        "pdf",
        id,
        doc.wasRepaired()
          ? "The damaged PDF structure was recovered and rewritten. Review every page before using it."
          : "The PDF structure was rebuilt. No structural damage was detected.",
      );
    if (id === "redact") {
      const i = selectedPage(o.targetPage, count),
        page = doc.loadPage(i);
      try {
        const [x, y, w, h] = numbers(o),
          bounds = page.getBounds();
        if (x + w > bounds[2] - bounds[0] || y + h > bounds[3] - bounds[1])
          throw new Error("Keep the redaction rectangle inside the page.");
        const a = page.createAnnotation("Redact");
        a.setRect([
          bounds[0] + x,
          bounds[1] + y,
          bounds[0] + x + w,
          bounds[1] + y + h,
        ]);
        a.update();
        a.destroy();
        page.applyRedactions(
          true,
          m.PDFPage.REDACT_IMAGE_PIXELS,
          m.PDFPage.REDACT_LINE_ART_REMOVE_IF_TOUCHED,
          m.PDFPage.REDACT_TEXT_REMOVE,
        );
      } finally {
        page.destroy();
      }
      // Full rewrite removes orphaned original content; never save redaction incrementally.
      doc.setMetaData("info:Title", "");
      doc.setMetaData("info:Subject", "");
      doc.setMetaData("info:Keywords", "");
      return result(
        savePdf(doc, { encrypt: "none" }),
        "pdf",
        id,
        "Selected page content was permanently redacted. Review other pages and any attachments separately.",
      );
    }
    if (id === "compress") {
      let compressed: Uint8Array;
      if (o.quality === "lossless")
        compressed = savePdf(doc, {
          encrypt: "none",
          objstms: "yes",
          "compress-images": "yes",
          "compress-fonts": "yes",
        });
      else {
        const pdf = await PDFDocument.create();
        for (let i = 0; i < count; i++) {
          const page = doc.loadPage(i);
          try {
            const b = page.getBounds(),
              w = b[2] - b[0],
              h = b[3] - b[1];
            const scale = Math.min(
              o.quality === "small" ? 1 : 1.5,
              2200 / Math.max(w, h),
            );
            const pix = page.toPixmap(
              m.Matrix.scale(scale, scale),
              m.ColorSpace.DeviceRGB,
              false,
            );
            try {
              const image = await pdf.embedJpg(
                pix.asJPEG(o.quality === "small" ? 48 : 72),
              );
              pdf
                .addPage([w, h])
                .drawImage(image, { x: 0, y: 0, width: w, height: h });
            } finally {
              pix.destroy();
            }
          } finally {
            page.destroy();
          }
          progress(
            `Compressing page ${i + 1} of ${count}`,
            10 + (80 * (i + 1)) / count,
          );
        }
        compressed = new Uint8Array(await pdf.save());
      }
      if (compressed.length >= bytes.length)
        return result(
          bytes,
          "pdf",
          id,
          "This file is already compact at the selected setting. The original was kept because the result would be larger.",
        );
      return result(
        compressed,
        "pdf",
        id,
        `Reduced file size by ${Math.round(100 * (1 - compressed.length / bytes.length))}%.${o.quality !== "lossless" ? " Pages are now images; searchable text, links and form fields are flattened." : " Text and vector content are preserved."}`,
      );
    }
    if (id === "pdf-jpg") {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const indices = o.pages.trim()
        ? pageIndices(o.pages, count)
        : Array.from({ length: count }, (_, i) => i);
      for (const [j, i] of indices.entries()) {
        const page = doc.loadPage(i);
        try {
          const b = page.getBounds();
          const scale = Math.min(
            o.quality === "high" ? 3 : 1.5,
            4000 / Math.max(b[2] - b[0], b[3] - b[1]),
          );
          const pix = page.toPixmap(
            m.Matrix.scale(scale, scale),
            m.ColorSpace.DeviceRGB,
            false,
          );
          try {
            zip.file(`page-${i + 1}.jpg`, pix.asJPEG(90));
          } finally {
            pix.destroy();
          }
        } finally {
          page.destroy();
        }
        progress(
          `Rendering page ${j + 1} of ${indices.length}`,
          10 + (80 * (j + 1)) / indices.length,
        );
      }
      return result(
        await zip.generateAsync({ type: "uint8array" }),
        "zip",
        id,
        `${indices.length} JPG images are ready in one ZIP.`,
      );
    }
    if (["pdf-word", "pdf-excel", "pdf-ppt"].includes(id))
      return await pdfToOffice(id, doc, o, progress);
    throw new Error("Unknown PDF tool.");
  } finally {
    doc.destroy();
  }
}

async function officeToPdf(id: string, file: File, progress: Progress) {
  const ext = id === "word-pdf" ? "docx" : id === "excel-pdf" ? "xlsx" : "pptx";
  if (!file.name.toLowerCase().endsWith(`.${ext}`))
    throw new Error(
      `Choose a .${ext} file. Save older Office formats to .${ext} first.`,
    );
  const m = await getEngine();
  const doc = m.Document.openDocument(
    new Uint8Array(await file.arrayBuffer()),
    ext,
  );
  const buffer = new m.Buffer();
  let writer: InstanceType<typeof m.DocumentWriter> | undefined;
  try {
    doc.layout(
      id === "excel-pdf" ? 842 : 595,
      id === "excel-pdf" ? 595 : 842,
      11,
    );
    const count = doc.countPages();
    if (!count) throw new Error("No readable pages found in this document.");
    writer = new m.DocumentWriter(buffer, "pdf", { compress: "yes" });
    for (let i = 0; i < count; i++) {
      const page = doc.loadPage(i);
      try {
        const device = writer.beginPage(page.getBounds());
        try {
          page.run(device, m.Matrix.identity);
        } finally {
          device.close();
          device.destroy();
        }
        writer.endPage();
      } finally {
        page.destroy();
      }
      progress(
        `Converting page ${i + 1} of ${count}`,
        10 + (80 * (i + 1)) / count,
      );
    }
    writer.close();
    return result(
      new Uint8Array(buffer.asUint8Array()),
      "pdf",
      id,
      "Your PDF is ready. Office content is reflowed; check complex layouts, charts and formulas against the original.",
    );
  } finally {
    writer?.destroy();
    buffer.destroy();
    doc.destroy();
  }
}

type Line = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  size: number;
};
function textLines(page: import("mupdf").PDFPage) {
  const text = page.toStructuredText({ "preserve-whitespace": "yes" });
  const lines: Line[] = [];
  let line: Line | undefined;
  try {
    text.walk({
      beginLine(b) {
        line = {
          text: "",
          x: b[0],
          y: b[1],
          width: b[2] - b[0],
          height: b[3] - b[1],
          size: 11,
        };
      },
      onChar(c, _origin, _font, size) {
        if (line) {
          line.text += c;
          line.size = size;
        }
      },
      endLine() {
        if (line?.text.trim()) lines.push(line);
        line = undefined;
      },
    });
    return lines;
  } finally {
    text.destroy();
  }
}
async function pdfToOffice(
  id: string,
  doc: import("mupdf").PDFDocument,
  o: ProcessOptions,
  progress: Progress,
) {
  const m = await getEngine(),
    count = doc.countPages();
  let characters = 0;
  if (id === "pdf-word") {
    const { Document, Paragraph, TextRun, ImageRun, Packer } =
      await import("docx");
    const children: InstanceType<typeof Paragraph>[] = [];
    for (let i = 0; i < count; i++) {
      const page = doc.loadPage(i);
      try {
        const lines = textLines(page);
        characters += lines.reduce((n, l) => n + l.text.length, 0);
        if (o.mode === "appearance") {
          const b = page.getBounds();
          const scale = Math.min(
            1.5,
            2000 / Math.max(b[2] - b[0], b[3] - b[1]),
          );
          const pix = page.toPixmap(
            m.Matrix.scale(scale, scale),
            m.ColorSpace.DeviceRGB,
            false,
          );
          try {
            const w = 540,
              h = (w * (b[3] - b[1])) / (b[2] - b[0]);
            children.push(
              new Paragraph({
                pageBreakBefore: i > 0,
                children: [
                  new ImageRun({
                    type: "png",
                    data: pix.asPNG(),
                    transformation: { width: w, height: Math.min(720, h) },
                  }),
                ],
              }),
            );
          } finally {
            pix.destroy();
          }
        } else {
          if (!lines.length)
            children.push(
              new Paragraph({
                text: "[No selectable text on this page]",
                pageBreakBefore: i > 0,
              }),
            );
          lines.forEach((line, j) =>
            children.push(
              new Paragraph({
                pageBreakBefore: i > 0 && j === 0,
                children: [
                  new TextRun({
                    text: line.text,
                    size: Math.max(16, Math.min(48, Math.round(line.size * 2))),
                  }),
                ],
              }),
            ),
          );
        }
      } finally {
        page.destroy();
      }
      progress(
        `Converting page ${i + 1} of ${count}`,
        10 + (80 * (i + 1)) / count,
      );
    }
    if (o.mode !== "appearance" && !characters)
      throw new Error(
        "This PDF has no selectable text. Choose Preserve appearance for a Word file containing page images. OCR is not included.",
      );
    const blob = await Packer.toBlob(
      new Document({ sections: [{ children }] }),
    );
    return result(
      new Uint8Array(await blob.arrayBuffer()),
      "docx",
      id,
      o.mode === "appearance"
        ? "Word document created with page images. Text inside the images is not editable."
        : "Editable text exported to Word. Tables and complex layouts may need adjustment; images are not included in this mode.",
    );
  }
  if (id === "pdf-excel") {
    const { default: ExcelJS } = await import("exceljs");
    const book = new ExcelJS.Workbook();
    for (let i = 0; i < count; i++) {
      const page = doc.loadPage(i);
      try {
        const lines = textLines(page);
        const sheet = book.addWorksheet(`Page ${i + 1}`);
        const rows: { y: number; cells: Line[] }[] = [];
        for (const l of lines.sort((a, b) => a.y - b.y || a.x - b.x)) {
          characters += l.text.length;
          let row = rows.find(
            (r) => Math.abs(r.y - l.y) < Math.max(3, l.height * 0.45),
          );
          if (!row) {
            row = { y: l.y, cells: [] };
            rows.push(row);
          }
          row.cells.push(l);
        }
        for (const row of rows)
          sheet.addRow(
            row.cells
              .sort((a, b) => a.x - b.x)
              .flatMap((l) => l.text.split(/\t| {2,}/).map((s) => s.trim())),
          );
        sheet.columns.forEach((col) => {
          col.width = 24;
        });
        sheet.views = [{ state: "frozen", ySplit: 1 }];
      } finally {
        page.destroy();
      }
      progress(
        `Extracting page ${i + 1} of ${count}`,
        10 + (80 * (i + 1)) / count,
      );
    }
    if (!characters)
      throw new Error(
        "No selectable text was found. Scanned PDFs need OCR before they can become editable spreadsheet cells.",
      );
    return result(
      new Uint8Array(await book.xlsx.writeBuffer()),
      "xlsx",
      id,
      "Text rows and columns exported to Excel, one sheet per PDF page. Review cell alignment; source formulas cannot be recovered from a PDF.",
    );
  }
  const { default: PptxGenJS } = await import("pptxgenjs");
  const presentation = new PptxGenJS();
  presentation.author = "PDFzuno";
  const first = doc.loadPage(0);
  const bounds = first.getBounds();
  first.destroy();
  const sw = 10,
    sh = (10 * (bounds[3] - bounds[1])) / (bounds[2] - bounds[0]);
  presentation.defineLayout({ name: "PDF", width: sw, height: sh });
  presentation.layout = "PDF";
  for (let i = 0; i < count; i++) {
    const page = doc.loadPage(i);
    try {
      const b = page.getBounds(),
        w = b[2] - b[0],
        h = b[3] - b[1];
      const slide = presentation.addSlide();
      if (o.mode === "editable") {
        const lines = textLines(page);
        characters += lines.reduce((s, l) => s + l.text.length, 0);
        for (const l of lines)
          slide.addText(l.text, {
            x: ((l.x - b[0]) / w) * sw,
            y: ((l.y - b[1]) / h) * sh,
            w: Math.min(sw, ((l.width + 12) / w) * sw),
            h: Math.max(0.18, (l.height / h) * sh),
            fontSize: Math.max(5, (l.size / w) * sw * 72),
            margin: 0,
            breakLine: false,
          });
      } else {
        const scale = Math.min(1.5, 2000 / Math.max(w, h));
        const pix = page.toPixmap(
          m.Matrix.scale(scale, scale),
          m.ColorSpace.DeviceRGB,
          false,
        );
        try {
          const data = pix.asPNG();
          let binary = "";
          for (const byte of data) binary += String.fromCharCode(byte);
          slide.addImage({
            data: `image/png;base64,${btoa(binary)}`,
            x: 0,
            y: 0,
            w: sw,
            h: sh,
          });
        } finally {
          pix.destroy();
        }
      }
    } finally {
      page.destroy();
    }
    progress(
      `Creating slide ${i + 1} of ${count}`,
      10 + (80 * (i + 1)) / count,
    );
  }
  if (o.mode === "editable" && !characters)
    throw new Error(
      "No selectable text found. Choose Preserve appearance to convert scanned pages to slide images.",
    );
  const output = await presentation.write({ outputType: "uint8array" });
  return result(
    new Uint8Array(output as ArrayBuffer),
    "pptx",
    id,
    o.mode === "editable"
      ? "Editable text slides created. Graphics are omitted in this mode."
      : "Each PDF page is now a slide image. The visual appearance is preserved; text inside images is not editable.",
  );
}

async function signPdf(file: File, o: ProcessOptions) {
  const { doc } = await openPdf(
    new Uint8Array(await file.arrayBuffer()),
    o.password,
  );
  let clean: Uint8Array;
  try {
    clean = savePdf(doc, { encrypt: "none" });
  } finally {
    doc.destroy();
  }
  const pdf = await PDFDocument.load(clean);
  const index = selectedPage(o.targetPage, pdf.getPageCount()),
    page = pdf.getPage(index);
  const [x, y, w, h] = numbers(o);
  if (x + w > page.getWidth() || y + h > page.getHeight())
    throw new Error("Keep the signature rectangle inside the page.");
  if (o.signature) {
    const image = await pdf.embedPng(o.signature);
    page.drawImage(image, {
      x,
      y: page.getHeight() - y - h,
      width: w,
      height: h,
    });
  } else {
    if (!o.text.trim()) throw new Error("Draw a signature or enter your name.");
    const font = await pdf.embedFont(StandardFonts.TimesRomanItalic);
    const size = Math.min(
      30,
      h * 0.6,
      w / Math.max(1, font.widthOfTextAtSize(o.text, 1)),
    );
    page.drawText(o.text, {
      x,
      y: page.getHeight() - y - h * 0.7,
      font,
      size,
      color: rgb(0.05, 0.1, 0.2),
    });
  }
  return result(
    new Uint8Array(await pdf.save()),
    "pdf",
    "sign",
    "Visible signature added. This is an electronic mark, not a certificate-based digital signature.",
  );
}
