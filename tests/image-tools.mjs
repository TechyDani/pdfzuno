// Runs against the real production export, including its browser workers.
// Requires Google Chrome. The background test downloads the model and a
// public-domain NASA astronaut photo from scikit-image's sample dataset.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { tools } from "../lib/pdf/tools.ts";

const root = path.resolve("out");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const filename = path.resolve(
      root,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    assert(filename.startsWith(root + path.sep));
    const bytes = await readFile(filename);
    res.writeHead(200, {
      "Content-Type":
        mime[path.extname(filename)] || "application/octet-stream",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
async function verifySite() {
  let browser;
  try {
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const context = await browser.newContext({
      acceptDownloads: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.url().startsWith(url) && response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(url);
    await expect(page.locator(".tool-card")).toHaveCount(tools.length);
    await expect(
      page.getByRole("button", { name: "Remove background", exact: true }),
    ).toContainText("Popular");

    const featured = tools.filter((tool) => tool.popular);
    const hero = page.getByRole("region", { name: "Popular tools" });
    await expect(hero.locator(".hero-slide")).toHaveCount(featured.length);
    if (process.argv.includes("--autoplay-only")) {
      await page.clock.install();
      const current = () =>
        hero
          .locator('.hero-dot[aria-current="true"]')
          .getAttribute("aria-label");
      const show = async (index) =>
        expect.poll(current).toBe(`Show ${featured[index].name}`);
      await show(0);
      await page.clock.fastForward(5100);
      await show(1);
      await hero.hover();
      await page.clock.fastForward(11000);
      await show(1);
      await page.mouse.move(1, 1);
      await page.clock.fastForward(5100);
      await show(2);
      await hero.focus();
      await page.clock.fastForward(11000);
      await show(2);
      await hero.getByRole("button", { name: "Pause auto-slide" }).click();
      await page.mouse.move(1, 1);
      await page.getByRole("textbox", { name: "Search tools" }).focus();
      await page.clock.fastForward(11000);
      await show(2);
      await hero.getByRole("button", { name: "Enable auto-slide" }).click();
      await page.mouse.move(1, 1);
      await page.clock.fastForward(5100);
      await show(3);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.clock.fastForward(11000);
      await show(3);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await hero
        .getByRole("button", {
          name: `Show ${featured.at(-1).name}`,
          exact: true,
        })
        .click();
      await page.mouse.move(1, 1);
      await page.getByRole("textbox", { name: "Search tools" }).focus();
      await page.clock.fastForward(5100);
      await show(0);
      await hero
        .getByRole("button", { name: `Use ${featured[0].name}`, exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.mouse.move(1, 1);
      await page.clock.fastForward(11000);
      await show(0);
      await page.keyboard.press("Escape");
      await page.getByRole("textbox", { name: "Search tools" }).focus();
      await page.clock.fastForward(5100);
      await show(1);
      assert.deepEqual(
        errors,
        [],
        "No browser exceptions or failed app assets",
      );
      console.log(
        "PASS 5-second auto-slide, looping, hover/focus pauses, pause/play, reduced motion and dialog pause/resume",
      );
      return;
    }
    for (const tool of featured) {
      await hero
        .getByRole("button", { name: `Show ${tool.name}`, exact: true })
        .click();
      await expect(
        hero.getByRole("button", { name: `Show ${tool.name}`, exact: true }),
      ).toHaveAttribute("aria-current", "true");
      await hero
        .getByRole("button", { name: `Use ${tool.name}`, exact: true })
        .click();
      await expect(
        page
          .getByRole("dialog")
          .getByRole("heading", { name: tool.name, exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await hero.getByRole("button", { name: "Next popular tool" }).click();
    await expect(
      hero.getByRole("button", {
        name: `Show ${featured[0].name}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "true");
    await hero.getByRole("button", { name: "Previous popular tool" }).click();
    await expect(
      hero.getByRole("button", {
        name: `Show ${featured.at(-1).name}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "true");
    await hero.focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      hero.getByRole("button", {
        name: `Show ${featured[0].name}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await hero.getByRole("button", { name: "Next popular tool" }).click();
    await expect(
      hero.getByRole("button", {
        name: `Show ${featured[1].name}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "true");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await hero
      .getByRole("button", { name: `Show ${featured[0].name}`, exact: true })
      .click();
    await mkdir(".test-output", { recursive: true });
    await page.screenshot({ path: ".test-output/hero-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await hero.scrollIntoViewIfNeeded();
    const bounds = await hero.locator(".hero-viewport").boundingBox();
    const touch = await context.newCDPSession(page);
    const touchY = Math.min(bounds.y + bounds.height / 2, 700);
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: bounds.x + bounds.width * 0.85, y: touchY }],
    });
    for (let step = 1; step <= 8; step++) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: bounds.x + bounds.width * (0.85 - step * 0.09), y: touchY },
        ],
      });
    }
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(
      hero.getByRole("button", {
        name: `Show ${featured[1].name}`,
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "true");
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: ".test-output/hero-mobile.png",
      fullPage: true,
    });
    await touch.detach();
    await page.setViewportSize({ width: 1280, height: 720 });
    await hero
      .getByRole("button", { name: `Show ${featured[0].name}`, exact: true })
      .click();
    console.log(
      "PASS all popular hero slides, tool buttons, looping arrows, dots, keyboard, reduced motion and mobile touch swipe",
    );

    // Every card opens a working dialog, and selecting another tool resets it.
    for (const tool of tools) {
      await page.getByRole("button", { name: tool.name, exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: tool.name, exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
    console.log(`PASS all ${tools.length} cards open and close`);

    const fixtures = await page.evaluate(async () => {
      async function image(width, height, type) {
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ef3030";
        ctx.fillRect(width / 4, height / 4, width / 2, height / 2);
        const blob = await canvas.convertToBlob({ type, quality: 0.95 });
        return Array.from(new Uint8Array(await blob.arrayBuffer()));
      }
      return {
        jpg: await image(160, 120, "image/jpeg"),
        png: await image(80, 100, "image/png"),
        webp: await image(160, 120, "image/webp"),
      };
    });
    const dialog = page.getByRole("dialog");
    async function open(name) {
      await page.getByRole("button", { name, exact: true }).click();
      await expect(dialog).toBeVisible();
    }
    async function download(name, timeout = 30000) {
      await expect(dialog.getByRole("link", { name })).toBeVisible({ timeout });
      const waiting = page.waitForEvent("download");
      await dialog.getByRole("link", { name }).click();
      const file = await waiting;
      assert.equal(await file.failure(), null);
      return {
        bytes: await readFile(await file.path()),
        name: file.suggestedFilename(),
      };
    }
    await open("JPG to PDF");
    await page.getByLabel("Choose files").setInputFiles([
      {
        name: "first.jpg",
        mimeType: "application/octet-stream",
        buffer: Buffer.from(fixtures.jpg),
      },
      {
        name: "second.png",
        mimeType: "application/octet-stream",
        buffer: Buffer.from(fixtures.png),
      },
    ]);
    await page.getByRole("button", { name: "Move second.png up" }).click();
    await dialog
      .getByRole("button", { name: "JPG to PDF", exact: true })
      .click();
    const pdf = await PDFDocument.load((await download("Download PDF")).bytes);
    assert.equal(pdf.getPageCount(), 2);
    assert.deepEqual(pdf.getPage(0).getSize(), { width: 80, height: 100 });
    assert.deepEqual(pdf.getPage(1).getSize(), { width: 160, height: 120 });
    await page.keyboard.press("Escape");
    console.log(
      "PASS JPG/PNG to PDF with missing MIME types and reordered pages",
    );

    await open("WebP to JPG");
    await expect(
      dialog.getByText("Is your PDF password-protected?"),
    ).toHaveCount(0);
    await page.getByLabel("Choose files").setInputFiles({
      name: "transparent.webp",
      mimeType: "image/webp",
      buffer: Buffer.from(fixtures.webp),
    });
    await dialog
      .getByRole("button", { name: "WebP to JPG", exact: true })
      .click();
    const jpg = await download("Download JPG");
    assert.equal(jpg.name, "transparent.jpg");
    assert.equal(jpg.bytes.subarray(0, 3).toString("hex"), "ffd8ff");
    const pixels = await page.evaluate(async () => {
      const img = document.querySelector('img[alt="Converted JPG image"]');
      await img.decode();
      const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return {
        width: canvas.width,
        height: canvas.height,
        corner: Array.from(ctx.getImageData(0, 0, 1, 1).data),
        center: Array.from(ctx.getImageData(80, 60, 1, 1).data),
      };
    });
    assert.equal(pixels.width, 160);
    assert.equal(pixels.height, 120);
    assert(pixels.corner.slice(0, 3).every((value) => value > 245));
    assert(pixels.center[0] > 200 && pixels.center[1] < 90);
    await page.keyboard.press("Escape");
    console.log(
      "PASS WebP to JPG, dimensions, real image content and white transparency",
    );

    await open("WebP to JPG");
    await page.getByLabel("Choose files").setInputFiles({
      name: "fake.webp",
      mimeType: "image/webp",
      buffer: Buffer.from("not an image"),
    });
    await dialog
      .getByRole("button", { name: "WebP to JPG", exact: true })
      .click();
    await expect(dialog.getByRole("alert")).toContainText("valid WebP");
    await expect(
      dialog.getByRole("link", { name: "Download JPG" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    console.log("PASS invalid image rejection and state reset");

    const photo = await fetch(
      "https://raw.githubusercontent.com/scikit-image/scikit-image/v0.18.3/skimage/data/astronaut.png",
    );
    assert(photo.ok, "Astronaut test fixture is available");
    const photoBytes = Buffer.from(await photo.arrayBuffer());
    await open("Remove background");
    await expect(
      dialog.getByText("Is your PDF password-protected?"),
    ).toHaveCount(0);
    await page.getByLabel("Choose files").setInputFiles({
      name: "astronaut.png",
      mimeType: "image/png",
      buffer: photoBytes,
    });
    await dialog
      .getByRole("button", { name: "Remove background", exact: true })
      .click();
    await expect(
      dialog.getByRole("button", { name: "Cancel processing" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel processing" }).click();
    await expect(
      dialog.getByRole("button", { name: "Remove background", exact: true }),
    ).toBeEnabled();
    await expect(
      dialog.getByRole("link", { name: "Download PNG" }),
    ).toHaveCount(0);
    console.log("PASS background removal cancellation");

    await dialog
      .getByRole("button", { name: "Remove background", exact: true })
      .click();
    // Observe genuine model loading and inference, without replacing the AI.
    const logger = setInterval(async () => {
      console.log(
        "Background:",
        await dialog
          .locator('[role="status"]')
          .innerText()
          .catch(() => "processing"),
      );
    }, 20000);
    let png;
    try {
      await expect(
        dialog
          .getByRole("link", { name: "Download PNG" })
          .or(dialog.getByRole("alert")),
      ).toBeVisible({ timeout: 240000 });
      assert.equal(
        await dialog.getByRole("alert").count(),
        0,
        (await dialog.getByRole("alert").allTextContents()).join(" "),
      );
      png = await download("Download PNG");
    } finally {
      clearInterval(logger);
    }
    assert.equal(png.name, "astronaut-no-background.png");
    assert.equal(png.bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    const alpha = await page.evaluate(async () => {
      const img = document.querySelector(
        'img[alt="Subject with background removed"]',
      );
      await img.decode();
      const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0,
        opaque = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 20) transparent++;
        if (pixels[i] > 235) opaque++;
      }
      return {
        width: canvas.width,
        height: canvas.height,
        transparent,
        opaque,
      };
    });
    assert.equal(alpha.width, 512);
    assert.equal(alpha.height, 512);
    assert(alpha.transparent > 20000, "Background is transparent");
    assert(alpha.opaque > 20000, "Subject is retained");
    await mkdir(".test-output", { recursive: true });
    await page.screenshot({
      path: ".test-output/background-removal.png",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    console.log("PASS real AI background removal and transparent PNG", alpha);

    await page.getByRole("button", { name: "Convert", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "WebP to JPG", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Remove background", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "All tools", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Search tools" })
      .fill("background");
    await expect(page.locator(".tool-card")).toHaveCount(1);
    await page.getByRole("button", { name: "Clear search" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator(".tool-card")).toHaveCount(tools.length);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: ".test-output/tools-mobile.png",
      fullPage: true,
    });
    assert.deepEqual(errors, [], "No browser exceptions or failed app assets");
    console.log("PASS filters, search, mobile layout and no browser errors");
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
await verifySite();
