import { safeMediaUrl } from "./urls.ts";

export type VideoVariant = {
  url: string;
  width?: number;
  height?: number;
};

export function videoSignature(value: unknown): string | undefined {
  const url = safeMediaUrl(value);
  return url
    ? new URL(url).pathname
        .match(/\/([\da-f]{32})(?=[_.\/]|$)/i)?.[1]
        ?.toLowerCase()
    : undefined;
}

// Pinterest's Idea Pin streams have matching progressive MP4 exports. The
// playlist supplies the available widths; callers must verify each MP4 before
// offering it, rather than treating a guessed URL or an HLS playlist as a file.
export function progressiveCandidates(
  playlistUrl: string,
  manifest: string,
): VideoVariant[] {
  if (!manifest.trimStart().startsWith("#EXTM3U")) return [];
  const candidates: VideoVariant[] = [];
  const lines = manifest.split(/\r?\n/).map((line) => line.trim());
  for (let index = 0; index < lines.length; index++) {
    if (!lines[index].startsWith("#EXT-X-STREAM-INF:")) continue;
    const attributes = new Map(
      [...lines[index].matchAll(/([A-Z0-9-]+)=("[^"]*"|[^,]*)/g)].map(
        (match) => [match[1], match[2].replace(/^"|"$/g, "")],
      ),
    );
    // A variant backed by a separate audio rendition is still safe here: the
    // expMp4 export is the complete, muxed file, not the video-only HLS track.
    let next = index + 1;
    while (next < lines.length && !lines[next]) next++;
    if (!lines[next] || lines[next].startsWith("#")) continue;
    let variant: URL;
    try {
      variant = new URL(lines[next], playlistUrl);
    } catch {
      continue;
    }
    if (!safeMediaUrl(variant.href)) continue;
    const [width, height] = (attributes.get("RESOLUTION") || "")
      .split("x")
      .map(Number);
    if (
      /^\/videos\/iht\/hls\/(?:[\da-f]{2}\/){3}[\da-f]{32}_\d+w\.m3u8$/i.test(
        variant.pathname,
      )
    ) {
      variant.pathname = variant.pathname
        .replace("/iht/hls/", "/iht/expMp4/")
        .replace(/\.m3u8$/i, ".mp4");
      candidates.push({
        url: variant.href,
        width: width || undefined,
        height: height || undefined,
      });
    }
  }
  // A link can point straight at a rendition rather than the master playlist.
  const direct = new URL(playlistUrl);
  const rendition = direct.pathname.match(
    /^\/videos\/iht\/hls\/(?:[\da-f]{2}\/){3}[\da-f]{32}_(\d+)w\.m3u8$/i,
  );
  if (rendition && safeMediaUrl(direct.href)) {
    direct.pathname = direct.pathname
      .replace("/iht/hls/", "/iht/expMp4/")
      .replace(/\.m3u8$/i, ".mp4");
    candidates.push({ url: direct.href, width: Number(rendition[1]) });
  }
  return [...new Map(candidates.map((item) => [item.url, item])).values()]
    .sort(
      (a, b) =>
        (b.width || 0) * (b.height || 1) - (a.width || 0) * (a.height || 1),
    )
    .slice(0, 6);
}
