import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import path from "node:path";

// Match Next's development precedence without printing environment values.
export async function loadLocalEnv(root = process.cwd()) {
  for (const name of [
    ".env.development.local",
    ".env.local",
    ".env.development",
    ".env",
  ]) {
    let content;
    try {
      content = await readFile(path.join(root, name), "utf8");
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    for (const [key, value] of Object.entries(parseEnv(content))) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}
