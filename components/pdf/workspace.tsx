"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  LockKeyhole,
  UploadCloud,
  X,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { Tool } from "@/lib/pdf/tools";
import {
  defaultOptions,
  type ProcessOptions,
  type ToolResult,
} from "@/lib/pdf/types";
import { SignaturePad } from "./signature-pad";
import { PagePreview } from "./page-preview";

const notes: Record<string, string> = {
  "jpg-pdf":
    "Add JPG or PNG images. Each image becomes one PDF page. Use the arrows to choose the page order before converting.",
  "webp-jpg":
    "Converts one WebP image at its original size. Transparent areas become white because JPG does not support transparency. Animated images export as a still image.",
  "remove-background":
    "Remove the background around a person, product or other subject and download a transparent PNG. On first use, an AI model downloads (about 40 MB plus the engine); keep this tab open. Your image stays on your device. Images up to 25 megapixels are supported.",
  "pdf-word":
    "Editable text mode exports selectable text. Preserve appearance embeds page images, including scanned pages. OCR is not included.",
  "pdf-excel":
    "Extracts selectable text into rows and columns, one worksheet per page. Check column alignment after conversion. Scanned pages require OCR first; formulas cannot be recovered from PDF.",
  "pdf-ppt":
    "Preserve appearance creates a slide image for each page. Editable text exports text boxes, without original graphics.",
  "word-pdf":
    "Accepts .docx. Text, tables and supported images are reflowed into PDF pages. Complex layouts may differ from Microsoft Word.",
  "excel-pdf":
    "Accepts .xlsx. Exports readable worksheet content. Check charts, merged cells and formula values against the original.",
  "ppt-pdf":
    "Accepts .pptx. Converts slide content into a readable PDF; the Office engine reflows content. Exact slide styling, charts and animations are not preserved.",
  protect:
    "Adds AES-256 encryption. You will need the new password to open the output file.",
  unlock:
    "Use this on documents you own or have permission to modify. Enter the current password if one is required.",
  repair:
    "Rebuilds recoverable PDF structure and cross-references. Missing or severely corrupted content cannot always be recovered. Review the result.",
  redact:
    "Permanently removes content inside the selected rectangle on one page. Preview the area carefully. Other pages, metadata and attachments should be reviewed separately.",
  sign: "Add a drawn or typed visual signature. This is not a certificate-based digital signature.",
  edit: "Adds new text to every page; it does not change existing PDF text. Position is in points from the bottom-left corner. Latin text supported.",
  crop: "72 points = 1 inch. Crop changes the visible page boundary. Use Redact PDF to permanently remove sensitive content.",
};
const fileTypes: Record<string, string> = {
  "word-pdf": ".docx",
  "excel-pdf": ".xlsx",
  "ppt-pdf": ".pptx",
  "jpg-pdf": ".jpg,.jpeg,.png",
  "webp-jpg": ".webp",
  "remove-background": ".jpg,.jpeg,.png,.webp",
};
export function Workspace({
  tool,
  onClose,
}: {
  tool: Tool | null;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]),
    [options, setOptions] = useState<ProcessOptions>(() => ({
      ...defaultOptions,
      mode:
        tool?.id === "pdf-ppt"
          ? "appearance"
          : tool?.id === "split"
            ? "combined"
            : "editable",
      pages: tool?.id === "pdf-jpg" ? "" : "1",
      quality: tool?.id === "compress" ? "lossless" : "balanced",
    })),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [percent, setPercent] = useState(0);
  const [result, setResult] = useState<
    (Omit<ToolResult, "bytes"> & { url: string; size: number }) | null
  >(null);
  const [preview, setPreview] = useState<{
    url: string;
    count: number;
    width: number;
    height: number;
  } | null>(null);
  const worker = useRef<Worker | null>(null),
    generation = useRef(0),
    urls = useRef<string[]>([]),
    input = useRef<HTMLInputElement>(null);
  function stop() {
    generation.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
  }
  useEffect(() => {
    const workerRef = worker;
    const generationRef = generation;
    const ownedUrls = urls.current;
    return () => {
      workerRef.current?.terminate();
      generationRef.current++;
      ownedUrls.forEach(URL.revokeObjectURL);
    };
  }, []);
  function invalidate() {
    setResult(null);
    setError("");
    setStatus("");
    setPercent(0);
  }
  function update(key: keyof ProcessOptions, value: string) {
    invalidate();
    if (key === "targetPage" || key === "password") setPreview(null);
    setOptions((prev) => ({ ...prev, [key]: value }));
  }
  function addFiles(incoming: File[]) {
    if (!tool || busy || !incoming.length) return;
    invalidate();
    const accepted = (fileTypes[tool.id] || ".pdf").split(",");
    if (
      incoming.some(
        (f) => !accepted.some((ext) => f.name.toLowerCase().endsWith(ext)),
      )
    ) {
      setError(`Please choose ${accepted.join(" / ")} files.`);
      return;
    }
    const multiple = ["merge", "jpg-pdf"].includes(tool.id),
      next = multiple ? [...files, ...incoming] : incoming.slice(0, 1);
    if (next.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024) {
      setError("Please keep the combined file size under 50 MB.");
      return;
    }
    setFiles(next);
    setPreview(null);
  }
  function move(index: number, delta: number) {
    invalidate();
    setFiles((previous) => {
      const next = [...previous];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  async function run(action: "preview" | "process") {
    if (!tool || !files.length || busy) return;
    invalidate();
    setBusy(true);
    setStatus(
      action === "preview" ? "Loading page preview…" : "Preparing files…",
    );
    const token = ++generation.current;
    try {
      const payload = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          type: file.type,
          bytes: await file.arrayBuffer(),
        })),
      );
      if (generation.current !== token) return;
      const job = new Worker(
        new URL("../../lib/pdf/process.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = job;
      job.onmessage = (event) => {
        if (generation.current !== token) return;
        const data = event.data;
        if (data.type === "progress") {
          setStatus(data.message);
          setPercent(data.percent);
          return;
        }
        if (data.type === "error") {
          setError(data.message);
          setStatus("");
        } else if (data.type === "preview") {
          const url = URL.createObjectURL(
            new Blob([data.bytes], { type: "image/png" }),
          );
          urls.current.push(url);
          setPreview({ ...data, url });
          setStatus(
            `${data.count} pages · Preview of page ${options.targetPage}`,
          );
        } else if (data.type === "result") {
          const url = URL.createObjectURL(
            new Blob([data.bytes], { type: data.mime }),
          );
          urls.current.push(url);
          setResult({ ...data, url, size: data.bytes.length });
          setPercent(100);
          setStatus("Complete");
        }
        job.terminate();
        worker.current = null;
        setBusy(false);
      };
      job.onerror = () => {
        if (generation.current !== token) return;
        setError(
          "Processing could not finish. Try a smaller file, or reload the page and try again.",
        );
        setBusy(false);
        setStatus("");
        job.terminate();
        worker.current = null;
      };
      job.postMessage(
        { action, tool: tool.id, files: payload, options },
        payload.map((f) => f.bytes),
      );
    } catch (e) {
      if (generation.current === token) {
        setError(e instanceof Error ? e.message : "Could not read this file.");
        setBusy(false);
      }
    }
  }
  const geometry = tool && ["sign", "redact"].includes(tool.id),
    pageTool =
      tool &&
      ["split", "extract", "organize", "remove", "pdf-jpg"].includes(tool.id),
    nonPdfInput =
      !!tool &&
      [
        "word-pdf",
        "excel-pdf",
        "ppt-pdf",
        "jpg-pdf",
        "webp-jpg",
        "remove-background",
      ].includes(tool.id);
  function field(
    key: keyof ProcessOptions,
    label: string,
    type = "text",
    placeholder?: string,
  ) {
    return (
      <label className="field" key={key}>
        {label}
        <input
          type={type}
          value={options[key]}
          onChange={(e) => update(key, e.target.value)}
          placeholder={placeholder}
          autoComplete={type === "password" ? "off" : undefined}
          maxLength={type === "password" ? 64 : 300}
        />
      </label>
    );
  }
  function select(
    key: keyof ProcessOptions,
    label: string,
    items: [string, string][],
  ) {
    return (
      <div className="field">
        <label id={`${key}-label`}>{label}</label>
        <Select
          value={options[key]}
          onValueChange={(v) => update(key, v)}
          disabled={busy}
        >
          <SelectTrigger className="w-full" aria-labelledby={`${key}-label`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {items.map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  return (
    <Dialog
      open={!!tool}
      onOpenChange={(open) => {
        if (!open) {
          stop();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto rounded-2xl p-6 sm:p-7">
        <DialogTitle className="text-2xl font-bold">{tool?.name}</DialogTitle>
        <DialogDescription>{tool?.description}</DialogDescription>
        {tool && (
          <>
            <label
              className="upload focus-within:outline-2 focus-within:outline-blue-500"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(Array.from(e.dataTransfer.files));
              }}
            >
              <UploadCloud size={30} className="text-[#315be8]" />
              <span className="font-semibold">
                Choose {fileTypes[tool.id]?.replaceAll(",", " / ") || "PDF"}{" "}
                files
              </span>
              <span className="text-sm text-slate-500">
                or drag and drop · 50 MB total max
              </span>
              <input
                ref={input}
                type="file"
                className="sr-only"
                aria-label="Choose files"
                disabled={busy}
                accept={fileTypes[tool.id] || ".pdf"}
                multiple={["merge", "jpg-pdf"].includes(tool.id)}
                onChange={(e) => {
                  addFiles(Array.from(e.target.files || []));
                  e.target.value = "";
                }}
              />
            </label>
            {!!files.length && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div className="file-row" key={`${f.name}-${i}`}>
                    <FileText size={18} className="text-blue-600 shrink-0" />
                    <span className="truncate flex-1" title={f.name}>
                      {f.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {(f.size / 1048576).toFixed(2)} MB
                    </span>
                    {files.length > 1 && (
                      <>
                        <button
                          disabled={i === 0 || busy}
                          aria-label={`Move ${f.name} up`}
                          onClick={() => move(i, -1)}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          disabled={i === files.length - 1 || busy}
                          aria-label={`Move ${f.name} down`}
                          onClick={() => move(i, 1)}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </>
                    )}
                    <button
                      disabled={busy}
                      aria-label={`Remove ${f.name}`}
                      onClick={() => {
                        invalidate();
                        setFiles((old) => old.filter((_, n) => n !== i));
                        setPreview(null);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {notes[tool.id] && (
              <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {notes[tool.id]}
              </p>
            )}
            <fieldset disabled={busy} className="space-y-4 min-w-0">
              {!nonPdfInput && (
                <details
                  open={tool.id === "unlock" || undefined}
                  className="text-sm"
                >
                  <summary className="cursor-pointer text-slate-600 mb-2">
                    {tool.id === "unlock"
                      ? "Current PDF password"
                      : "Is your PDF password-protected?"}
                  </summary>
                  {field(
                    "password",
                    "Current password (if required)",
                    "password",
                  )}
                </details>
              )}
              {pageTool && (
                <>
                  {field(
                    "pages",
                    tool.id === "remove"
                      ? "Pages to remove"
                      : tool.id === "organize"
                        ? "New page order"
                        : "Page selection",
                    "text",
                    "1-3, 5",
                  )}
                  <p className="text-xs text-slate-500">
                    {tool.id === "pdf-jpg"
                      ? "Leave blank for all pages, or enter 1-3, 5."
                      : tool.id === "organize"
                        ? "Enter any order, such as 3, 1, 2. Repeated numbers duplicate pages."
                        : "Use page numbers and ranges, for example 1-3, 5."}
                  </p>
                </>
              )}
              {tool.id === "split" &&
                select("mode", "Output", [
                  ["combined", "Selected pages in one PDF"],
                  ["individual", "Separate PDF per selected page (ZIP)"],
                ])}
              {["pdf-word", "pdf-ppt"].includes(tool.id) &&
                select("mode", "Conversion mode", [
                  ["editable", "Editable text"],
                  ["appearance", "Preserve appearance (page images)"],
                ])}
              {tool.id === "compress" && (
                <>
                  {select("quality", "Compression", [
                    ["lossless", "Lossless · preserve text and vectors"],
                    ["balanced", "Balanced · flatten pages to images"],
                    ["small", "Smallest · lower-quality page images"],
                  ])}
                  {options.quality !== "lossless" && (
                    <p className="text-sm text-amber-800">
                      This mode removes searchable text, interactive forms and
                      links by turning pages into images.
                    </p>
                  )}
                </>
              )}
              {tool.id === "pdf-jpg" &&
                select("quality", "Image resolution", [
                  ["balanced", "Standard · 108 DPI"],
                  ["high", "High · up to 216 DPI"],
                ])}
              {tool.id === "webp-jpg" &&
                select("quality", "JPG quality", [
                  ["balanced", "Balanced · smaller file"],
                  ["high", "High · best quality"],
                ])}
              {tool.id === "protect" &&
                field(
                  "newPassword",
                  "New password · 8–64 characters",
                  "password",
                )}
              {["watermark", "edit"].includes(tool.id) &&
                field(
                  "text",
                  tool.id === "watermark"
                    ? "Watermark text"
                    : "Text to add on every page",
                )}
              {tool.id === "rotate" &&
                select("angle", "Clockwise rotation · all pages", [
                  ["90", "90°"],
                  ["180", "180°"],
                  ["270", "270°"],
                ])}
              {tool.id === "crop" &&
                field("margin", "Trim from each edge (points)", "number")}
              {tool.id === "edit" && (
                <div className="grid grid-cols-3 gap-3">
                  {field("x", "X position", "number")}
                  {field("y", "Y position", "number")}
                  {field("size", "Font size", "number")}
                </div>
              )}
              {geometry && (
                <>
                  {field("targetPage", "Page number", "number")}
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-semibold text-blue-700"
                    disabled={!files.length || busy}
                    onClick={() => void run("preview")}
                  >
                    <Eye size={17} />
                    Load page preview
                  </button>
                  {preview && (
                    <PagePreview
                      {...preview}
                      disabled={busy}
                      box={{
                        x: Number(options.x),
                        y: Number(options.y),
                        width: Number(options.width),
                        height: Number(options.height),
                      }}
                      onChange={(b) => {
                        invalidate();
                        setOptions((old) => ({
                          ...old,
                          x: b.x.toFixed(1),
                          y: b.y.toFixed(1),
                          width: b.width.toFixed(1),
                          height: b.height.toFixed(1),
                        }));
                      }}
                    />
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {field("x", "Left (pt)", "number")}
                    {field("y", "Top (pt)", "number")}
                    {field("width", "Width (pt)", "number")}
                    {field("height", "Height (pt)", "number")}
                  </div>
                  <p className="text-xs text-slate-500">
                    Position from the top-left corner. 72 points = 1 inch.
                  </p>
                </>
              )}
              {tool.id === "sign" && (
                <>
                  <SignaturePad
                    key={tool.id}
                    disabled={busy}
                    onChange={(data) => update("signature", data)}
                  />
                  {field(
                    "text",
                    "Typed signature name (used if drawing is empty)",
                  )}
                </>
              )}
            </fieldset>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700 break-words"
              >
                {error}
              </p>
            )}
            {busy && (
              <div className="space-y-2" role="status">
                <p className="text-sm text-slate-600">{status}</p>
                <Progress value={percent} />
                <button
                  className="text-sm underline text-slate-500"
                  onClick={() => {
                    stop();
                    setStatus(
                      "Processing cancelled. Your original is unchanged.",
                    );
                  }}
                >
                  Cancel processing
                </button>
              </div>
            )}
            {result ? (
              <div
                className="rounded-xl bg-emerald-50 p-5 text-center"
                role="status"
              >
                <CheckCircle2 className="mx-auto text-emerald-600 mb-2" />
                <p className="font-semibold mb-2">Your file is ready.</p>
                <p className="text-sm leading-6 text-slate-600 mb-4">
                  {result.message}
                </p>
                {result.mime.startsWith("image/") && (
                  <div className="image-result-preview mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={result.url}
                      alt={
                        tool.id === "remove-background"
                          ? "Subject with background removed"
                          : "Converted JPG image"
                      }
                      width={600}
                      height={400}
                      unoptimized
                      className="w-full h-64 object-contain"
                    />
                  </div>
                )}
                <a
                  className="primary"
                  href={result.url}
                  download={result.filename}
                >
                  <Download size={17} />
                  Download {result.filename.split(".").pop()?.toUpperCase()}
                </a>
                <p className="text-xs text-slate-500 mt-3">
                  {(result.size / 1048576).toFixed(2)} MB · Original unchanged
                </p>
              </div>
            ) : (
              <button
                className="primary w-full"
                disabled={
                  busy ||
                  !files.length ||
                  (tool.id === "merge" && files.length < 2)
                }
                onClick={() => void run("process")}
              >
                {busy ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    {" "}
                    {tool.id === "redact"
                      ? "Apply permanent redaction"
                      : tool.name}
                    <ArrowDown size={16} />
                  </>
                )}
              </button>
            )}
            {!busy && status && !result && (
              <p className="text-xs text-slate-500" role="status">
                {status}
              </p>
            )}
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <LockKeyhole size={12} /> Files and passwords stay on your device
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
