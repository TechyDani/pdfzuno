import {
  mkdir,
  readFile,
  writeFile,
  rename,
  rm,
  chmod,
  access,
} from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import path from "node:path";
import { loadLocalEnv } from "./local-env.mjs";

await loadLocalEnv();
const platform = `${process.platform}-${process.arch}`;
const assets = {
  "darwin-x64": [
    "yt-dlp_macos",
    "929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106",
    "d4da574d6e2e197bd259b47d69cf262df9e312af24ad960444f6d806d3d4c186",
  ],
  "darwin-arm64": [
    "yt-dlp_macos",
    "8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa",
    "d986a8ec7b030899fe66a8a288ed809a3543338705a3ce178cfb85869c5d80be",
  ],
  "linux-x64": [
    "yt-dlp_linux",
    "bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa",
    "25d9b6ccb05e3d9de9e04e31e2506d8dd7f9f0418981965ac6df12e8d3afd067",
  ],
  "linux-arm64": [
    "yt-dlp_linux_aarch64",
    "754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0",
    "2ab6aba60ee84412dff9188720703376cb4e7aaf7e0b5e43aa8249f2acae5bf8",
  ],
  "win32-x64": [
    "yt-dlp.exe",
    "8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77",
    "f309e6223ad89d2fe54bccd420a7709b66fd27540674e92309578ed491a43c8d",
  ],
}[platform];
if (!assets)
  throw new Error(
    `Automatic setup is unavailable on ${platform}. Install yt-dlp and ffmpeg manually as described in README.md.`,
  );
const bin = path.resolve(".local/youtube/bin");
await mkdir(bin, { recursive: true });
const suffix = process.platform === "win32" ? ".exe" : "";
const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );
const request = async (url) => {
  const response = await fetch(url, {
    headers: { "User-Agent": "ZivraTools-local-setup" },
    signal: AbortSignal.timeout(180000),
  });
  if (!response.ok)
    throw new Error(
      `Dependency download failed (${response.status}): ${new URL(url).pathname}`,
    );
  return response;
};
async function install(url, destination, expected, compressed = false) {
  const temp = `${destination}.download`;
  const hash = createHash("sha256");
  let bytes = 0;
  const verify = new Transform({
    transform(chunk, encoding, done) {
      bytes += chunk.length;
      if (bytes > 150 * 1024 * 1024)
        return done(new Error("Dependency download exceeded its size limit."));
      hash.update(chunk);
      done(null, chunk);
    },
  });
  try {
    const response = await request(url);
    await pipeline(
      Readable.fromWeb(response.body),
      verify,
      ...(compressed ? [createGunzip()] : []),
      createWriteStream(temp, { mode: 0o700 }),
    );
    if (hash.digest("hex") !== expected)
      throw new Error("Dependency checksum did not match. Please retry setup.");
    await chmod(temp, 0o700);
    await rename(temp, destination);
  } finally {
    await rm(temp, { force: true });
  }
}

const yt = path.join(bin, `yt-dlp${suffix}`);
if (!(await exists(yt)) || process.argv.includes("--update")) {
  console.log("Installing the official yt-dlp executable…");
  const release = await (
    await request("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest")
  ).json();
  if (!/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/.test(release.tag_name))
    throw new Error("Could not identify the yt-dlp release.");
  const base = `https://github.com/yt-dlp/yt-dlp/releases/download/${release.tag_name}`;
  const sums = await (await request(`${base}/SHA2-256SUMS`)).text();
  const checksum = sums
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .find((parts) => parts[1]?.replace(/^\*/, "") === assets[0])?.[0];
  if (!/^[a-f0-9]{64}$/.test(checksum || ""))
    throw new Error("The yt-dlp checksum was missing.");
  await install(`${base}/${assets[0]}`, yt, checksum);
}
const ffmpegBase =
  "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1";
for (const [index, name] of ["ffmpeg", "ffprobe"].entries()) {
  const file = path.join(bin, `${name}${suffix}`);
  if (await exists(file)) continue;
  console.log(`Installing ${name} for ${platform}…`);
  await install(
    `${ffmpegBase}/${name}-${platform}.gz`,
    file,
    assets[index + 1],
    true,
  );
}
for (const name of ["LICENSE", "README"]) {
  const file = path.join(bin, `ffmpeg.${name}`);
  if (!(await exists(file)))
    await writeFile(
      file,
      await (await request(`${ffmpegBase}/${platform}.${name}`)).text(),
    );
}
// Check the installed programs before connecting the website to the service.
execFileSync(yt, ["--version"], { timeout: 30000, stdio: "pipe" });
execFileSync(path.join(bin, `ffmpeg${suffix}`), ["-version"], {
  timeout: 10000,
  stdio: "pipe",
});
const envFile = path.resolve(".env.local");
let content = await readFile(envFile, "utf8").catch((error) => {
  if (error.code === "ENOENT") return "";
  throw error;
});
const existing = parseEnv(content);
const config = {
  YOUTUBE_SERVICE_URL:
    process.env.YOUTUBE_SERVICE_URL || "http://127.0.0.1:8787",
  YOUTUBE_SERVICE_TOKEN:
    process.env.YOUTUBE_SERVICE_TOKEN || randomBytes(32).toString("hex"),
  YT_DLP_PATH: process.env.YT_DLP_PATH || yt,
  FFMPEG_PATH: process.env.FFMPEG_PATH || bin,
};
if (config.YOUTUBE_SERVICE_TOKEN.length < 32)
  throw new Error(
    "YOUTUBE_SERVICE_TOKEN must contain at least 32 characters. Correct it in your environment and rerun setup.",
  );
for (const [key, value] of Object.entries(config)) {
  if (existing[key] !== undefined) continue;
  content += `${content && !content.endsWith("\n") ? "\n" : ""}${key}=${JSON.stringify(value)}\n`;
}
await writeFile(envFile, content, { mode: 0o600 });
console.log(
  "YouTube local setup is ready. Restart npm run dev to start both the website and downloader. Credentials are saved in ignored .env.local.",
);
