import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
export function pageIndices(value: string, count: number): number[] {
  if (!value.trim()) throw new Error("Enter page numbers, for example 1-3, 5.");
  const output: number[] = [];
  for (const part of value.split(",")) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("Use page numbers or ranges, such as 1-3, 5.");
    const start = Number(match[1]),
      end = Number(match[2] || match[1]);
    if (start < 1 || end > count || end < start)
      throw new Error(`Pages must be between 1 and ${count}.`);
    for (let n = start; n <= end; n++) output.push(n - 1);
  }
  return output;
}
export async function processPdf(
  id: string,
  files: File[],
  options: {
    pages: string;
    text: string;
    angle: string;
    margin: string;
    x: string;
    y: string;
    size: string;
  },
) {
  if (!files.length) throw new Error("Choose a file first.");
  const result = await PDFDocument.create();
  if (id === "jpg-pdf") {
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
        (value, index) => bytes[index] === value,
      );
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      if (!png && !jpg)
        throw new Error(`“${file.name}” is not a valid JPG or PNG image.`);
      const image = png
        ? await result.embedPng(bytes)
        : await result.embedJpg(bytes);
      const scale = Math.min(1, 1200 / image.width);
      const page = result.addPage([image.width * scale, image.height * scale]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });
    }
    return result.save();
  }
  if (id === "merge") {
    if (files.length < 2) throw new Error("Choose at least two PDFs to merge.");
    for (const file of files) {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      const pages = await result.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((p) => result.addPage(p));
    }
    return result.save();
  }
  const pdf = await PDFDocument.load(await files[0].arrayBuffer());
  if (["split", "extract", "organize", "remove"].includes(id)) {
    let indices = pageIndices(options.pages, pdf.getPageCount());
    if (id === "remove")
      indices = pdf.getPageIndices().filter((i) => !indices.includes(i));
    if (!indices.length)
      throw new Error("Keep at least one page in the document.");
    const pages = await result.copyPages(pdf, indices);
    pages.forEach((p) => result.addPage(p));
    return result.save();
  }
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.getPages().forEach((page, index) => {
    const { width, height } = page.getSize();
    if (id === "rotate")
      page.setRotation(
        degrees((page.getRotation().angle + Number(options.angle)) % 360),
      );
    if (id === "crop") {
      const m = Number(options.margin);
      if (!Number.isFinite(m) || m < 0 || m * 2 >= Math.min(width, height))
        throw new Error("Choose a smaller, non-negative margin.");
      page.setCropBox(m, m, width - 2 * m, height - 2 * m);
    }
    if (id === "numbers")
      page.drawText(`${index + 1} / ${pdf.getPageCount()}`, {
        x: width / 2 - 15,
        y: 20,
        size: 10,
        font,
        color: rgb(0.3, 0.35, 0.4),
      });
    if (id === "watermark" || id === "edit") {
      if (!options.text.trim())
        throw new Error("Enter the text you want to add.");
      const size =
        id === "watermark"
          ? Math.min(
              40,
              (width - 40) /
                Math.max(font.widthOfTextAtSize(options.text, 1), 1),
            )
          : Number(options.size);
      const x =
          id === "watermark"
            ? (width - font.widthOfTextAtSize(options.text, size)) / 2
            : Number(options.x),
        y = id === "watermark" ? height / 2 : Number(options.y);
      if (
        !Number.isFinite(size) ||
        size < 1 ||
        size > 200 ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        y < 0 ||
        x >= width ||
        y >= height
      )
        throw new Error("Text size or position is outside the page.");
      page.drawText(options.text, {
        x,
        y,
        size,
        font,
        opacity: id === "watermark" ? 0.22 : 1,
        color: rgb(0.12, 0.18, 0.28),
      });
    }
  });
  return pdf.save();
}
