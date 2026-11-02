import { createHmac, timingSafeEqual } from "node:crypto";
import { YouTubeError } from "./http.ts";
import { YOUTUBE_QUALITIES, type YouTubeQuality } from "./types.ts";
import { youtubeUrl } from "./urls.ts";

export function serviceConfig() {
  const secret = process.env.YOUTUBE_SERVICE_TOKEN || "";
  if (secret.length < 32 || !process.env.YOUTUBE_SERVICE_URL)
    throw new YouTubeError(
      "YouTube downloads are not configured yet. Please try again later.",
      503,
    );
  let url: URL;
  try {
    url = new URL(process.env.YOUTUBE_SERVICE_URL);
  } catch {
    throw new YouTubeError(
      "YouTube downloads are not configured correctly.",
      503,
    );
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      ))
  )
    throw new YouTubeError(
      "YouTube downloads are not configured correctly.",
      503,
    );
  return { origin: url.origin, secret };
}

function signature(
  videoId: string,
  quality: number,
  expires: number,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`${videoId}:${quality}:${expires}`)
    .digest("hex");
}

export function signedDownloadUrl(
  origin: string,
  videoId: string,
  quality: YouTubeQuality,
  secret: string,
  now = Date.now(),
) {
  const expires = Math.floor(now / 1000) + 15 * 60;
  const url = new URL("/download", origin);
  url.search = new URLSearchParams({
    video: videoId,
    quality: String(quality),
    expires: String(expires),
    signature: signature(videoId, quality, expires, secret),
  }).toString();
  return url.href;
}

export function verifyDownload(
  params: URLSearchParams,
  secret: string,
  now = Date.now(),
) {
  const videoId = params.get("video") || "";
  const quality = Number(params.get("quality")) as YouTubeQuality;
  const expires = Number(params.get("expires"));
  const token = params.get("signature") || "";
  if (
    !/^[\w-]{11}$/.test(videoId) ||
    !YOUTUBE_QUALITIES.includes(quality) ||
    !Number.isSafeInteger(expires) ||
    expires <= now / 1000 ||
    expires > now / 1000 + 15 * 60 ||
    !/^[a-f0-9]{64}$/.test(token) ||
    !timingSafeEqual(
      Buffer.from(token, "hex"),
      Buffer.from(signature(videoId, quality, expires, secret), "hex"),
    )
  )
    throw new YouTubeError(
      "This download link has expired or is invalid. Find the video again.",
      403,
    );
  return { videoId, quality, url: youtubeUrl(videoId) };
}
