import assert from "node:assert/strict";
import * as mupdf from "mupdf";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Paragraph, Packer } from "docx";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import JSZip from "jszip";
import { mkdir, writeFile } from "node:fs/promises";
globalThis.__PDFZUNO_ENGINE__ = mupdf;
const { runTool } = await import("../lib/pdf/advanced.ts");
const { defaultOptions } = await import("../lib/pdf/types.ts");
await mkdir(".test-output", { recursive: true });
const pdf = await PDFDocument.create(),
  font = await pdf.embedFont(StandardFonts.Helvetica);
for (let i = 0; i < 3; i++) {
  const page = pdf.addPage([600, 800]);
  page.drawText("Product", { x: 40, y: 730, size: 14, font });
  page.drawText("Total", { x: 250, y: 730, size: 14, font });
  page.drawText("Cups", { x: 40, y: 690, size: 14, font });
  page.drawText("125", { x: 250, y: 690, size: 14, font });
  page.drawText("SECRET", { x: 40, y: 620, size: 20, font });
}
const file = new File([await pdf.save()], "sample.pdf", {
  type: "application/pdf",
});
const o = {
  ...defaultOptions,
  text: "Approved",
  pages: "1,3",
  mode: "editable",
};
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=",
  "base64",
);
let done = 0;
async function check(id, files = [file], options = o) {
  const output = await runTool(id, files, options);
  assert(output.bytes.length > 50);
  await writeFile(`.test-output/${output.filename}`, output.bytes);
  if (output.mime === "application/pdf") {
    const doc = mupdf.Document.openDocument(output.bytes, "pdf");
    if (id === "protect") {
      assert(doc.needsPassword());
      assert.equal(doc.authenticatePassword("wrong"), 0);
      assert(doc.authenticatePassword(options.newPassword));
    }
    assert(doc.countPages() > 0);
    doc.destroy();
  } else {
    const zip = await JSZip.loadAsync(output.bytes);
    assert(Object.keys(zip.files).length > 0);
  }
  console.log("PASS", id);
  done++;
  return output;
}
for (const id of [
  "split",
  "extract",
  "organize",
  "remove",
  "rotate",
  "crop",
  "edit",
  "numbers",
  "watermark",
])
  await check(id);
await check("merge", [file, file]);
await check("jpg-pdf", [new File([png], "test.png", { type: "image/png" })]);
const word = await Packer.toBuffer(
  new Document({
    sections: [
      {
        children: [
          new Paragraph("PDFzuno Word conversion"),
          new Paragraph("Unicode: مرحبا World"),
        ],
      },
    ],
  }),
);
await check("word-pdf", [new File([word], "sample.docx")]);
const workbook = new ExcelJS.Workbook();
workbook.addWorksheet("Sales").addRows([
  ["Product", "Amount"],
  ["Paper Cups", 125],
]);
await check("excel-pdf", [
  new File([await workbook.xlsx.writeBuffer()], "sample.xlsx"),
]);
const ppt = new PptxGenJS();
ppt.addSlide().addText("PDFzuno presentation", { x: 1, y: 1, w: 5, h: 1 });
await check("ppt-pdf", [
  new File([await ppt.write({ outputType: "uint8array" })], "sample.pptx"),
]);
for (const id of ["pdf-word", "pdf-excel", "pdf-ppt", "pdf-jpg", "repair"])
  await check(id);
await check("compress", [file], { ...o, quality: "lossless" });
await check("sign", [file], { ...o, targetPage: "2", y: "600" });
const protectedPdf = await check("protect", [file], {
  ...o,
  newPassword: "password123",
});
const protectedFile = new File([protectedPdf.bytes], "protected.pdf", {
  type: "application/pdf",
});
const unlocked = await check("unlock", [protectedFile], {
  ...o,
  password: "password123",
});
const unlockedDoc = mupdf.Document.openDocument(unlocked.bytes, "pdf");
assert(!unlockedDoc.needsPassword());
unlockedDoc.destroy();
await assert.rejects(
  () => runTool("unlock", [protectedFile], { ...o, password: "wrong" }),
  /password/,
);
const redacted = await check("redact", [file], {
  ...o,
  x: "35",
  y: "155",
  width: "120",
  height: "40",
  targetPage: "1",
});
const redDoc = mupdf.Document.openDocument(redacted.bytes, "pdf");
const rp = redDoc.loadPage(0);
const rt = rp.toStructuredText();
assert(!rt.asText().includes("SECRET"));
assert(rt.asText().includes("Product"));
rt.destroy();
rp.destroy();
redDoc.destroy();
await check("pdf-word", [file], { ...o, mode: "appearance" });
await check("pdf-ppt", [file], { ...o, mode: "appearance" });
await check("split", [file], { ...o, mode: "individual" });
await check("compress", [file], { ...o, quality: "small" });
await assert.rejects(() => runTool("remove", [file], { ...o, pages: "1-3" }));
console.log(
  `PASS ${done} operations/modes; encryption round-trip; destructive redaction; invalid password and page handling`,
);
