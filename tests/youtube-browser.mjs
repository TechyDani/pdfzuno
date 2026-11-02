import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";
import { startBuiltSite } from "./built-site.mjs";
import {
  makeYouTubeFixture,
  startYouTubeFixtureService,
  videoId,
  mp4,
  secret,
} from "./youtube-fixture.mjs";

const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const fixture = await makeYouTubeFixture();
let service, site, browser;
await mkdir(".test-output", { recursive: true });
try {
  service = await startYouTubeFixtureService(
    fixture,
    `http://127.0.0.1:${port}`,
  );
  site = await startBuiltSite({
    port,
    env: { YOUTUBE_SERVICE_URL: service.url, YOUTUBE_SERVICE_TOKEN: secret },
  });
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.route("https://i.ytimg.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto(site.url);
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect(page.locator(".tool-card")).toHaveCount(2);
  await page
    .getByRole("link", { name: "YouTube downloader", exact: true })
    .click();
  await expect(page).toHaveURL(`${site.url}/tools/youtube-downloader/`);
  await expect(page.locator("#youtube-url")).toBeVisible();
  await page.reload();
  const input = page.getByLabel("YouTube video or Shorts URL", { exact: true });
  await expect(input).toBeVisible();
  await input.fill("https://example.com/video");
  await page
    .getByRole("button", { name: "Find downloads", exact: true })
    .click();
  await expect(page.locator("#tool-workspace [role=alert]")).toContainText(
    "valid YouTube",
  );
  for (const data of [
    {},
    { url: "https://127.0.0.1/private" },
    { url: "https://youtube.com.evil.test/watch?v=BaW_jenozKc" },
    { url: "https://youtube.com/playlist?list=123" },
  ]) {
    const response = await context.request.post(
      `${site.url}/api/youtube/resolve/`,
      { data },
    );
    assert.equal(response.status(), 400);
  }
  assert.equal(
    (
      await context.request.post(`${site.url}/api/youtube/resolve/`, {
        data: "x".repeat(5000),
      })
    ).status(),
    413,
  );
  for (const link of [
    `https://www.youtube.com/watch?v=${videoId}`,
    `https://youtube.com/shorts/${videoId}`,
  ]) {
    await input.fill(link);
    await page
      .getByRole("button", { name: "Find downloads", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "A sample YouTube Short" }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Download quality", exact: true }),
    ).toHaveValue("720");
    await page
      .getByRole("combobox", { name: "Download quality", exact: true })
      .selectOption("1080");
    const received = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Download MP4", exact: true })
      .click();
    const file = await received;
    assert.equal(
      file.suggestedFilename(),
      `zivratools-youtube-${videoId}-1080p.mp4`,
    );
    assert.deepEqual(await readFile(await file.path()), mp4);
    await expect(page.locator("#tool-workspace [role=status]")).toContainText(
      "Download ready",
    );
  }
  await page.screenshot({
    path: ".test-output/youtube-desktop.png",
    fullPage: true,
  });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `No overflow at ${width}px`,
    );
    await expect(
      page.getByRole("button", { name: "Download MP4", exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `.test-output/youtube-${width}.png`,
      fullPage: true,
    });
  }
  // An expired service link is a visible error and never saves a file.
  await page.route(`${service.url}/download**`, (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": site.url },
      body: JSON.stringify({
        error: "This download link has expired. Find the video again.",
      }),
    }),
  );
  await page.getByRole("button", { name: "Download MP4", exact: true }).click();
  await expect(page.locator("#tool-workspace [role=alert]")).toContainText(
    "expired",
  );
  await page.unroute(`${service.url}/download**`);
  await page.route("**/api/youtube/resolve/", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.abort().catch(() => {});
  });
  await input.fill(`https://youtu.be/${videoId}`);
  await page
    .getByRole("button", { name: "Find downloads", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.locator("#tool-workspace [role=status]")).toContainText(
    "cancelled",
  );
  await expect(
    page.getByRole("button", { name: "Find downloads", exact: true }),
  ).toBeEnabled();
  await page.unroute("**/api/youtube/resolve/");
  assert.deepEqual(errors, []);
  console.log(
    "PASS YouTube catalog, page refresh, real Vercel-route/service integration, videos and Shorts, quality selection, MP4 bytes, expired links, cancellation and 320–768px layouts (offline video fixture)",
  );
} finally {
  await browser?.close();
  await site?.close();
  await service?.close();
  await fixture.close();
}
