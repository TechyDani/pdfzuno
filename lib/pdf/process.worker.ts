import { runTool } from "./advanced";
import { inspectPdf } from "./engine";
import type { ProcessOptions } from "./types";
type Request = {
  action: "process" | "preview";
  tool: string;
  files: { name: string; type: string; bytes: ArrayBuffer }[];
  options: ProcessOptions;
};
self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    if (request.action === "preview") {
      const preview = await inspectPdf(
        new Uint8Array(request.files[0].bytes),
        request.options.password,
        Number(request.options.targetPage),
      );
      self.postMessage(
        { type: "preview", ...preview },
        { transfer: [preview.bytes.buffer] },
      );
      return;
    }
    const files = request.files.map(
      (f) => new File([f.bytes], f.name, { type: f.type }),
    );
    const result = await runTool(
      request.tool,
      files,
      request.options,
      (message, percent) =>
        self.postMessage({ type: "progress", message, percent }),
    );
    self.postMessage(
      { type: "result", ...result },
      { transfer: [result.bytes.buffer] },
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      message:
        error instanceof Error
          ? error.message
          : "This file could not be processed.",
    });
  }
};
