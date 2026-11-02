import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";

export function readBuiltPage(route) {
  const normalized = route.replace(/^\/+|\/+$/g, "");
  return readFile(`.next/server/app/${normalized || "index"}.html`, "utf8");
}

export async function startBuiltSite({
  port: requestedPort = 0,
  env = {},
} = {}) {
  const probe = createServer();
  await new Promise((resolve) =>
    probe.listen(requestedPort, "127.0.0.1", resolve),
  );
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const child = spawn(
    process.execPath,
    [
      path.resolve("node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } },
  );
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk;
  });
  child.stderr.on("data", (chunk) => {
    output += chunk;
  });
  const url = `http://127.0.0.1:${port}`;
  const close = async () => {
    if (child.exitCode !== null) return;
    const ended = once(child, "exit");
    child.kill("SIGTERM");
    const timer = setTimeout(() => child.kill("SIGKILL"), 5000);
    await ended;
    clearTimeout(timer);
  };
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(output);
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(1000),
        });
        await response.body?.cancel();
        if (response.ok) return { url, close };
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Next.js did not start. ${output}`);
  } catch (error) {
    await close();
    throw error;
  }
}
