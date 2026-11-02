// Regression for local 503s: .env.local alone must configure both services,
// and the normal development runner must own their complete lifecycle.
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  copyFile,
  cp,
  writeFile,
  symlink,
  rm,
} from "node:fs/promises";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  makeYouTubeFixture,
  videoId,
  secret,
  mp4,
} from "./youtube-fixture.mjs";

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
const project = await mkdtemp(path.join(tmpdir(), "zivratools-dev-test-"));
const fixture = await makeYouTubeFixture();
let child;
let output = "";
const close = async () => {
  if (!child || child.exitCode !== null) return;
  const ended = once(child, "exit");
  child.kill("SIGTERM");
  const timer = setTimeout(() => child.kill("SIGKILL"), 10000);
  await ended;
  clearTimeout(timer);
};
try {
  const port = await freePort();
  const servicePort = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const service = `http://127.0.0.1:${servicePort}`;
  await mkdir(path.join(project, "scripts"));
  await mkdir(path.join(project, "app/api/youtube/resolve"), {
    recursive: true,
  });
  for (const file of ["dev.mjs", "local-env.mjs", "youtube-service.mjs"])
    await copyFile(`scripts/${file}`, path.join(project, "scripts", file));
  await cp("lib/youtube", path.join(project, "lib/youtube"), {
    recursive: true,
  });
  for (const file of ["package.json", "tsconfig.json"])
    await copyFile(file, path.join(project, file));
  await copyFile(
    "app/api/youtube/resolve/route.ts",
    path.join(project, "app/api/youtube/resolve/route.ts"),
  );
  await symlink(
    path.resolve("node_modules"),
    path.join(project, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await writeFile(
    path.join(project, "app/layout.jsx"),
    "export default function Layout({children}) { return <html><body>{children}</body></html>; }",
  );
  await writeFile(
    path.join(project, "app/page.jsx"),
    "export default function Page() { return <h1>Development test</h1>; }",
  );
  await writeFile(
    path.join(project, ".env.local"),
    `YOUTUBE_SERVICE_URL=${JSON.stringify(service)}\nYOUTUBE_SERVICE_TOKEN=${JSON.stringify(secret)}\nYT_DLP_PATH=${JSON.stringify(fixture.executable)}\n`,
    { mode: 0o600 },
  );
  const env = {
    ...process.env,
    PORT: String(port),
    NODE_ENV: "development",
    NEXT_TELEMETRY_DISABLED: "1",
  };
  for (const key of [
    "YOUTUBE_SERVICE_URL",
    "YOUTUBE_SERVICE_TOKEN",
    "YOUTUBE_ALLOWED_ORIGINS",
    "YT_DLP_PATH",
    "YT_FIXTURE_MODE",
  ])
    delete env[key];
  child = spawn(process.execPath, ["scripts/dev.mjs"], {
    cwd: project,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => (output += chunk));
  child.stderr.on("data", (chunk) => (output += chunk));
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null)
      throw new Error(`Development startup failed: ${output}`);
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(ready, `The dev server started: ${output}`);
  const response = await fetch(`${origin}/api/youtube/resolve/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: `https://youtube.com/shorts/${videoId}` }),
    signal: AbortSignal.timeout(30000),
  });
  const info = await response.json();
  assert.equal(response.status, 200, JSON.stringify(info));
  assert.equal(info.videoId, videoId);
  assert.equal(new URL(info.downloads[0].url).origin, service);
  const file = await fetch(info.downloads[0].url, {
    headers: { Origin: origin },
  });
  assert.equal(file.status, 200);
  assert.equal(
    file.headers.get("access-control-allow-origin"),
    origin,
    "The dev port is included in CORS",
  );
  assert.deepEqual(Buffer.from(await file.arrayBuffer()), mp4);
  assert(
    !output.includes(secret),
    "The development runner never logs the token",
  );
  await close();
  await assert.rejects(
    () => fetch(`${service}/health`, { signal: AbortSignal.timeout(1000) }),
    "Stopping development stops its downloader too",
  );
  console.log(
    "PASS local .env.local loading, automatic downloader startup, Next dev API resolution, MP4 transfer, custom-port CORS, token privacy and shutdown",
  );
} finally {
  await close();
  await fixture.close();
  await rm(project, { recursive: true, force: true });
}
