import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { pageIndices, processPdf } from "../lib/pdf/process.ts";
const source = await PDFDocument.create();
source.addPage([600, 800]);
source.addPage([400, 600]);
source.addPage([300, 400]);
const file = new File([await source.save()], "example.pdf", {
  type: "application/pdf",
});
const options = {
  pages: "1,3",
  text: "TEST",
  angle: "90",
  margin: "20",
  x: "40",
  y: "40",
  size: "18",
};
assert.deepEqual(pageIndices("3,1-2", 3), [2, 0, 1]);
assert.throws(() => pageIndices("0", 3));
assert.throws(() => pageIndices("4", 3));
for (const id of [
  "merge",
  "split",
  "extract",
  "organize",
  "remove",
  "rotate",
  "crop",
  "numbers",
  "edit",
  "watermark",
]) {
  const bytes = await processPdf(
    id,
    id === "merge" ? [file, file] : [file],
    options,
  );
  const output = await PDFDocument.load(bytes);
  assert.equal(
    output.getPageCount(),
    id === "merge"
      ? 6
      : ["split", "extract", "organize"].includes(id)
        ? 2
        : id === "remove"
          ? 1
          : 3,
  );
  if (id === "rotate") assert.equal(output.getPage(0).getRotation().angle, 90);
  if (id === "crop") assert.equal(output.getPage(0).getCropBox().width, 560);
}
await assert.rejects(() =>
  processPdf("remove", [file], { ...options, pages: "1-3" }),
);
await assert.rejects(() => processPdf("merge", [file], options));
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=",
  "base64",
);
const imagePdf = await PDFDocument.load(
  await processPdf(
    "jpg-pdf",
    [new File([png], "test.png", { type: "image/png" })],
    options,
  ),
);
assert.equal(imagePdf.getPageCount(), 1);
console.log("PASS: 11 PDF operations, page validation and invalid input paths");
