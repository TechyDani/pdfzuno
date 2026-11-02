import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { startBuiltSite } from "./built-site.mjs";

const id = "664281013778109217";
const imageId = "a".repeat(20);
const videoId = "b".repeat(20);
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=",
  "base64",
);
const mp4 = Buffer.concat([
  Buffer.from([0, 0, 0, 24]),
  Buffer.from("ftypisom"),
  Buffer.alloc(32),
]);
const fixture = {
  pinId: id,
  title: "A multi-page Pinterest Pin",
  sourceUrl: `https://www.pinterest.com/pin/${id}/`,
  media: [
    {
      id: imageId,
      type: "image",
      width: 1080,
      height: 1920,
      previewUrl: "https://i.pinimg.com/test.jpg",
      downloadUrl: `/api/pinterest/download/?pin=${id}&media=${imageId}`,
    },
    {
      id: videoId,
      type: "video",
      width: 1080,
      height: 1920,
      previewUrl: "https://i.pinimg.com/test.jpg",
      downloadUrl: `/api/pinterest/download/?pin=${id}&media=${videoId}`,
    },
  ],
};

await mkdir(".test-output", { recursive: true });
const site = await startBuiltSite();
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.goto(site.url);
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect(page.locator(".tool-card")).toHaveCount(2);
  await page
    .getByRole("link", { name: "Pinterest downloader", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Pinterest downloader",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await page.reload();
  const input = page.getByLabel("Pinterest Pin URL", { exact: true });
  await expect(input).toHaveValue("");
  await page.screenshot({
    path: ".test-output/pinterest-desktop.png",
    fullPage: true,
  });

  // Exercise the real handlers' rejected inputs without contacting Pinterest.
  for (const data of [
    { url: "https://127.0.0.1/private" },
    { url: "https://pinterest.com.evil.test/pin/12345/" },
    { url: "https://pinterest.com/person/board/" },
    {},
  ]) {
    const response = await context.request.post(
      `${site.url}/api/pinterest/resolve/`,
      { data },
    );
    assert.equal(response.status(), 400);
  }
  assert.equal(
    (
      await context.request.post(`${site.url}/api/pinterest/resolve/`, {
        data: "not json",
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
    400,
  );
  assert.equal(
    (
      await context.request.post(`${site.url}/api/pinterest/resolve/`, {
        data: "x".repeat(5000),
      })
    ).status(),
    413,
  );
  assert.equal(
    (
      await context.request.get(
        `${site.url}/api/pinterest/download/?pin=invalid&media=invalid`,
      )
    ).status(),
    400,
  );
  await input.fill("https://example.com/not-pinterest");
  await page.getByRole("button", { name: "Find downloads" }).click();
  await expect(
    page.locator("#tool-workspace").getByRole("alert"),
  ).toContainText("Pinterest or pin.it");

  const portrait = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 360;
      canvas.height = 640;
      const context = canvas.getContext("2d");
      context.fillStyle = "#e5f6f3";
      context.fillRect(0, 0, 360, 640);
      context.fillStyle = "#146c70";
      context.fillRect(60, 100, 240, 440);
      return canvas.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await page.route("https://*.pinimg.com/**", (route) =>
    route.fulfill({ contentType: "image/png", body: portrait }),
  );
  await page.route("**/api/pinterest/resolve/", (route) =>
    route.fulfill({ json: fixture }),
  );
  let failDownload = false;
  await page.route("**/api/pinterest/download/**", (route) => {
    if (failDownload)
      return route.fulfill({
        status: 502,
        json: {
          error:
            "Pinterest could not provide the media file. Find the Pin again.",
        },
      });
    const video =
      new URL(route.request().url()).searchParams.get("media") === videoId;
    return route.fulfill({
      headers: {
        "Content-Type": video ? "video/mp4" : "image/png",
        "Content-Disposition": `attachment; filename="pinterest-test.${video ? "mp4" : "png"}"`,
      },
      body: video ? mp4 : png,
    });
  });
  await input.fill(`https://pinterest.com/pin/${id}/`);
  await page.getByRole("button", { name: "Find downloads" }).click();
  await expect(page.locator(".pinterest-media")).toHaveCount(2);
  await expect(page.getByRole("status")).toContainText("2 files are ready");
  async function assertPreviewFits() {
    const preview = page.locator(".pinterest-preview").first();
    const image = preview.locator("img");
    await expect
      .poll(() =>
        image.evaluate(
          (element) => element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
    const box = await preview.boundingBox();
    const imageBox = await image.boundingBox();
    const info = await page
      .locator(".pinterest-media-info")
      .first()
      .boundingBox();
    assert(
      imageBox.y + imageBox.height <= box.y + box.height + 1,
      "Portrait preview stays inside its container",
    );
    assert(
      info.y >= box.y + box.height - 1,
      "Download controls stay below the preview",
    );
  }
  await assertPreviewFits();
  for (const type of ["image", "video"]) {
    const saved = page.waitForEvent("download");
    await page
      .getByRole("button", { name: `Download ${type}`, exact: true })
      .click();
    const download = await saved;
    assert.equal(
      download.suggestedFilename(),
      `pinterest-test.${type === "video" ? "mp4" : "png"}`,
    );
    assert.deepEqual(
      await readFile(await download.path()),
      type === "video" ? mp4 : png,
    );
    await expect(page.getByRole("status")).toContainText("Download ready");
  }
  failDownload = true;
  await page
    .getByRole("button", { name: "Download video", exact: true })
    .click();
  await expect(
    page.locator("#tool-workspace").getByRole("alert"),
  ).toContainText("could not provide");
  await expect(
    page.getByRole("button", { name: "Download video", exact: true }),
  ).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  await assertPreviewFits();
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.screenshot({
    path: ".test-output/pinterest-mobile-results.png",
    fullPage: true,
  });

  // Changing the URL clears a previous Pin; cancelling restores the form.
  await input.fill("https://pin.it/another");
  await expect(page.locator(".pinterest-results")).toHaveCount(0);
  await page.unroute("**/api/pinterest/resolve/");
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/api/pinterest/resolve/", async (route) => {
    await held;
    await route.fulfill({ json: fixture }).catch(() => {});
  });
  await page.getByRole("button", { name: "Find downloads" }).click();
  await expect(
    page.getByRole("button", { name: "Finding media…" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  release();
  await expect(
    page.getByRole("button", { name: "Find downloads" }),
  ).toBeEnabled();
  await expect(page.getByRole("status")).toContainText("cancelled");
  await page.unroute("**/api/pinterest/resolve/");
  await page.route("**/api/pinterest/resolve/", (route) =>
    route.fulfill({
      status: 422,
      json: {
        error:
          "No downloadable media was found. The Pin may be private or deleted.",
      },
    }),
  );
  await page.getByRole("button", { name: "Find downloads" }).click();
  await expect(
    page.locator("#tool-workspace").getByRole("alert"),
  ).toContainText("private or deleted");
  console.log(
    "PASS Pinterest catalog, direct route, real API validation, image/video saves, errors, stale results, cancellation and mobile layout",
  );

  if (process.argv.includes("--live")) {
    await page.unroute("**/api/pinterest/resolve/");
    await page.unroute("**/api/pinterest/download/**");
    await page.unroute("https://*.pinimg.com/**");
    for (const liveId of ["1030057746038643324", "656399714489214222"]) {
      await input.fill(`https://www.pinterest.com/pin/${liveId}/sent/?share=1`);
      await page.getByRole("button", { name: "Find downloads" }).click();
      const button = page
        .getByRole("button", { name: "Download video", exact: true })
        .first();
      await expect(button).toBeVisible({ timeout: 30000 });
      const saved = page.waitForEvent("download", { timeout: 65000 });
      await button.click();
      const download = await saved;
      const bytes = await readFile(await download.path());
      assert(bytes.length > 100000);
      assert.match(bytes.subarray(0, 100).toString("latin1"), /ftyp/);
      assert(download.suggestedFilename().endsWith(".mp4"));
      assert(bytes.includes(Buffer.from("vide")), "MP4 contains a video track");
      assert(
        bytes.includes(Buffer.from("soun")),
        "MP4 retains its audio track",
      );
      const playback = await page.evaluate(async (base64) => {
        const bytes = Uint8Array.from(atob(base64), (character) =>
          character.charCodeAt(0),
        );
        const url = URL.createObjectURL(
          new Blob([bytes], { type: "video/mp4" }),
        );
        const video = document.createElement("video");
        video.muted = true;
        video.preload = "auto";
        try {
          await new Promise((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error("MP4 did not decode")),
              10000,
            );
            video.onloadeddata = () => {
              clearTimeout(timer);
              resolve();
            };
            video.onerror = () => {
              clearTimeout(timer);
              reject(new Error(video.error?.message || "MP4 playback failed"));
            };
            video.src = url;
            video.load();
          });
          return {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          };
        } finally {
          video.removeAttribute("src");
          video.load();
          URL.revokeObjectURL(url);
        }
      }, bytes.toString("base64"));
      assert(
        playback.width > 0 && playback.height > 0 && playback.duration > 10,
        "Downloaded MP4 decodes as a complete video",
      );
      await page.screenshot({
        path: `.test-output/pinterest-live-${liveId}.png`,
        fullPage: true,
      });
      console.log(
        `PASS reported Pin ${liveId}: ${bytes.length} MP4 bytes, ${playback.duration.toFixed(1)} seconds, video and audio verified`,
      );
    }
  }
  assert.deepEqual(errors, [], "No browser exceptions");
} finally {
  await browser?.close();
  await site.close();
}
