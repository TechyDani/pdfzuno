import { serviceConfig, signedDownloadUrl } from "@/lib/youtube/access";
import {
  readYouTubeInput,
  YouTubeError,
  youtubeErrorResponse,
} from "@/lib/youtube/http";
import { parseYouTubeUrl, youtubeUrl } from "@/lib/youtube/urls";
import {
  MAX_YOUTUBE_SECONDS,
  YOUTUBE_QUALITIES,
  type YouTubeInfo,
} from "@/lib/youtube/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    let videoId: string;
    try {
      videoId = parseYouTubeUrl(await readYouTubeInput(request));
    } catch (error) {
      if (error instanceof YouTubeError) throw error;
      throw new YouTubeError(
        error instanceof Error ? error.message : "Paste a valid YouTube link.",
      );
    }
    const { origin, secret } = serviceConfig();
    const response = await fetch(`${origin}/resolve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: youtubeUrl(videoId) }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(45000)]),
      redirect: "error",
      cache: "no-store",
    });
    const info = (await response.json()) as YouTubeInfo & { error?: string };
    if (!response.ok) {
      // Authentication/configuration failures belong to the service, not the visitor.
      const allowed = [400, 413, 422, 429, 503, 504].includes(response.status);
      throw new YouTubeError(
        allowed && typeof info.error === "string"
          ? info.error.slice(0, 300)
          : "The video service is unavailable. Please try again later.",
        allowed ? response.status : 502,
      );
    }
    if (
      info.videoId !== videoId ||
      typeof info.title !== "string" ||
      !Number.isFinite(info.duration) ||
      info.duration <= 0 ||
      info.duration > MAX_YOUTUBE_SECONDS ||
      !Array.isArray(info.qualities)
    )
      throw new YouTubeError(
        "The video service returned an invalid response.",
        502,
      );
    const qualities = YOUTUBE_QUALITIES.filter((q) =>
      info.qualities.includes(q),
    );
    if (!qualities.length)
      throw new YouTubeError(
        "No MP4 download with audio is available for this video.",
        422,
      );
    return Response.json(
      {
        videoId,
        title: info.title.slice(0, 300),
        sourceUrl: youtubeUrl(videoId),
        duration: info.duration,
        qualities,
        downloads: qualities.map((quality) => ({
          quality,
          url: signedDownloadUrl(origin, videoId, quality, secret),
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return youtubeErrorResponse(error);
  }
}
