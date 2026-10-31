"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Download,
  ExternalLink,
  ImageIcon,
  Link2,
  LoaderCircle,
  Video,
} from "lucide-react";
import { parsePinterestUrl } from "@/lib/pinterest/urls";
import type { PinterestPreview } from "@/lib/pinterest/types";

const MAX_BYTES = 100 * 1024 * 1024;

export function PinterestDownloader() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<PinterestPreview | null>(null);
  const [busy, setBusy] = useState<"finding" | "downloading" | null>(null);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  async function responseError(response: Response): Promise<never> {
    const payload = await response.json().catch(() => null);
    throw new Error(
      (payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : null) ||
        "The download service could not complete this request. Please try again.",
    );
  }

  async function findPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setStatus("");
    try {
      parsePinterestUrl(url);
    } catch (error) {
      setError((error as Error).message);
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setBusy("finding");
    setStatus("Finding the original media…");
    try {
      const response = await fetch("/api/pinterest/resolve/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      if (!response.ok) await responseError(response);
      const pin: PinterestPreview = await response.json();
      if (!pin.media?.length)
        throw new Error("No downloadable files were found in this Pin.");
      setResult(pin);
      setStatus(
        `${pin.media.length} ${pin.media.length === 1 ? "file is" : "files are"} ready. Choose a download below.`,
      );
    } catch (error) {
      setStatus(controller.signal.aborted ? "Request cancelled." : "");
      if (!controller.signal.aborted)
        setError(
          error instanceof Error
            ? error.message
            : "Could not read this Pin. Please try again.",
        );
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(null);
      }
    }
  }

  async function download(item: PinterestPreview["media"][number]) {
    const controller = new AbortController();
    active.current = controller;
    setBusy("downloading");
    setDownloadId(item.id);
    setError("");
    setStatus("Preparing your download…");
    try {
      const response = await fetch(item.downloadUrl, {
        signal: controller.signal,
      });
      if (!response.ok) await responseError(response);
      const type = response.headers.get("content-type") || "";
      if (
        !/^(image\/(jpeg|png|webp|gif|avif)|video\/mp4)(;|$)/.test(type) ||
        !response.body
      )
        throw new Error(
          "The server did not return an image or video. Please find the Pin again.",
        );
      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          if (received > MAX_BYTES)
            throw new Error("This file exceeds the 100 MB download limit.");
          chunks.push(new Uint8Array(value));
          setStatus(
            `Downloading… ${(received / 1024 / 1024).toFixed(1)} MB received`,
          );
        }
      } finally {
        await reader.cancel().catch(() => {});
      }
      if (!received)
        throw new Error("The downloaded file was empty. Please try again.");
      controller.signal.throwIfAborted();
      const filename = response.headers
        .get("content-disposition")
        ?.match(/filename="([\w.-]+)"/)?.[1];
      const blobUrl = URL.createObjectURL(new Blob(chunks, { type }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download =
        filename ||
        `pdfzivra-pinterest-${result?.pinId}.${item.type === "video" ? "mp4" : "jpg"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
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
        setDownloadId(null);
      }
    }
  }

  return (
    <section
      id="tool-workspace"
      className="tool-workspace pinterest-workspace"
      aria-label="Pinterest downloader workspace"
      aria-busy={!!busy}
    >
      <div className="pinterest-intro">
        <span className="pinterest-link-icon">
          <Link2 size={25} aria-hidden="true" />
        </span>
        <div>
          <h2>Paste a Pinterest link</h2>
          <p>Images, videos, and Idea Pins — choose a file and save it.</p>
        </div>
      </div>
      <form onSubmit={findPin} className="pinterest-form">
        <label className="field" htmlFor="pinterest-url">
          Pinterest Pin URL
          <input
            id="pinterest-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://www.pinterest.com/pin/… or https://pin.it/…"
            value={url}
            disabled={!!busy}
            required
            maxLength={2048}
            aria-describedby="pinterest-help"
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
          {busy === "finding" ? "Finding media…" : "Find downloads"}
        </button>
      </form>
      <p id="pinterest-help" className="pinterest-help">
        Use a public Pin link from Pinterest’s Share menu. Download only media
        you own or have permission to save.
      </p>
      {busy && (
        <button
          type="button"
          className="pinterest-cancel"
          onClick={() => {
            active.current?.abort();
            setStatus("Request cancelled.");
          }}
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
              View Pin <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
          {result.notice && <p className="pinterest-help">{result.notice}</p>}
          <div className="pinterest-media-grid">
            {result.media.map((item, index) => (
              <article className="pinterest-media" key={item.id}>
                <div className="pinterest-preview">
                  {item.previewUrl ? (
                    <Image
                      src={item.previewUrl}
                      alt={`Preview of ${item.type} ${index + 1}`}
                      width={item.width || 640}
                      height={item.height || 640}
                      unoptimized
                      referrerPolicy="no-referrer"
                    />
                  ) : item.type === "video" ? (
                    <Video size={48} aria-hidden="true" />
                  ) : (
                    <ImageIcon size={48} aria-hidden="true" />
                  )}
                </div>
                <div className="pinterest-media-info">
                  <p>
                    {item.type === "video" ? "MP4 video" : "Image"}
                    {result.media.length > 1 ? ` ${index + 1}` : ""}
                    {item.width && item.height
                      ? ` · ${item.width} × ${item.height}`
                      : ""}
                  </p>
                  <button
                    type="button"
                    className="primary"
                    disabled={!!busy}
                    onClick={() => download(item)}
                  >
                    {downloadId === item.id ? (
                      <LoaderCircle
                        size={16}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Download size={16} aria-hidden="true" />
                    )}
                    {downloadId === item.id
                      ? "Downloading…"
                      : `Download ${item.type}`}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
