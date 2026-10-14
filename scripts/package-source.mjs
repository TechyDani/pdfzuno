import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
const zip = new JSZip();
const roots = ["app", "components", "hooks", "lib", "tests"];
async function addDirectory(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await addDirectory(file);
    else zip.file(`pdfzuno/${file}`, await readFile(file));
  }
}
for (const dir of roots) await addDirectory(dir);
for (const file of [
  "README.md",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "package.json",
  "pnpm-lock.yaml",
  "next.config.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "tsconfig.json",
  "public/favicon.svg",
  "scripts/prepare-engines.mjs",
  "scripts/package-source.mjs",
])
  zip.file(`pdfzuno/${file}`, await readFile(file));
// A portable package has no Sites identity, generated output, credentials or runtime state.
const manifest = JSON.parse(await readFile("package.json", "utf8"));
delete manifest.scripts["install:ci"];
delete manifest.scripts["db:generate"];
zip.file("pdfzuno/package.json", JSON.stringify(manifest, null, 2) + "\n");
zip.file(
  "pdfzuno/.gitignore",
  "node_modules/\n.next/\nout/\npublic/engines/\npublic/pdfzuno-source.zip\n.test-output/\n.env*\n*.tsbuildinfo\nnext-env.d.ts\n",
);
const bytes = await zip.generateAsync({
  type: "uint8array",
  compression: "DEFLATE",
  compressionOptions: { level: 6 },
});
await mkdir("public", { recursive: true });
await writeFile("public/pdfzuno-source.zip", bytes);
console.log(
  `Source ZIP: ${bytes.length} bytes, ${Object.keys(zip.files).length} entries`,
);
