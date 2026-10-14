import { mkdir, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const source = dirname(fileURLToPath(import.meta.resolve("mupdf")));
const target = resolve("public/engines/mupdf");
await mkdir(target, { recursive: true });
for (const file of ["mupdf.js", "mupdf-wasm.js", "mupdf-wasm.wasm"])
  await copyFile(resolve(source, file), resolve(target, file));
await copyFile(resolve(source, "../LICENSE"), resolve(target, "LICENSE"));
console.log("PDFzuno processing engine prepared");
