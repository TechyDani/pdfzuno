import assert from "node:assert/strict";
import {
  progressiveCandidates,
  videoSignature,
} from "../lib/pinterest/video.ts";
import {
  parsePinterestUrl,
  pinIdFromUrl,
  safeMediaUrl,
} from "../lib/pinterest/urls.ts";
import {
  extractPinMedia,
  extractPinHtml,
  resolvePinterest,
  downloadPinterest,
  fetchPinterest,
  MAX_DOWNLOAD_BYTES,
} from "../lib/pinterest/server.ts";

const id = "664281013778109217";
const imageUrl = "https://i.pinimg.com/originals/a/b/c/example.jpg";
const videoUrl = "https://v1.pinimg.com/videos/mc/720p/a/b/c/example.mp4";
const image = {
  id,
  title: "Example & Pin",
  images: {
    small: {
      url: "https://i.pinimg.com/236x/example.jpg",
      width: 236,
      height: 400,
    },
    orig: { url: imageUrl, width: 1080, height: 1920 },
  },
};
const video = {
  ...image,
  videos: {
    video_list: {
      V_360P: {
        url: "https://v1.pinimg.com/videos/360p/small.mp4",
        width: 360,
        height: 640,
      },
      V_720P: { url: videoUrl, width: 1080, height: 1920 },
      V_HLS: {
        url: "https://v1.pinimg.com/videos/example.m3u8",
        width: 2160,
        height: 3840,
      },
    },
  },
};
const mp4 = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from("ftypisom"),
  Buffer.alloc(16),
]);
const apiResponse = (pin) =>
  Response.json({ resource_response: { data: pin } });

for (const url of [
  `https://www.pinterest.com/pin/${id}/?x=1`,
  `https://uk.pinterest.com/pin/a-named-pin--${id}/`,
  `pinterest.co.uk/pin/${id}/`,
  `https://www.pinterest.com/pin/${id}/sent/?share=1`,
])
  assert.equal(pinIdFromUrl(parsePinterestUrl(url)), id);
for (const url of [
  "https://pinterest.com.evil.test/pin/12345/",
  "http://pinterest.com/pin/12345/",
  "https://pinterest.com@127.0.0.1/pin/12345/",
  "https://www.pinterest.com:444/pin/12345/",
  "https://localhost/",
  "file:///etc/passwd",
  "javascript:alert(1)",
  " ",
  "https://pin.it.evil.test/abc",
])
  assert.throws(() => parsePinterestUrl(url), undefined, url);
for (const url of [
  "https://pinimg.com.evil.test/a.jpg",
  "https://127.0.0.1/a.jpg",
  "http://i.pinimg.com/a.jpg",
  "https://i.pinimg.com:444/a.jpg",
  "https://user:secret@i.pinimg.com/a.jpg",
])
  assert.equal(safeMediaUrl(url), undefined);
assert.throws(() =>
  extractPinMedia(
    { ...image, images: { orig: { url: "https://i.pinimg.com/a.svg" } } },
    id,
  ),
);
assert.equal(extractPinMedia(image, id).media[0].url, imageUrl);
const resolvedVideo = extractPinMedia(video, id);
assert.equal(resolvedVideo.media.length, 1);
assert.equal(resolvedVideo.media[0].type, "video");
assert.equal(resolvedVideo.media[0].url, videoUrl);
const story = {
  ...image,
  story_pin_data: {
    pages: [
      { blocks: [{ video: video.videos }] },
      { blocks: [{ image: { images: image.images } }] },
      { blocks: [{ video: video.videos }] },
    ],
  },
};
assert.deepEqual(
  extractPinMedia(story, id).media.map((m) => m.type),
  ["video", "image"],
);
assert.throws(
  () =>
    extractPinMedia(
      {
        ...image,
        videos: {
          video_list: { hls: { url: "https://v1.pinimg.com/a.m3u8" } },
        },
      },
      id,
    ),
  /MP4/,
);
assert.throws(
  () =>
    extractPinMedia(
      { ...image, embed: { src: "https://example.com/video" } },
      id,
    ),
  /another website/,
);
assert.throws(() => extractPinMedia({ id }, id), /No downloadable/);
const html = `<script type="application/json" id="__PWS_DATA__">${JSON.stringify({ props: { initialReduxState: { pins: { unrelated: { ...video, id: "999999" }, [id]: image } } } })}</script>`;
assert.equal(extractPinHtml(html, id).media[0].url, imageUrl);
const meta = `<meta property="og:url" content="https://www.pinterest.com/pin/${id}/"><meta content="Title &amp; details" property="og:title"><meta property="og:image" content="${imageUrl}">`;
assert.equal(extractPinHtml(meta, id).title, "Title & details");
const videoSchema = `<script type="application/ld+json">${JSON.stringify({ "@type": "VideoObject", "@id": `https://www.pinterest.com/pin/${id}/`, name: "A video", contentUrl: videoUrl, thumbnailUrl: imageUrl })}</script>`;
const imageSchema = `<script type="application/ld+json">${JSON.stringify({ "@type": "SocialMediaPosting", mainEntityOfPage: { "@id": `https://www.pinterest.com/pin/${id}/` }, headline: "A Pin", image: imageUrl })}</script>`;
assert.equal(
  extractPinHtml(meta + imageSchema + videoSchema, id).media[0].type,
  "video",
  "JSON-LD video takes priority over its cover image",
);
assert.equal(
  extractPinHtml(meta + imageSchema, id).media[0].url,
  imageUrl,
  "Use the exposed original image from JSON-LD",
);
assert.throws(
  () =>
    extractPinHtml(
      meta + videoSchema.replace(videoUrl, "https://v1.pinimg.com/stream.m3u8"),
      id,
    ),
  /MP4/,
);
assert.throws(
  () => extractPinHtml(meta.replace(id, "999999"), id),
  /this public Pin/,
);

const calls = [];
const mock = async (url, options) => {
  calls.push([String(url), options]);
  if (String(url).startsWith("https://pin.it/"))
    return new Response(null, {
      status: 302,
      headers: { Location: `https://www.pinterest.com/pin/${id}/` },
    });
  if (String(url).includes("/resource/")) return apiResponse(video);
  if (String(url) === videoUrl)
    return new Response(mp4, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(mp4.length),
      },
    });
  throw new Error(`Unexpected fetch ${url}`);
};
const pin = await resolvePinterest("https://pin.it/abc", undefined, mock);
assert.equal(pin.pinId, id);
assert(calls.every(([, options]) => options.redirect === "manual"));
const download = await downloadPinterest(id, pin.media[0].id, undefined, mock);
assert.equal(download.headers.get("content-type"), "video/mp4");
assert.match(download.headers.get("content-disposition"), /\.mp4/);
assert.deepEqual(Buffer.from(await download.arrayBuffer()), mp4);
await assert.rejects(
  () => downloadPinterest(id, "a".repeat(20), undefined, mock),
  /no longer available/,
);
await assert.rejects(
  () => downloadPinterest("not-an-id", "x", undefined, mock),
  /invalid/,
);

let shortCalls = 0;
await assert.rejects(
  () =>
    resolvePinterest("https://pin.it/malicious", undefined, async () => {
      shortCalls++;
      return new Response(null, {
        status: 302,
        headers: { Location: "http://127.0.0.1/private" },
      });
    }),
  /HTTPS/,
);
assert.equal(shortCalls, 1, "Never fetch a disallowed redirect destination");
await assert.rejects(
  () =>
    resolvePinterest("https://pinterest.com/someone/board/", undefined, mock),
  /individual Pin/,
);
let mediaCalls = 0;
await assert.rejects(
  () =>
    fetchPinterest(
      videoUrl,
      "media",
      new AbortController().signal,
      async () => {
        mediaCalls++;
        return new Response(null, {
          status: 302,
          headers: { Location: "https://attacker.test/file.mp4" },
        });
      },
    ),
  /Invalid media/,
);
assert.equal(mediaCalls, 1);
const fallback = await resolvePinterest(
  `https://pinterest.com/pin/${id}/`,
  undefined,
  async (url) =>
    String(url).includes("/resource/")
      ? new Response("not json")
      : new Response(html),
);
assert.equal(fallback.media[0].type, "image");
await assert.rejects(
  () =>
    resolvePinterest(
      `https://pinterest.com/pin/${id}/`,
      undefined,
      async () => new Response("unavailable", { status: 404 }),
    ),
  /could not open/,
);

for (const headers of [
  { "Content-Type": "text/html" },
  { "Content-Type": "image/jpeg" },
  {
    "Content-Type": "video/mp4",
    "Content-Length": String(MAX_DOWNLOAD_BYTES + 1),
  },
])
  await assert.rejects(
    () =>
      downloadPinterest(id, pin.media[0].id, undefined, async (url) =>
        String(url).includes("/resource/")
          ? apiResponse(video)
          : new Response(mp4, { headers }),
      ),
    /could not provide|100 MB/,
  );
let cancelled = false;
const chunked = await downloadPinterest(
  id,
  pin.media[0].id,
  undefined,
  async (url) =>
    String(url).includes("/resource/")
      ? apiResponse(video)
      : new Response(
          new ReadableStream({
            pull(c) {
              c.enqueue(new Uint8Array(1024 * 1024));
            },
            cancel() {
              cancelled = true;
            },
          }),
          { headers: { "Content-Type": "video/mp4" } },
        ),
);
await assert.rejects(() => chunked.arrayBuffer(), /download limit/);
assert(cancelled, "Cancel upstream when a chunked file exceeds the limit");
const abortStream = await downloadPinterest(
  id,
  pin.media[0].id,
  undefined,
  mock,
);
await abortStream.body.cancel();

const signature = "aabbccddeeff00112233445566778899";
const hlsUrl = `https://v1.pinimg.com/videos/iht/hls/aa/bb/cc/${signature}.m3u8`;
const exportUrl = (width) =>
  `https://v1.pinimg.com/videos/iht/expMp4/aa/bb/cc/${signature}_${width}w.mp4`;
const manifest = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio1",URI="${signature}_audio.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=400000,CODECS="avc1.64081E,mp4a.40.29",RESOLUTION=360x640,AUDIO="audio1"
${signature}_360w.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1200000,CODECS="avc1.64081F,mp4a.40.29",RESOLUTION=720x1280,AUDIO="audio1"
${signature}_720w.m3u8`;
assert.deepEqual(
  progressiveCandidates(hlsUrl, manifest).map((item) => item.width),
  [720, 360],
);
assert.equal(videoSignature(exportUrl(720)), signature);
assert.deepEqual(
  progressiveCandidates(hlsUrl, "<html>not a playlist</html>"),
  [],
);
assert.deepEqual(
  progressiveCandidates(
    hlsUrl,
    manifest
      .replaceAll(`${signature}_360w.m3u8`, "https://evil.test/file.mp4")
      .replaceAll(`${signature}_720w.m3u8`, "http://127.0.0.1/file.mp4"),
  ),
  [],
);
const ideaPin = {
  ...image,
  story_pin_data: {
    pages: [
      {
        blocks: [
          {
            video: {
              video_list: {
                V_HLSV3_MOBILE: {
                  url: hlsUrl,
                  thumbnail: imageUrl,
                  width: 1080,
                  height: 1920,
                },
              },
            },
          },
        ],
      },
    ],
  },
};
for (const failure of ["missing", "html", "network"]) {
  const attempted = [];
  const expanded = await resolvePinterest(
    `https://www.pinterest.com/pin/${id}/`,
    undefined,
    async (url) => {
      attempted.push(String(url));
      if (String(url).includes("/resource/")) return apiResponse(ideaPin);
      if (String(url) === hlsUrl) return new Response(manifest);
      if (String(url) === exportUrl(720)) {
        if (failure === "network") throw new Error("temporary CDN failure");
        return failure === "missing"
          ? new Response(null, { status: 404 })
          : new Response("<html>not an MP4</html>", {
              headers: { "Content-Type": "video/mp4" },
            });
      }
      if (String(url) === exportUrl(360))
        return new Response(mp4, { headers: { "Content-Type": "video/mp4" } });
      throw new Error(`Unexpected video request ${url}`);
    },
  );
  assert.equal(expanded.media[0].url, exportUrl(360));
  assert.equal(expanded.media[0].width, 360);
  assert.equal(expanded.media[0].height, 640);
  assert(
    attempted.indexOf(exportUrl(720)) < attempted.indexOf(exportUrl(360)),
    "Try higher quality first, but fall back when unavailable",
  );
}
const aliasHtml = `<meta property="og:url" content="https://www.pinterest.com/pin/999999/"><script type="application/ld+json">${JSON.stringify({ "@type": "VideoObject", "@id": "https://www.pinterest.com/pin/999999/", name: "The same saved video", contentUrl: exportUrl(720) })}</script>`;
assert.throws(() => extractPinHtml(aliasHtml, id), /this public Pin/);
const alias = await resolvePinterest(
  `https://www.pinterest.com/pin/${id}/`,
  undefined,
  async (url) =>
    String(url).includes("/resource/")
      ? apiResponse(ideaPin)
      : String(url) === hlsUrl
        ? new Response(null, { status: 404 })
        : new Response(aliasHtml),
);
assert.equal(
  alias.media[0].url,
  exportUrl(720),
  "A canonical alias must match this Pin’s authoritative video asset",
);
await assert.rejects(
  () =>
    resolvePinterest(
      `https://www.pinterest.com/pin/${id}/`,
      undefined,
      async (url) =>
        String(url).includes("/resource/")
          ? apiResponse(ideaPin)
          : String(url) === hlsUrl
            ? new Response(null, { status: 404 })
            : new Response(meta),
    ),
  /cover image/,
);
for (const shortPage of [
  `<meta http-equiv="refresh" content="0;url=https://www.pinterest.com/pin/${id}/sent/?share=1">`,
  `<link href="https://www.pinterest.com/pin/${id}/sent/" rel="canonical">`,
  `<meta property="og:url" content="https://www.pinterest.com/pin/${id}/sent/">`,
]) {
  const shared = await resolvePinterest(
    "https://pin.it/shared",
    undefined,
    async (url) =>
      String(url).startsWith("https://pin.it/")
        ? new Response(shortPage)
        : apiResponse(video),
  );
  assert.equal(shared.pinId, id);
}
const sent = await resolvePinterest(
  "https://pin.it/sent",
  undefined,
  async (url) =>
    String(url).startsWith("https://pin.it/")
      ? new Response(null, {
          status: 302,
          headers: { Location: `https://www.pinterest.com/pin/${id}/sent/` },
        })
      : apiResponse(video),
);
assert.equal(sent.pinId, id);
const nestedLink = `https://www.pinterest.com/url_shortener/?url=${encodeURIComponent(`https://www.pinterest.com/pin/${id}/sent/`)}`;
const nestedPin = await resolvePinterest(
  "https://pin.it/nested",
  undefined,
  async (url) =>
    String(url).startsWith("https://pin.it/")
      ? new Response(null, { status: 302, headers: { Location: nestedLink } })
      : apiResponse(video),
);
assert.equal(nestedPin.pinId, id);
await assert.rejects(
  () =>
    resolvePinterest(
      "https://pin.it/limited",
      undefined,
      async () => new Response(null, { status: 429 }),
    ),
  /temporarily limited/,
);
console.log(
  "PASS Pinterest URL validation, /sent/ and HTML share links, progressive Idea Pin MP4 exports, quality fallback, canonical video aliases, images, streaming and size limits",
);

if (process.argv.includes("--live")) {
  for (const pinId of [
    id,
    "1084663891475263837",
    "1030057746038643324",
    "656399714489214222",
  ]) {
    const result = await resolvePinterest(
      `https://www.pinterest.com/pin/${pinId}/`,
    );
    assert(result.media.some((m) => m.type === "video"));
    const response = await downloadPinterest(pinId, result.media[0].id);
    const reader = response.body.getReader();
    const first = await reader.read();
    assert(first.value?.length > 12);
    assert.match(
      Buffer.from(first.value).subarray(0, 100).toString("latin1"),
      /ftyp/,
    );
    await reader.cancel();
    console.log(
      `PASS live Pinterest Pin ${pinId}: ${result.media.length} media item(s), MP4 bytes verified`,
    );
  }
}
