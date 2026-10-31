import {
  resolvePinterest,
  pinterestErrorResponse,
  PinterestError,
} from "@/lib/pinterest/server";
import type { PinterestPreview } from "@/lib/pinterest/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length")) > 4096)
      throw new PinterestError("The submitted link is too long.", 413);
    const chunks: Uint8Array[] = [];
    const reader = request.body?.getReader();
    let received = 0;
    try {
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          if (received > 4096)
            throw new PinterestError("The submitted link is too long.", 413);
          chunks.push(value);
        }
      }
    } finally {
      await reader?.cancel().catch(() => {});
    }
    const text = Buffer.concat(chunks).toString("utf8");
    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      throw new PinterestError("Submit a valid Pinterest link.", 400);
    }
    if (
      !input ||
      typeof input !== "object" ||
      !("url" in input) ||
      typeof input.url !== "string"
    )
      throw new PinterestError("Paste a Pinterest link first.", 400);
    const result = await resolvePinterest(input.url, request.signal);
    const preview: PinterestPreview = {
      ...result,
      media: result.media.map((item) => ({
        id: item.id,
        type: item.type,
        previewUrl: item.previewUrl,
        width: item.width,
        height: item.height,
        downloadUrl: `/api/pinterest/download/?pin=${result.pinId}&media=${item.id}`,
      })),
    };
    return Response.json(preview, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return pinterestErrorResponse(error);
  }
}
