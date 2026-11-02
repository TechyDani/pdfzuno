export function parseYouTubeUrl(input: string): string {
  const invalid = () =>
    new Error("Paste a valid YouTube video or Shorts link.");
  if (typeof input !== "string" || input.length > 2048) throw invalid();
  let url: URL;
  try {
    url = new URL(
      /^https?:\/\//i.test(input.trim())
        ? input.trim()
        : `https://${input.trim()}`,
    );
  } catch {
    throw invalid();
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw invalid();
  let id: string | null = null;
  if (url.hostname === "youtu.be") {
    id = url.pathname.match(/^\/([\w-]{11})\/?$/)?.[1] || null;
  } else if (
    [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "music.youtube.com",
    ].includes(url.hostname)
  ) {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else
      id =
        url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})\/?$/)?.[1] ||
        null;
  }
  if (!id || !/^[\w-]{11}$/.test(id)) throw invalid();
  return id;
}

export function youtubeUrl(id: string) {
  if (!/^[\w-]{11}$/.test(id)) throw new Error("Invalid YouTube video ID.");
  return `https://www.youtube.com/watch?v=${id}`;
}
