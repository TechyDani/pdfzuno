import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";

export const videoId = "BaW_jenozKc";
export const secret = "youtube-test-secret-that-is-long-enough-12345";
export const mp4 = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from("ftypisom"),
  Buffer.alloc(32),
]);
export const metadata = {
  id: videoId,
  title: "A sample YouTube Short",
  extractor_key: "Youtube",
  duration: 30,
  formats: [360, 720, 1080].map((height) => ({
    ext: "mp4",
    vcodec: "avc1",
    acodec: "mp4a",
    height,
    filesize: 48,
  })),
};

// The executable exercises the real spawn/file/stream paths without relying on
// YouTube, ffmpeg, or a public downloader provider in deterministic tests.
export async function makeYouTubeFixture() {
  const directory = await mkdtemp(path.join(tmpdir(), "youtube-test-"));
  const executable = path.join(directory, "yt-dlp");
  const log = path.join(directory, "arguments.json");
  await writeFile(
    executable,
    `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(log)}, JSON.stringify(args));
const mode = process.env.YT_FIXTURE_MODE || "valid";
if (mode === "slow") { setTimeout(() => process.exit(0), 60000); return; }
if (mode === "failure") { process.stderr.write("ERROR: Video unavailable"); process.exit(1); }
if (args.includes("--dump-single-json")) {
  process.stdout.write(JSON.stringify(${JSON.stringify(metadata)}));
} else if (mode !== "missing") {
  const output = args[args.indexOf("--output") + 1].replace("%(ext)s", "mp4");
  fs.writeFileSync(output, mode === "invalid-file" ? "This is not a video file" : Buffer.from(${JSON.stringify([...mp4])}));
  if (mode === "oversize") fs.truncateSync(output, 100 * 1024 * 1024 + 1);
}
`,
    { mode: 0o700 },
  );
  return {
    executable,
    log,
    close: () => rm(directory, { recursive: true, force: true }),
  };
}

export async function startYouTubeFixtureService(
  fixture,
  allowedOrigins = "https://website.test,http://localhost:3000",
) {
  const probe = createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(
    process.execPath,
    ["--experimental-strip-types", "scripts/youtube-service.mjs"],
    {
      env: {
        ...process.env,
        PORT: String(port),
        YT_DLP_PATH: fixture.executable,
        YOUTUBE_SERVICE_TOKEN: secret,
        YOUTUBE_ALLOWED_ORIGINS: allowedOrigins,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  const close = async () => {
    if (child.exitCode !== null) return;
    const ended = once(child, "exit");
    child.kill("SIGTERM");
    const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
    await ended;
    clearTimeout(timeout);
  };
  const url = `http://127.0.0.1:${port}`;
  try {
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(output);
      try {
        if ((await fetch(`${url}/health`)).ok) return { url, close };
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error(`Downloader did not start: ${output}`);
  } catch (error) {
    await close();
    throw error;
  }
}
