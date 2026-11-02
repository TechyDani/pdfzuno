import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parseYouTubeUrl, youtubeUrl } from "../lib/youtube/urls.ts";
import {
  signedDownloadUrl,
  verifyDownload,
  serviceConfig,
} from "../lib/youtube/access.ts";
import { readYouTubeInput } from "../lib/youtube/http.ts";
import {
  videoInfo,
  resolveYouTube,
  downloadYouTube,
  runYtDlp,
} from "../lib/youtube/worker.ts";
import {
  makeYouTubeFixture,
  startYouTubeFixtureService,
  videoId,
  metadata,
  mp4,
  secret,
} from "./youtube-fixture.mjs";

for (const input of [
  youtubeUrl(videoId),
  `https://youtu.be/${videoId}?si=anything`,
  `youtube.com/shorts/${videoId}`,
  `https://m.youtube.com/watch?v=${videoId}&list=ignored`,
  `https://www.youtube.com/embed/${videoId}`,
  `https://www.youtube.com/live/${videoId}`,
])
  assert.equal(parseYouTubeUrl(input), videoId);
for (const input of [
  "",
  "https://youtube.com.evil.test/watch?v=BaW_jenozKc",
  "https://127.0.0.1/watch?v=BaW_jenozKc",
  `http://youtube.com/watch?v=${videoId}`,
  `https://youtube.com:444/watch?v=${videoId}`,
  `https://user@youtube.com/watch?v=${videoId}`,
  "https://youtube.com/playlist?list=123",
  "https://youtu.be/short",
  "https://youtube.com/watch?v=../../etc/passwd",
  "file:///etc/passwd",
  "javascript:alert(1)",
])
  assert.throws(() => parseYouTubeUrl(input), undefined, input);
const now = Date.now();
const signed = new URL(
  signedDownloadUrl("https://service.test", videoId, 720, secret, now),
);
assert.equal(verifyDownload(signed.searchParams, secret, now).videoId, videoId);
assert.throws(() =>
  verifyDownload(signed.searchParams, "different-secret", now),
);
assert.throws(() =>
  verifyDownload(signed.searchParams, secret, now + 16 * 60 * 1000),
);
signed.searchParams.set("quality", "1080");
assert.throws(() => verifyDownload(signed.searchParams, secret, now));
assert.throws(() =>
  verifyDownload(new URLSearchParams("video=invalid&quality=720"), secret),
);
assert.deepEqual(videoInfo(metadata, videoId).qualities, [360, 720, 1080]);
assert.deepEqual(
  videoInfo(
    {
      ...metadata,
      formats: [
        {
          ext: "mp4",
          vcodec: "avc1",
          acodec: "mp4a",
          width: 720,
          height: 1280,
        },
      ],
    },
    videoId,
  ).qualities,
  [720],
  "Shorts use the shorter side for resolution and do not offer unavailable higher qualities",
);
assert.deepEqual(
  videoInfo(
    {
      ...metadata,
      formats: [
        {
          ext: "mp4",
          vcodec: "avc1",
          acodec: "none",
          width: 1280,
          height: 720,
        },
        { ext: "m4a", vcodec: "none", acodec: "mp4a" },
      ],
    },
    videoId,
  ).qualities,
  [720],
  "Separate audio and video tracks can be merged",
);
for (const raw of [
  { ...metadata, is_live: true },
  { ...metadata, is_upcoming: true },
  { ...metadata, duration: 1201 },
  { ...metadata, id: "mismatch" },
  { ...metadata, extractor_key: "Generic" },
  {
    ...metadata,
    formats: [{ ext: "mp4", vcodec: "avc1", acodec: "none", height: 720 }],
  },
])
  assert.throws(() => videoInfo(raw, videoId));
assert.equal(
  await readYouTubeInput(
    new Request("https://test", {
      method: "POST",
      body: JSON.stringify({ url: youtubeUrl(videoId) }),
    }),
  ),
  youtubeUrl(videoId),
);
for (const body of ["not-json", "{}", '{"url":123}'])
  await assert.rejects(() =>
    readYouTubeInput(new Request("https://test", { method: "POST", body })),
  );
await assert.rejects(
  () =>
    readYouTubeInput(
      new Request("https://test", { method: "POST", body: "x".repeat(5000) }),
    ),
  (error) => error.status === 413,
);
delete process.env.YOUTUBE_SERVICE_URL;
assert.throws(serviceConfig, (error) => error.status === 503);

const fixture = await makeYouTubeFixture();
let service;
process.env.YT_DLP_PATH = fixture.executable;
const before = (await readdir(tmpdir())).filter((name) =>
  name.startsWith("zivratools-youtube-"),
);
try {
  const result = await resolveYouTube(
    `https://youtu.be/${videoId}?list=ignored`,
    new AbortController().signal,
  );
  assert.equal(result.title, metadata.title);
  const args = JSON.parse(await readFile(fixture.log, "utf8"));
  assert.equal(args.at(-1), youtubeUrl(videoId));
  assert(
    args.includes("--ignore-config") &&
      args.includes("--no-playlist") &&
      args.includes("--no-plugin-dirs"),
  );
  const download = await downloadYouTube(
    videoId,
    720,
    new AbortController().signal,
  );
  assert.equal(download.headers.get("content-type"), "video/mp4");
  assert.match(download.headers.get("content-disposition"), /720p\.mp4/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), mp4);
  for (const [mode, status] of [
    ["oversize", 413],
    ["invalid-file", 502],
    ["missing", 422],
    ["failure", 422],
  ]) {
    process.env.YT_FIXTURE_MODE = mode;
    await assert.rejects(
      () => downloadYouTube(videoId, 720, new AbortController().signal),
      (error) => error.status === status,
      mode,
    );
  }
  process.env.YT_FIXTURE_MODE = "slow";
  await assert.rejects(
    () => runYtDlp(["--", youtubeUrl(videoId)], AbortSignal.timeout(100)),
    (error) => error.status === 504,
  );
  const controller = new AbortController();
  const first = resolveYouTube(youtubeUrl(videoId), controller.signal).catch(
    (error) => error,
  );
  const second = resolveYouTube(youtubeUrl(videoId), controller.signal).catch(
    (error) => error,
  );
  await assert.rejects(
    () => resolveYouTube(youtubeUrl(videoId), controller.signal),
    (error) => error.status === 429,
  );
  controller.abort();
  await Promise.all([first, second]);
  process.env.YT_FIXTURE_MODE = "valid";
  await assert.rejects(() =>
    downloadYouTube("invalid", 720, controller.signal),
  );
  process.env.YT_DLP_PATH = "/no-such-yt-dlp";
  await assert.rejects(
    () => resolveYouTube(youtubeUrl(videoId), new AbortController().signal),
    (error) => error.status === 503,
  );
  process.env.YT_DLP_PATH = fixture.executable;
  service = await startYouTubeFixtureService(fixture);
  const headers = {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
  assert.equal(
    (await fetch(`${service.url}/resolve`, { method: "POST", body: "{}" }))
      .status,
    401,
  );
  const info = await fetch(`${service.url}/resolve`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: youtubeUrl(videoId) }),
  });
  assert.equal(info.status, 200);
  assert.equal((await info.json()).videoId, videoId);
  const link = signedDownloadUrl(service.url, videoId, 720, secret);
  const response = await fetch(link, {
    headers: { Origin: "https://website.test" },
  });
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    "https://website.test",
  );
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), mp4);
  assert.equal(
    (await fetch(link, { headers: { Origin: "https://untrusted.test" } }))
      .status,
    403,
  );
  assert.equal(
    (await fetch(`${service.url}/download?video=${videoId}&quality=720`))
      .status,
    403,
  );
  console.log(
    "PASS YouTube URL validation, signed links, quality/audio checks, real subprocess execution, size limits, timeouts, cancellation, concurrency, service authentication, CORS and MP4 streaming (offline fixtures)",
  );
} finally {
  await service?.close();
  await fixture.close();
  delete process.env.YT_FIXTURE_MODE;
  delete process.env.YT_DLP_PATH;
}
// Stream closure removes temporary files asynchronously.
for (let i = 0; i < 20; i++) {
  const after = (await readdir(tmpdir())).filter(
    (name) => name.startsWith("zivratools-youtube-") && !before.includes(name),
  );
  if (!after.length) break;
  if (i === 19) assert.deepEqual(after, [], "Temporary downloads were removed");
  await new Promise((resolve) => setTimeout(resolve, 50));
}
