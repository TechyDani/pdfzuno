// Exercises the actual browser-targeted bundles and native WASM modules in a
// worker-like VM, without providing Node process/require or server fallbacks.
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { defaultOptions } from "../lib/pdf/types.ts";
const root = path.resolve("out");
const chunks = fs.readdirSync(path.join(root, "_next/static/chunks"));
const workerName = chunks.find(
  (f) =>
    f.endsWith(".js") &&
    fs
      .readFileSync(path.join(root, "_next/static/chunks", f), "utf8")
      .includes("Loading document engine"),
);
assert(workerName, "Processing worker bundle is present");
const workerUrl = `https://pdfzuno.test/_next/static/chunks/${workerName}`;
const location = {
  href: workerUrl,
  origin: "https://pdfzuno.test",
  toString() {
    return workerUrl;
  },
};
const pdf = await PDFDocument.create();
const p = pdf.addPage([600, 800]);
const font = await pdf.embedFont(StandardFonts.Helvetica);
p.drawText("Browser worker test", { x: 40, y: 700, font, size: 18 });
const file = new File([await pdf.save()], "test.pdf", {
  type: "application/pdf",
});
let context;
let receiver;
const moduleCache = new Map();
function localFile(url) {
  const parsed = new URL(url, workerUrl);
  assert.equal(parsed.origin, location.origin);
  const file = path.resolve(root, "." + parsed.pathname);
  assert(file.startsWith(root + path.sep));
  return file;
}
const sandbox = {
  console,
  location,
  URL,
  Blob,
  File,
  TextEncoder,
  TextDecoder,
  WebAssembly,
  Response,
  Request,
  Headers,
  AbortController,
  Buffer: undefined,
  atob,
  btoa,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  queueMicrotask,
  performance,
  crypto: globalThis.crypto,
  WorkerGlobalScope: class {},
  navigator: { userAgent: "PDFzuno worker smoke test" },
  ArrayBuffer,
  Uint8Array,
  Int8Array,
  Uint16Array,
  Int16Array,
  Uint32Array,
  Int32Array,
  Float32Array,
  Float64Array,
  DataView,
  fetch: async (url) =>
    new Response(fs.readFileSync(localFile(String(url))), {
      headers: {
        "Content-Type": String(url).endsWith(".wasm")
          ? "application/wasm"
          : "text/javascript",
      },
    }),
  postMessage: (data) => receiver?.(data),
  importScripts: (...urls) => {
    for (const url of urls)
      vm.runInContext(fs.readFileSync(localFile(url), "utf8"), context, {
        filename: url,
        importModuleDynamically: loadModule,
      });
  },
};
context = vm.createContext(sandbox);
context.self = context;
async function loadModule(specifier, ref) {
  const url = new URL(specifier, ref?.identifier || workerUrl).href;
  if (moduleCache.has(url)) return moduleCache.get(url);
  const module = new vm.SourceTextModule(
    fs.readFileSync(localFile(url), "utf8"),
    {
      context,
      identifier: url,
      initializeImportMeta(meta) {
        meta.url = url;
      },
      importModuleDynamically: loadModule,
    },
  );
  moduleCache.set(url, module);
  await module.link(loadModule);
  await module.evaluate();
  return module;
}
vm.runInContext(fs.readFileSync(localFile(workerUrl), "utf8"), context, {
  filename: workerUrl,
  importModuleDynamically: loadModule,
});
await context._N_E;
async function run(
  tool,
  options = defaultOptions,
  action = "process",
  input = file,
) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`${tool} timed out`)),
      30000,
    );
    receiver = (data) => {
      if (data.type === "error") {
        clearTimeout(timeout);
        reject(new Error(`${tool}: ${data.message}`));
      } else if (data.type === "result" || data.type === "preview") {
        clearTimeout(timeout);
        resolve(data);
      }
    };
    context.onmessage({
      data: {
        action,
        tool,
        options,
        files: [
          {
            name: input.name,
            type: input.type,
            bytes: await input.arrayBuffer(),
          },
        ],
      },
    });
  });
}
for (const [tool, mode] of [
  ["pdf-word", "editable"],
  ["pdf-excel", "editable"],
  ["pdf-ppt", "appearance"],
  ["pdf-jpg", "editable"],
  ["protect", "editable"],
]) {
  const data = await run(tool, {
    ...defaultOptions,
    mode,
    newPassword: "password123",
  });
  assert(data.bytes.length > 50);
  console.log("BROWSER BUNDLE PASS", tool);
}
const preview = await run("redact", defaultOptions, "preview");
assert(
  preview.width === 600 && preview.height === 800 && preview.bytes.length > 50,
);
console.log("BROWSER BUNDLE PASS preview/native WASM");
