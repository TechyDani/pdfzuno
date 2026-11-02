"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, ExternalLink, LoaderCircle, Video } from "lucide-react";
import { parseYouTubeUrl } from "@/lib/youtube/urls";
import {
  MAX_YOUTUBE_BYTES,
  type YouTubePreview,
  type YouTubeQuality,
} from "@/lib/youtube/types";

async function responseError(response: Response): Promise<never> {
  const data = await response.json().catch(() => null);
  throw new Error(
    data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
      ? data.error
      : "The video service could not complete this request. Please try again.",
  );
}

export function YouTubeDownloader() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<YouTubePreview | null>(null);
  const [quality, setQuality] = useState<YouTubeQuality>(720);
  const [busy, setBusy] = useState<"finding" | "downloading" | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  async function findVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setStatus("");
    try {
      parseYouTubeUrl(url);
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy("finding");
    setStatus("Finding available video downloads…");
    try {
      const response = await fetch("/api/youtube/resolve/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      if (!response.ok) await responseError(response);
      const video: YouTubePreview = await response.json();
      if (!video.downloads?.length)
        throw new Error("No downloadable MP4 was found for this video.");
      controller.signal.throwIfAborted();
      setResult(video);
      setQuality(video.qualities.includes(720) ? 720 : video.qualities[0]);
      setStatus("Video found. Choose a quality and download your MP4.");
    } catch (error) {
      setStatus(controller.signal.aborted ? "Request cancelled." : "");
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Could not find this video. Please try again.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  }

  async function download() {
    const item = result?.downloads.find((item) => item.quality === quality);
    if (!result || !item) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy("downloading");
    setError("");
    setStatus("Preparing your MP4 with audio. This may take a minute…");
    try {
      const response = await fetch(item.url, {
        signal: controller.signal,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) await responseError(response);
      if (
        !response.headers.get("content-type")?.startsWith("video/mp4") ||
        !response.body
      )
        throw new Error(
          "The service did not return an MP4 video. Find the video again.",
        );
      const expected = Number(response.headers.get("content-length")) || 0;
      if (expected > MAX_YOUTUBE_BYTES) {
        await response.body.cancel();
        throw new Error(
          "This file exceeds the 100 MB download limit. Try a lower quality.",
        );
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.length;
          if (received > MAX_YOUTUBE_BYTES)
            throw new Error(
              "This file exceeds the 100 MB download limit. Try a lower quality.",
            );
          chunks.push(new Uint8Array(value));
          setStatus(
            `Downloading… ${(received / 1024 / 1024).toFixed(1)} MB${expected ? ` of ${(expected / 1024 / 1024).toFixed(1)} MB` : ""}`,
          );
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      if (!received || (expected && expected !== received))
        throw new Error("The download was interrupted. Please try again.");
      controller.signal.throwIfAborted();
      const blob = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
      const link = document.createElement("a");
      link.href = blob;
      link.download = `zivratools-youtube-${result.videoId}-${quality}p.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blob), 60000);
      setStatus("Download ready. Check your browser’s downloads.");
    } catch (error) {
      setStatus(controller.signal.aborted ? "Request cancelled." : "");
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "The download was interrupted. Please try again.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  }

  return (
    <section
      id="tool-workspace"
      className="tool-workspace pinterest-workspace youtube-workspace"
      aria-label="YouTube downloader workspace"
      aria-busy={!!busy}
    >
      <div className="pinterest-intro">
        <span className="pinterest-link-icon youtube-link-icon">
          <Video size={26} aria-hidden="true" />
        </span>
        <div>
          <h2>Paste a YouTube link</h2>
          <p>Videos and Shorts — download an MP4 with audio.</p>
        </div>
      </div>
      <form onSubmit={findVideo} className="pinterest-form">
        <label className="field" htmlFor="youtube-url">
          YouTube video or Shorts URL
          <input
            id="youtube-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
            value={url}
            disabled={!!busy}
            required
            maxLength={2048}
            aria-describedby="youtube-help"
            aria-invalid={!!error}
            onChange={(event) => {
              setUrl(event.target.value);
              setResult(null);
              setError("");
              setStatus("");
            }}
          />
        </label>
        <button type="submit" className="primary" disabled={!!busy}>
          {busy === "finding" ? (
            <LoaderCircle
              size={17}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Download size={17} aria-hidden="true" />
          )}
          {busy === "finding" ? "Finding video…" : "Find downloads"}
        </button>
      </form>
      <p id="youtube-help" className="pinterest-help">
        Public videos and YouTube Shorts up to 20 minutes. Maximum 100 MB per
        file. Download only videos you own or have permission to save.
      </p>
      {busy && (
        <button
          type="button"
          className="pinterest-cancel"
          onClick={() => active.current?.abort()}
        >
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="pinterest-error">
          {error}
        </p>
      )}
      <p role="status" className="pinterest-status" aria-live="polite">
        {status}
      </p>
      {result && (
        <div className="pinterest-results">
          <div className="pinterest-results-heading">
            <h3>{result.title}</h3>
            <a href={result.sourceUrl} target="_blank" rel="noreferrer">
              View on YouTube <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
          <article className="pinterest-media youtube-media">
            <div className="pinterest-preview">
              <Image
                src={`https://i.ytimg.com/vi/${result.videoId}/hqdefault.jpg`}
                alt={`Preview of ${result.title}`}
                width={480}
                height={360}
                unoptimized
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="pinterest-media-info">
              <p>
                MP4 video with audio · {Math.floor(result.duration / 60)}:
                {String(Math.floor(result.duration % 60)).padStart(2, "0")}
              </p>
              <label className="field" htmlFor="youtube-quality">
                Download quality
                <select
                  id="youtube-quality"
                  value={quality}
                  disabled={!!busy}
                  onChange={(event) =>
                    setQuality(Number(event.target.value) as YouTubeQuality)
                  }
                >
                  {result.qualities.map((q) => (
                    <option key={q} value={q}>
                      Up to {q}p
                      {q === 1080
                        ? " · Full HD"
                        : q === 720
                          ? " · HD"
                          : " · Smaller file"}
                    </option>
                  ))}
                </select>
              </label>
              <p>
                Quality depends on the source. Download links expire after 15
                minutes.
              </p>
              <button
                type="button"
                className="primary"
                disabled={!!busy}
                onClick={download}
              >
                {busy === "downloading" ? (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Download size={16} aria-hidden="true" />
                )}
                {busy === "downloading"
                  ? "Preparing download…"
                  : "Download MP4"}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
