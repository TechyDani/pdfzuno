import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { resolveYouTube, downloadYouTube } from "../lib/youtube/worker.ts";
import { verifyDownload } from "../lib/youtube/access.ts";
import {
  readYouTubeInput,
  YouTubeError,
  youtubeErrorResponse,
} from "../lib/youtube/http.ts";

const secret = process.env.YOUTUBE_SERVICE_TOKEN || "";
if (secret.length < 32)
  throw new Error(
    "Set YOUTUBE_SERVICE_TOKEN to a random secret of at least 32 characters.",
  );
const origins = (process.env.YOUTUBE_ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => new URL(origin.trim()).origin);
const requests = new Set();
const server = createServer(async (incoming, outgoing) => {
  const controller = new AbortController();
  requests.add(controller);
  incoming.on("aborted", () => controller.abort());
  outgoing.on("close", () => {
    requests.delete(controller);
    if (!outgoing.writableFinished) controller.abort();
  });
  const origin = incoming.headers.origin;
  const cors =
    origin && origins.includes(origin)
      ? {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Expose-Headers":
            "Content-Length, Content-Disposition",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          Vary: "Origin",
        }
      : {};
  let response;
  try {
    if (origin && !origins.includes(origin))
      throw new YouTubeError(
        "This website is not allowed to use the download service.",
        403,
      );
    const url = new URL(incoming.url, "http://localhost");
    if (incoming.method === "OPTIONS")
      response = new Response(null, { status: 204 });
    else if (url.pathname === "/health" && incoming.method === "GET")
      response = Response.json({ ok: true, service: "zivratools-youtube" });
    else if (url.pathname === "/resolve" && incoming.method === "POST") {
      const auth = incoming.headers.authorization || "";
      const expected = `Bearer ${secret}`;
      if (
        Buffer.byteLength(auth) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(auth), Buffer.from(expected))
      )
        throw new YouTubeError("Unauthorized.", 401);
      const request = new Request(url, {
        method: "POST",
        headers: incoming.headers,
        body: Readable.toWeb(incoming),
        duplex: "half",
        signal: controller.signal,
      });
      response = Response.json(
        await resolveYouTube(
          await readYouTubeInput(request),
          controller.signal,
        ),
        { headers: { "Cache-Control": "no-store" } },
      );
    } else if (url.pathname === "/download" && incoming.method === "GET") {
      const { videoId, quality } = verifyDownload(url.searchParams, secret);
      response = await downloadYouTube(videoId, quality, controller.signal);
    } else response = Response.json({ error: "Not found." }, { status: 404 });
  } catch (error) {
    response = youtubeErrorResponse(error);
  }
  if (outgoing.destroyed) {
    await response.body?.cancel();
    return;
  }
  outgoing.writeHead(response.status, {
    ...Object.fromEntries(response.headers),
    ...cors,
  });
  try {
    if (response.body)
      await pipeline(Readable.fromWeb(response.body), outgoing);
    else outgoing.end();
  } catch {
    outgoing.destroy();
  }
});
server.headersTimeout = 15000;
server.requestTimeout = 15000;
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => {
    for (const controller of requests) controller.abort();
    const timeout = setTimeout(() => process.exit(0), 5000);
    timeout.unref();
    server.close(() => clearTimeout(timeout));
  });
}
server.listen(
  Number(process.env.PORT || 8787),
  process.env.YOUTUBE_SERVICE_HOST || "0.0.0.0",
  () => console.log("YouTube download service listening"),
);
