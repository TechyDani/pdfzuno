export class YouTubeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function youtubeErrorResponse(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof YouTubeError
          ? error.message
          : "The video service could not complete this request. Please try again.",
    },
    {
      status: error instanceof YouTubeError ? error.status : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function readYouTubeInput(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (Number(request.headers.get("content-length")) > 4096)
      throw new YouTubeError("The submitted link is too long.", 413);
    if (reader)
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 4096)
          throw new YouTubeError("The submitted link is too long.", 413);
        chunks.push(value);
      }
  } finally {
    await reader?.cancel().catch(() => {});
  }
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new YouTubeError("Submit a valid YouTube link.");
  }
  if (!input || typeof input.url !== "string")
    throw new YouTubeError("Paste a YouTube video or Shorts link first.");
  return input.url;
}
