import { spawn } from "node:child_process";
import path from "node:path";
import { loadLocalEnv } from "./local-env.mjs";

await loadLocalEnv();
const args = process.argv.slice(2);
const portIndex = args.findIndex((arg) => arg === "--port" || arg === "-p");
const port = Number(
  (portIndex >= 0
    ? args[portIndex + 1]
    : args.find((arg) => arg.startsWith("--port="))?.split("=")[1]) ||
    process.env.PORT ||
    3000,
);
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill("SIGTERM");
  const timeout = setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
  }, 5000);
  timeout.unref();
}
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => stop());
function run(file, options = [], env = process.env) {
  const child = spawn(
    process.execPath,
    ["--experimental-strip-types", file, ...options],
    { stdio: "inherit", env },
  );
  children.add(child);
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    children.delete(child);
    if (!stopping) stop(code || 0);
  });
  return child;
}

try {
  const url = process.env.YOUTUBE_SERVICE_URL
    ? new URL(process.env.YOUTUBE_SERVICE_URL)
    : null;
  if (
    url?.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    if ((process.env.YOUTUBE_SERVICE_TOKEN || "").length < 32)
      throw new Error(
        "Run npm run youtube:setup to configure the local downloader token.",
      );
    let running = false;
    try {
      const response = await fetch(new URL("/health", url), {
        signal: AbortSignal.timeout(1000),
      });
      running =
        response.ok && (await response.json()).service === "zivratools-youtube";
    } catch {
      /* No local service yet. */
    }
    if (!running) {
      const origins = new Set([
        ...(process.env.YOUTUBE_ALLOWED_ORIGINS || "")
          .split(",")
          .filter(Boolean),
        `http://localhost:${port}`,
        `http://127.0.0.1:${port}`,
      ]);
      run("scripts/youtube-service.mjs", [], {
        ...process.env,
        PORT: url.port || "80",
        YOUTUBE_SERVICE_HOST: "127.0.0.1",
        YOUTUBE_ALLOWED_ORIGINS: [...origins].join(","),
      });
      for (let attempt = 0; attempt < 50 && !stopping; attempt++) {
        try {
          const response = await fetch(new URL("/health", url), {
            signal: AbortSignal.timeout(1000),
          });
          if (
            response.ok &&
            (await response.json()).service === "zivratools-youtube"
          ) {
            running = true;
            break;
          }
        } catch {
          /* Wait for the service's listener. */
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!running)
        throw new Error(
          "The local YouTube service did not start. Check the error above and ensure its port is available.",
        );
    }
    console.log(`YouTube downloader ready at ${url.origin}`);
  } else if (!url)
    console.log(
      "YouTube downloads need local setup: npm run youtube:setup (PDF/image tools can still be used).",
    );
  if (!stopping)
    run(path.resolve("node_modules/next/dist/bin/next"), [
      "dev",
      "--webpack",
      "--hostname",
      "0.0.0.0",
      ...(portIndex < 0 && !args.some((arg) => arg.startsWith("--port="))
        ? ["--port", String(port)]
        : []),
      ...args,
    ]);
} catch (error) {
  console.error(error.message);
  stop(1);
}
