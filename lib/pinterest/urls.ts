// Explicit Pinterest domains keep user-supplied URLs away from arbitrary hosts.
const domains = new Set(
  [
    "com",
    "fr",
    "de",
    "ch",
    "jp",
    "cl",
    "ca",
    "it",
    "co.uk",
    "nz",
    "ru",
    "com.au",
    "at",
    "pt",
    "co.kr",
    "es",
    "com.mx",
    "dk",
    "ph",
    "th",
    "com.uy",
    "co",
    "nl",
    "info",
    "kr",
    "ie",
    "vn",
    "com.vn",
    "ec",
    "mx",
    "in",
    "pe",
    "co.at",
    "hu",
    "co.in",
    "co.nz",
    "id",
    "com.ec",
    "com.py",
    "tw",
    "be",
    "uk",
    "com.bo",
    "com.pe",
  ].map((suffix) => `pinterest.${suffix}`),
);

export function isPinterestHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return (
    domains.has(normalized) ||
    [...domains].some((domain) => normalized.endsWith(`.${domain}`))
  );
}

export function parsePinterestUrl(input: string): URL {
  if (typeof input !== "string" || !input.trim() || input.length > 2048)
    throw new Error("Paste a Pinterest Pin link or a pin.it share link.");
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    throw new Error(
      "That link is not valid. Copy the Pin link from Pinterest.",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    (!isPinterestHost(url.hostname) && url.hostname !== "pin.it")
  )
    throw new Error("Use an HTTPS link from Pinterest or pin.it.");
  url.hash = "";
  return url;
}

export function pinIdFromUrl(url: URL): string | undefined {
  if (!isPinterestHost(url.hostname)) return;
  return url.pathname.match(
    /^\/pin\/(?:[\w-]+--)?(\d{5,30})(?:\/sent)?\/?$/,
  )?.[1];
}

export function safeMediaUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 4096) return;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.hostname.endsWith(".pinimg.com")
    )
      return url.href;
  } catch {}
}
