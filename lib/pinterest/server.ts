import { createHash } from "node:crypto";
import { parsePinterestUrl, pinIdFromUrl, safeMediaUrl } from "./urls.ts";
import type { PinterestMedia, PinterestResult } from "./types.ts";
import { progressiveCandidates, videoSignature } from "./video.ts";

type Fetch = typeof fetch;
type ObjectData = Record<string, unknown>;
const USER_AGENT = "Mozilla/5.0 (compatible; PDFZivra/1.0)";
const MAX_PAGE_BYTES = 5 * 1024 * 1024;
export const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;

export class PinterestError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.name = "PinterestError";
    this.status = status;
  }
}

function object(value: unknown): ObjectData {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as ObjectData)
    : {};
}

function size(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

// Follow redirects manually and recheck every destination before making a request.
export async function fetchPinterest(
  url: string,
  kind: "page" | "media",
  signal: AbortSignal,
  fetcher: Fetch = fetch,
): Promise<Response> {
  let target = url;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (kind === "page") parsePinterestUrl(target);
    else if (!safeMediaUrl(target))
      throw new PinterestError("Invalid media address.", 400);
    const response = await fetcher(target, {
      redirect: "manual",
      cache: "no-store",
      signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: kind === "page" ? "application/json,text/html" : "*/*",
        ...(kind === "page"
          ? { "X-Pinterest-PWS-Handler": "www/[username].js" }
          : {}),
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location)
        throw new PinterestError(
          "Pinterest returned an incomplete redirect.",
          502,
        );
      target = new URL(location, target).href;
      continue;
    }
    return response;
  }
  throw new PinterestError(
    "The Pinterest share link redirects too many times.",
  );
}

async function textBody(response: Response): Promise<string> {
  if (Number(response.headers.get("content-length")) > MAX_PAGE_BYTES) {
    await response.body?.cancel();
    throw new PinterestError(
      "Pinterest returned a page that is too large.",
      502,
    );
  }
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_PAGE_BYTES)
        throw new PinterestError(
          "Pinterest returned a page that is too large.",
          502,
        );
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function resolvePinId(
  input: string,
  signal: AbortSignal,
  fetcher: Fetch,
) {
  let url: URL;
  try {
    url = parsePinterestUrl(input);
  } catch (error) {
    throw new PinterestError((error as Error).message, 400);
  }
  const id = pinIdFromUrl(url);
  if (id) return id;
  if (url.hostname !== "pin.it")
    throw new PinterestError(
      "Open an individual Pin and copy its link. Board and profile links are not supported.",
      400,
    );
  // Short links redirect to a full Pin URL. Never visit a non-Pinterest host.
  let target = url.href;
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = parsePinterestUrl(target);
    const pinId = pinIdFromUrl(current);
    if (pinId) return pinId;
    const nested =
      current.pathname === "/url_shortener/"
        ? current.searchParams.get("url")
        : null;
    if (nested) {
      target = parsePinterestUrl(nested).href;
      continue;
    }
    const response = await fetcher(target, {
      redirect: "manual",
      cache: "no-store",
      signal,
      headers: { "User-Agent": USER_AGENT },
    });
    const location = response.headers.get("location");
    if (response.ok && !location) {
      const html = await textBody(response);
      for (const tag of html.matchAll(/<(?:meta|link)\b[^>]*>/gi)) {
        const attributes = new Map(
          [...tag[0].matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map(
            (match) => [match[1].toLowerCase(), decodeEntities(match[3])],
          ),
        );
        const candidate =
          attributes.get("rel")?.toLowerCase() === "canonical"
            ? attributes.get("href")
            : (attributes.get("property") || attributes.get("name")) ===
                "og:url"
              ? attributes.get("content")
              : attributes.get("http-equiv")?.toLowerCase() === "refresh"
                ? attributes
                    .get("content")
                    ?.match(/\burl\s*=\s*(.+)$/i)?.[1]
                    ?.replace(/^["']|["']$/g, "")
                : undefined;
        if (!candidate) continue;
        try {
          const linked = parsePinterestUrl(new URL(candidate, target).href);
          const linkedId = pinIdFromUrl(linked);
          if (linkedId) return linkedId;
        } catch {}
      }
      break;
    }
    await response.body?.cancel();
    if (response.status === 429 || response.status === 503)
      throw new PinterestError(
        "Pinterest temporarily limited this share link. Please try again shortly.",
        429,
      );
    if (![301, 302, 303, 307, 308].includes(response.status) || !location)
      break;
    target = new URL(location, target).href;
  }
  throw new PinterestError(
    "That share link did not lead to a public Pin. Try its full pinterest.com/pin/ link.",
  );
}

function bestImage(images: unknown): ObjectData | undefined {
  return Object.values(object(images))
    .map(object)
    .filter(
      (image) =>
        safeMediaUrl(image.url) &&
        /\.(?:jpe?g|png|webp|gif|avif)$/i.test(
          new URL(image.url as string).pathname,
        ),
    )
    .sort(
      (a, b) =>
        (size(b.width) || 0) * (size(b.height) || 0) -
        (size(a.width) || 0) * (size(a.height) || 0),
    )[0];
}

function mediaItem(
  data: ObjectData,
  type: "image" | "video",
  preview?: string,
): PinterestMedia {
  const url = safeMediaUrl(data.url)!;
  return {
    id: createHash("sha256").update(url).digest("hex").slice(0, 20),
    type,
    url,
    previewUrl:
      safeMediaUrl(data.thumbnail) ||
      preview ||
      (type === "image" ? url : undefined),
    width: size(data.width),
    height: size(data.height),
  };
}

async function hasMp4File(
  url: string,
  signal: AbortSignal,
  fetcher: Fetch,
): Promise<boolean> {
  const response = await fetchPinterest(url, "media", signal, fetcher);
  if (
    !response.ok ||
    response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
      "video/mp4"
  ) {
    await response.body?.cancel();
    return false;
  }
  const reader = response.body?.getReader();
  if (!reader) return false;
  const prefix: number[] = [];
  try {
    while (prefix.length < 12) {
      const { done, value } = await reader.read();
      if (done) break;
      prefix.push(...value.subarray(0, 12 - prefix.length));
    }
    return (
      prefix.length >= 12 &&
      Buffer.from(prefix).toString("ascii", 4, 8) === "ftyp"
    );
  } finally {
    await reader.cancel().catch(() => {});
  }
}

function videoSources(pin: ObjectData): ObjectData[] {
  const sources = [object(pin.videos)];
  const pages = object(pin.story_pin_data).pages;
  if (Array.isArray(pages))
    for (const page of pages.slice(0, 50)) {
      sources.push(object(object(page).video));
      const blocks = object(page).blocks;
      if (Array.isArray(blocks))
        sources.push(
          ...blocks.slice(0, 50).map((block) => object(object(block).video)),
        );
    }
  return sources
    .filter((source) => Object.keys(object(source.video_list)).length)
    .slice(0, 50);
}

async function expandVideoSources(
  pin: ObjectData,
  signal: AbortSignal,
  fetcher: Fetch,
) {
  const sources = videoSources(pin);
  async function expand(source: ObjectData) {
    const list = object(source.video_list);
    const variants = Object.values(list).map(object);
    if (
      variants.some((variant) => {
        const url = safeMediaUrl(variant.url);
        return url && /\.mp4$/i.test(new URL(url).pathname);
      })
    )
      return;
    const hls = variants.find((variant) => {
      const url = safeMediaUrl(variant.url);
      return url && /\.m3u8$/i.test(new URL(url).pathname);
    });
    if (!hls) return;
    try {
      const response = await fetchPinterest(
        hls.url as string,
        "media",
        signal,
        fetcher,
      );
      if (!response.ok) {
        await response.body?.cancel();
        return;
      }
      const manifest = await textBody(response);
      for (const candidate of progressiveCandidates(
        response.url || (hls.url as string),
        manifest,
      )) {
        try {
          if (await hasMp4File(candidate.url, signal, fetcher)) {
            source.video_list = {
              ...list,
              PDFZIVRA_MP4: { ...hls, ...candidate },
            };
            return;
          }
        } catch (error) {
          if (signal.aborted) throw error;
        }
      }
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  for (let index = 0; index < sources.length; index += 3)
    await Promise.all(sources.slice(index, index + 3).map(expand));
}

export function extractPinMedia(data: unknown, pinId: string): PinterestResult {
  const pin = object(data);
  if (object(pin.embed).src)
    throw new PinterestError(
      "This Pin embeds media from another website. Only images and videos hosted by Pinterest can be downloaded here.",
    );
  const media: PinterestMedia[] = [];
  let unavailableVideos = 0;
  const cover = bestImage(pin.images);
  const preview = safeMediaUrl(cover?.url);
  function video(value: unknown): boolean {
    const source = object(value);
    if (!Object.keys(source).length) return false;
    const variants = Object.values(object(source.video_list)).map(object);
    const best = variants
      .filter((item) => {
        const url = safeMediaUrl(item.url);
        return url && /\.mp4$/i.test(new URL(url).pathname);
      })
      .sort(
        (a, b) =>
          (size(b.width) || 0) * (size(b.height) || 0) -
          (size(a.width) || 0) * (size(a.height) || 0),
      )[0];
    if (best) media.push(mediaItem(best, "video", preview));
    else unavailableVideos++;
    return true;
  }
  const hasMainVideo = video(pin.videos);
  const pages = object(pin.story_pin_data).pages;
  if (Array.isArray(pages)) {
    for (const page of pages.slice(0, 50)) {
      const hasPageVideo = video(object(page).video);
      const blocks = object(page).blocks;
      if (!Array.isArray(blocks)) continue;
      for (const raw of blocks.slice(0, 50)) {
        const block = object(raw);
        if (video(block.video)) continue;
        if (hasPageVideo) continue;
        const image =
          bestImage(object(block.image).images) || bestImage(block.images);
        if (image) media.push(mediaItem(image, "image"));
      }
    }
  }
  // A video's cover is a preview, never a replacement for an unavailable video.
  if (!media.length && !hasMainVideo && !unavailableVideos && cover)
    media.push(mediaItem(cover, "image"));
  if (!media.length)
    throw new PinterestError(
      unavailableVideos
        ? "This Pin does not expose a downloadable MP4. Its streaming-only or embedded video cannot be downloaded here."
        : "No downloadable media was found. The Pin may be private, deleted, or unavailable without signing in.",
    );
  const title = [pin.title, pin.grid_title, pin.description].find(
    (value) => typeof value === "string" && value.trim(),
  );
  return {
    pinId,
    title:
      typeof title === "string" ? title.trim().slice(0, 200) : "Pinterest Pin",
    sourceUrl: `https://www.pinterest.com/pin/${pinId}/`,
    media: [...new Map(media.map((item) => [item.url, item])).values()].slice(
      0,
      50,
    ),
    ...(unavailableVideos
      ? {
          notice:
            "Some video pages do not expose a downloadable MP4. The available files are listed below.",
        }
      : {}),
  };
}

function decodeEntities(value: string): string {
  return value.replace(
    /&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,
    (entity) => {
      const names: Record<string, string> = {
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
      };
      if (entity.toLowerCase() in names) return names[entity.toLowerCase()];
      const hex = entity.toLowerCase().startsWith("&#x");
      const code = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    },
  );
}

export function extractPinHtml(
  html: string,
  pinId: string,
  knownVideoSignatures: ReadonlySet<string> = new Set(),
): PinterestResult {
  // Only use this Pin's state. Related/recommended Pins must never enter results.
  let visited = 0;
  const schemas: ObjectData[] = [];
  function find(value: unknown, depth = 0): ObjectData | undefined {
    if (!value || typeof value !== "object" || depth > 30 || ++visited > 30000)
      return;
    const record = object(value);
    if (
      String(record.id) === pinId &&
      (record.images || record.videos || record.story_pin_data)
    )
      return record;
    const keyedPin = object(record[pinId]);
    if (keyedPin.images || keyedPin.videos || keyedPin.story_pin_data)
      return keyedPin;
    for (const child of Object.values(value)) {
      const result = find(child, depth + 1);
      if (result) return result;
    }
  }
  for (const script of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
  )) {
    if (
      !/application\/(?:ld\+)?json|__PWS_DATA__|__PWS_INITIAL_PROPS__/i.test(
        script[1],
      )
    )
      continue;
    try {
      const payload = JSON.parse(script[2]);
      if (/application\/ld\+json/i.test(script[1])) {
        const root = Array.isArray(payload) ? payload : [payload];
        for (const entry of root) {
          const graph = object(entry)["@graph"];
          schemas.push(...(Array.isArray(graph) ? graph : [entry]).map(object));
        }
      }
      const pin = find(payload);
      if (pin) return extractPinMedia(pin, pinId);
    } catch (error) {
      if (error instanceof PinterestError) throw error;
    }
  }
  const matchesPin = (value: unknown) => {
    if (typeof value !== "string") return false;
    try {
      return pinIdFromUrl(parsePinterestUrl(value)) === pinId;
    } catch {
      return false;
    }
  };
  // Modern public pages expose the video's MP4 in JSON-LD, even when the
  // Open Graph image is only its cover. Check video schemas before images.
  const videoSchema = schemas.find((schema) => {
    const signature = videoSignature(schema.contentUrl);
    // A re-saved Pin can have a different canonical Pin ID. Accept it only
    // when its video matches the asset returned for the requested Pin's ID.
    return (
      schema["@type"] === "VideoObject" &&
      (matchesPin(schema["@id"] || schema.url) ||
        (signature && knownVideoSignatures.has(signature)))
    );
  });
  if (videoSchema)
    return extractPinMedia(
      {
        title: videoSchema.name,
        images: { orig: { url: videoSchema.thumbnailUrl } },
        videos: { video_list: { original: { url: videoSchema.contentUrl } } },
      },
      pinId,
    );
  const imageSchema = schemas.find(
    (schema) =>
      schema["@type"] === "SocialMediaPosting" &&
      (matchesPin(object(schema.mainEntityOfPage)["@id"]) ||
        matchesPin(object(schema.sharedContent).url)),
  );
  if (imageSchema && typeof imageSchema.image === "string")
    return extractPinMedia(
      {
        title: imageSchema.headline,
        images: { orig: { url: imageSchema.image } },
      },
      pinId,
    );
  const meta = new Map<string, string>();
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map(
      [...tag[0].matchAll(/([\w:]+)\s*=\s*(["'])([\s\S]*?)\2/g)].map((m) => [
        m[1].toLowerCase(),
        decodeEntities(m[3]),
      ]),
    );
    const key = attributes.get("property") || attributes.get("name");
    if (key && attributes.get("content"))
      meta.set(key, attributes.get("content")!);
  }
  // A login wall's metadata can describe a different Pin; require a matching ID.
  const canonical = meta.get("og:url");
  if (!canonical || pinIdFromUrl(parsePinterestUrl(canonical)) !== pinId)
    throw new PinterestError(
      "Pinterest did not return this public Pin. Check the link and try again.",
    );
  const video = safeMediaUrl(
    meta.get("og:video:secure_url") || meta.get("og:video"),
  );
  const isVideo = meta.get("og:type")?.includes("video") || !!video;
  return extractPinMedia(
    {
      title: meta.get("og:title"),
      images: { orig: { url: meta.get("og:image") } },
      ...(isVideo
        ? { videos: { video_list: { original: { url: video } } } }
        : {}),
    },
    pinId,
  );
}

export async function resolvePinterest(
  input: string,
  signal?: AbortSignal,
  fetcher: Fetch = fetch,
): Promise<PinterestResult> {
  const timeout = AbortSignal.timeout(20000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const pinId = await resolvePinId(input, combined, fetcher);
  const api = new URL("https://www.pinterest.com/resource/PinResource/get/");
  api.searchParams.set(
    "data",
    JSON.stringify({
      options: { id: pinId, field_set_key: "unauth_react_main_pin" },
    }),
  );
  let apiHasVideo = false;
  const knownVideoSignatures = new Set<string>();
  try {
    const response = await fetchPinterest(api.href, "page", combined, fetcher);
    if (response.ok) {
      const payload = object(JSON.parse(await textBody(response)));
      const pin = object(object(payload.resource_response).data);
      if (String(pin.id) === pinId) {
        const sources = videoSources(pin);
        apiHasVideo = sources.length > 0 || !!object(pin.embed).src;
        for (const source of sources)
          for (const variant of Object.values(object(source.video_list))) {
            const signature = videoSignature(object(variant).url);
            if (signature) knownVideoSignatures.add(signature);
          }
        await expandVideoSources(pin, combined, fetcher);
        return extractPinMedia(pin, pinId);
      }
    } else await response.body?.cancel();
  } catch (error) {
    if (combined.aborted) throw error;
    // Try the public page if the metadata endpoint is unavailable.
  }
  const response = await fetchPinterest(
    `https://www.pinterest.com/pin/${pinId}/`,
    "page",
    combined,
    fetcher,
  );
  if (!response.ok) {
    await response.body?.cancel();
    throw new PinterestError(
      "Pinterest could not open this Pin. It may be private, removed, or temporarily unavailable.",
      response.status === 429 ? 429 : 422,
    );
  }
  const result = extractPinHtml(
    await textBody(response),
    pinId,
    knownVideoSignatures,
  );
  if (apiHasVideo && !result.media.some((item) => item.type === "video"))
    throw new PinterestError(
      "Pinterest did not provide a downloadable video for this Pin. Its cover image is not the video. Please try again later.",
    );
  return result;
}

const mediaTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
};

export async function downloadPinterest(
  pinId: string,
  mediaId: string,
  signal?: AbortSignal,
  fetcher: Fetch = fetch,
): Promise<Response> {
  if (!/^\d{5,30}$/.test(pinId) || !/^[\da-f]{20}$/.test(mediaId))
    throw new PinterestError(
      "The download link is invalid. Find the Pin again.",
      400,
    );
  const timeout = AbortSignal.timeout(55000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const pin = await resolvePinterest(
    `https://www.pinterest.com/pin/${pinId}/`,
    combined,
    fetcher,
  );
  const item = pin.media.find((candidate) => candidate.id === mediaId);
  if (!item)
    throw new PinterestError(
      "This file is no longer available. Find the Pin again.",
      404,
    );
  const response = await fetchPinterest(item.url, "media", combined, fetcher);
  const type =
    response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ||
    "";
  const extension = mediaTypes[type];
  if (
    !response.ok ||
    !extension ||
    !type.startsWith(`${item.type}/`) ||
    !response.body
  ) {
    await response.body?.cancel();
    throw new PinterestError(
      "Pinterest could not provide the media file. Find the Pin again or try later.",
      502,
    );
  }
  const length = Number(response.headers.get("content-length"));
  if (length > MAX_DOWNLOAD_BYTES) {
    await response.body.cancel();
    throw new PinterestError(
      "This file exceeds the 100 MB download limit.",
      413,
    );
  }
  const reader = response.body.getReader();
  let received = 0;
  // Stream with backpressure: videos do not need buffering in server memory.
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        received += value.byteLength;
        if (received > MAX_DOWNLOAD_BYTES)
          throw new PinterestError(
            "The media file exceeded the download limit.",
            413,
          );
        controller.enqueue(value);
      } catch (error) {
        await reader.cancel().catch(() => {});
        controller.error(error);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="pdfzivra-pinterest-${pinId}-${mediaId}.${extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function pinterestErrorResponse(error: unknown): Response {
  const timeout =
    error instanceof Error &&
    ["TimeoutError", "AbortError"].includes(error.name);
  const message =
    error instanceof PinterestError
      ? error.message
      : timeout
        ? "Pinterest took too long to respond. Please try again."
        : "Pinterest is unavailable right now. Please try again shortly.";
  return Response.json(
    { error: message },
    {
      status:
        error instanceof PinterestError ? error.status : timeout ? 504 : 502,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
