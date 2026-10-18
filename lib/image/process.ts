import type { ProcessOptions, Progress, ToolResult } from "../pdf/types";

// Inspect the content as file pickers and drag-and-drop can omit the MIME type.
async function imageBlob(file: File, webpOnly: boolean): Promise<Blob> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const webp =
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every(
    (value, index) => bytes[index] === value,
  );
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (webpOnly ? !webp : !webp && !png && !jpg)
    throw new Error(
      webpOnly
        ? "Please choose a valid WebP image. Renaming a file does not convert it."
        : "Please choose a valid JPG, PNG or WebP image.",
    );
  return new Blob([bytes], {
    type: webp ? "image/webp" : png ? "image/png" : "image/jpeg",
  });
}

export async function processImage(
  id: string,
  files: File[],
  options: ProcessOptions,
  progress: Progress = () => {},
): Promise<ToolResult> {
  if (!["webp-jpg", "remove-background"].includes(id))
    throw new Error("Unknown image tool.");
  if (files.length !== 1) throw new Error("Choose one image at a time.");
  const file = files[0];
  if (!file.size) throw new Error("This image is empty. Choose another file.");
  if (file.size > 50 * 1024 * 1024)
    throw new Error("Please choose an image smaller than 50 MB.");
  if (
    typeof createImageBitmap === "undefined" ||
    typeof OffscreenCanvas === "undefined"
  )
    throw new Error(
      "Image processing needs a recent browser. Please update Chrome, Edge, Firefox or Safari and try again.",
    );

  progress("Reading image…", 5);
  const blob = await imageBlob(file, id === "webp-jpg");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("This image could not be decoded. Try another image.");
  }
  const stem = file.name.replace(/\.[^.]+$/, "") || "image";
  let output: Blob;
  try {
    if (bitmap.width * bitmap.height > 25_000_000)
      throw new Error("Please resize this image to 25 megapixels or less.");
    if (id === "webp-jpg") {
      progress("Converting WebP to JPG…", 50);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not initialize image processing.");
      // JPEG has no alpha channel: composite transparent areas onto white.
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0);
      output = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: options.quality === "high" ? 0.98 : 0.9,
      });
    } else {
      bitmap.close();
      progress(
        "Loading background removal model… First use may take a minute.",
        10,
      );
      try {
        const { removeBackground } = await import("@imgly/background-removal");
        // CPU WASM also works on static hosts without cross-origin isolation.
        output = await removeBackground(blob, {
          model: "isnet_quint8",
          device: "cpu",
          proxyToWorker: false,
          output: { format: "image/png", quality: 1 },
          fetchArgs: { credentials: "omit" },
          progress: (key, current, total) => {
            const fraction = total > 0 ? Math.min(1, current / total) : 0;
            const downloading = key.startsWith("fetch:");
            progress(
              downloading
                ? "Downloading background removal model… Your image stays on your device."
                : "Removing background…",
              downloading ? 10 + fraction * 40 : 55 + fraction * 35,
            );
          },
        });
      } catch {
        throw new Error(
          "Background removal could not finish. Check your internet connection so the AI model can download, then try again. For large images, try a smaller version.",
        );
      }
    }
  } finally {
    bitmap.close();
  }
  const mime = id === "webp-jpg" ? "image/jpeg" : "image/png";
  if (output.type !== mime || !output.size)
    throw new Error("The browser could not create the output image.");
  progress("Your image is ready.", 100);
  return {
    bytes: new Uint8Array(await output.arrayBuffer()),
    filename: `${stem}${id === "webp-jpg" ? ".jpg" : "-no-background.png"}`,
    mime,
    message:
      id === "webp-jpg"
        ? "Your JPG is ready. Transparent areas have a white background."
        : "Your subject is ready as a transparent PNG. Review the edges before using it.",
  };
}
