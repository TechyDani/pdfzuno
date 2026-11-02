// Runs in the separate downloader container, never in a Vercel function.
import { spawn } from "node:child_process";
import { mkdtemp, readdir, stat, rm, open } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { YouTubeError } from "./http.ts";
import { parseYouTubeUrl, youtubeUrl } from "./urls.ts";
import {
  MAX_YOUTUBE_BYTES,
  MAX_YOUTUBE_SECONDS,
  YOUTUBE_QUALITIES,
  type YouTubeInfo,
  type YouTubeQuality,
} from "./types.ts";

let active = 0;
function acquire() {
  if (active >= 2)
    throw new YouTubeError(
      "The downloader is busy. Please try again shortly.",
      429,
    );
  active++;
  let released = false;
  return () => {
    if (!released) {
      released = true;
      active--;
    }
  };
}

export function runYtDlp(args: string[], signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.env.YT_DLP_PATH || "yt-dlp",
      [
        "--ignore-config",
        "--no-plugin-dirs",
        "--no-cache-dir",
        "--no-playlist",
        "--no-warnings",
        "--no-progress",
        "--socket-timeout",
        "10",
        "--retries",
        "1",
        "--fragment-retries",
        "1",
        "--js-runtimes",
        `node:${process.execPath}`,
        ...args,
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
        shell: false,
      },
    );
    let output = "";
    let diagnostic = "";
    let bytes = 0;
    let failure: Error | undefined;
    const stop = () => {
      try {
        if (process.platform !== "win32" && child.pid)
          process.kill(-child.pid, "SIGKILL");
        else child.kill("SIGKILL");
      } catch {
        /* Already exited. */
      }
    };
    const abort = () => {
      failure = new YouTubeError(
        signal.reason?.name === "TimeoutError"
          ? "The video request timed out. Please try again."
          : "Request cancelled.",
        signal.reason?.name === "TimeoutError" ? 504 : 499,
      );
      stop();
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 8 * 1024 * 1024) {
        failure = new YouTubeError("The video metadata is too large.", 422);
        stop();
      } else output += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      diagnostic = (diagnostic + chunk.toString()).slice(-8192);
    });
    child.on("error", () => {
      signal.removeEventListener("abort", abort);
      reject(
        new YouTubeError(
          "The downloader is unavailable. Please try again later.",
          503,
        ),
      );
    });
    child.on("close", (code) => {
      signal.removeEventListener("abort", abort);
      if (failure) reject(failure);
      else if (code !== 0)
        reject(
          new YouTubeError(
            /ffmpeg/i.test(diagnostic)
              ? "Video preparation is unavailable. Please try again later."
              : /max.filesize|larger than|File is larger/i.test(diagnostic)
                ? "This video exceeds the 100 MB download limit. Try a lower quality."
                : "This video is unavailable for download. It may be private, restricted, removed, or blocked by YouTube.",
            422,
          ),
        );
      else resolve(output);
    });
  });
}

type Format = {
  ext?: string;
  vcodec?: string;
  acodec?: string;
  height?: number;
  width?: number;
  filesize?: number;
  has_drm?: boolean;
};
export function videoInfo(
  raw: Record<string, unknown>,
  videoId: string,
): YouTubeInfo {
  if (
    raw.id !== videoId ||
    !["Youtube", "youtube"].includes(
      String(raw.extractor_key || raw.extractor),
    ) ||
    raw._type === "playlist"
  )
    throw new YouTubeError("The link did not resolve to a YouTube video.", 422);
  if (
    raw.is_live ||
    raw.is_upcoming ||
    raw.live_status === "is_live" ||
    raw.live_status === "is_upcoming"
  )
    throw new YouTubeError(
      "Live and upcoming videos cannot be downloaded. Try a finished video or Short.",
      422,
    );
  const duration = Number(raw.duration);
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration > MAX_YOUTUBE_SECONDS
  )
    throw new YouTubeError(
      "Choose a video or Short that is no longer than 20 minutes.",
      422,
    );
  const formats = (Array.isArray(raw.formats) ? raw.formats : []) as Format[];
  const usable = formats.filter(
    (f) => !f.has_drm && (!f.filesize || f.filesize <= MAX_YOUTUBE_BYTES),
  );
  const audio = usable.some(
    (f) => f.ext === "m4a" && f.acodec && f.acodec !== "none",
  );
  const resolutions = usable
    .filter(
      (f) =>
        f.ext === "mp4" &&
        f.vcodec &&
        f.vcodec !== "none" &&
        f.height &&
        ((f.acodec && f.acodec !== "none") || audio),
    )
    .map((f) => Math.min(f.width || f.height!, f.height!));
  const ceiling =
    YOUTUBE_QUALITIES.find((q) => q >= Math.max(...resolutions)) || 1080;
  const qualities = YOUTUBE_QUALITIES.filter(
    (q) => q <= ceiling && resolutions.some((res) => res <= q),
  );
  if (!qualities.length)
    throw new YouTubeError(
      "No MP4 download with audio is available for this video.",
      422,
    );
  return {
    videoId,
    title:
      typeof raw.title === "string" ? raw.title.slice(0, 300) : "YouTube video",
    sourceUrl: youtubeUrl(videoId),
    duration,
    qualities,
  };
}

export async function resolveYouTube(input: string, signal: AbortSignal) {
  let videoId: string;
  try {
    videoId = parseYouTubeUrl(input);
  } catch {
    throw new YouTubeError("Paste a valid YouTube video or Shorts link.");
  }
  const release = acquire();
  try {
    const output = await runYtDlp(
      ["--dump-single-json", "--skip-download", "--", youtubeUrl(videoId)],
      AbortSignal.any([signal, AbortSignal.timeout(35000)]),
    );
    return videoInfo(JSON.parse(output), videoId);
  } finally {
    release();
  }
}

export async function downloadYouTube(
  videoId: string,
  quality: YouTubeQuality,
  signal: AbortSignal,
) {
  // Validate before acquiring resources, and never accept a caller-supplied media URL.
  if (!/^[\w-]{11}$/.test(videoId) || !YOUTUBE_QUALITIES.includes(quality))
    throw new YouTubeError("Invalid video or quality.");
  const release = acquire();
  let directory: string | undefined;
  let watcher: ReturnType<typeof setInterval> | undefined;
  let stream: ReturnType<typeof createReadStream> | undefined;
  const diskLimit = new AbortController();
  const combined = AbortSignal.any([
    signal,
    diskLimit.signal,
    AbortSignal.timeout(180000),
  ]);
  const cleanup = async () => {
    if (watcher) clearInterval(watcher);
    combined.removeEventListener("abort", onAbort);
    try {
      if (directory) await rm(directory, { recursive: true, force: true });
    } finally {
      release();
    }
  };
  const onAbort = () => {
    stream?.destroy();
    void cleanup();
  };
  try {
    directory = await mkdtemp(path.join(tmpdir(), "zivratools-youtube-"));
    const folder = directory;
    let checking = false;
    watcher = setInterval(async () => {
      if (checking) return;
      checking = true;
      try {
        const files = await readdir(folder);
        const sizes = await Promise.all(
          files.map(async (file) => (await stat(path.join(folder, file))).size),
        );
        // Separate audio/video and the merged output can temporarily coexist.
        if (sizes.reduce((a, b) => a + b, 0) > MAX_YOUTUBE_BYTES * 2.2)
          diskLimit.abort();
      } catch {
        /* Files may be renamed while merging. */
      } finally {
        checking = false;
      }
    }, 250);
    const output = path.join(directory, "video.%(ext)s");
    await runYtDlp(
      [
        "--format",
        "bv[ext=mp4]+ba[ext=m4a]/b[ext=mp4]",
        // res uses the shorter side, so Shorts and landscape videos get the
        // same quality ceiling. Metadata only offers ceilings with a match.
        "--format-sort",
        `res:${quality}`,
        "--merge-output-format",
        "mp4",
        "--max-filesize",
        String(MAX_YOUTUBE_BYTES),
        "--match-filters",
        `!is_live & !is_upcoming & duration <= ${MAX_YOUTUBE_SECONDS}`,
        "--no-keep-video",
        "--output",
        output,
        ...(process.env.FFMPEG_PATH
          ? ["--ffmpeg-location", process.env.FFMPEG_PATH]
          : []),
        "--",
        youtubeUrl(videoId),
      ],
      combined,
    );
    if (watcher) clearInterval(watcher);
    const file = path.join(directory, "video.mp4");
    const info = await stat(file).catch(() => {
      throw new YouTubeError(
        "This video is unavailable or exceeds the download limits.",
        422,
      );
    });
    if (!info.size || info.size > MAX_YOUTUBE_BYTES)
      throw new YouTubeError(
        "This video exceeds the 100 MB download limit. Try a lower quality.",
        413,
      );
    const handle = await open(file, "r");
    try {
      const signature = Buffer.alloc(12);
      await handle.read(signature, 0, 12, 0);
      if (signature.toString("ascii", 4, 8) !== "ftyp")
        throw new YouTubeError(
          "The video service did not produce a valid MP4. Please try again.",
          502,
        );
    } finally {
      await handle.close();
    }
    combined.throwIfAborted();
    stream = createReadStream(file);
    stream.on("close", () => {
      void cleanup();
    });
    combined.addEventListener("abort", onAbort, { once: true });
    if (combined.aborted) {
      stream.destroy();
      combined.throwIfAborted();
    }
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(info.size),
        "Content-Disposition": `attachment; filename="zivratools-youtube-${videoId}-${quality}p.mp4"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    await cleanup();
    if (diskLimit.signal.aborted)
      throw new YouTubeError(
        "This video exceeds the download size limit. Try a lower quality.",
        413,
      );
    throw error;
  }
}
