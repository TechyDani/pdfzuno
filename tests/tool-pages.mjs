// Checks the actual exported HTML, so guide text must exist before hydration.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tools } from "../lib/pdf/tools.ts";
import { guides } from "../lib/pdf/guides.ts";

assert.equal(tools.length, 26);
assert.equal(new Set(tools.map((tool) => tool.slug)).size, tools.length);
assert.deepEqual(
  Object.keys(guides).sort(),
  tools.map((tool) => tool.id).sort(),
);

const home = await readFile("out/index.html", "utf8");
const titles = new Set();
const descriptions = new Set();
for (const tool of tools) {
  const html = await readFile(`out/${tool.slug}/index.html`, "utf8");
  assert.match(
    home,
    new RegExp(`href="/${tool.slug}/?"`),
    `Home links to ${tool.slug}`,
  );
  assert.equal(
    (html.match(/<h1\b/g) || []).length,
    1,
    "One primary page heading",
  );
  assert(html.includes(`>${tool.name}</h1>`));
  assert(
    html.includes('id="tool-workspace"'),
    "The input workspace is rendered on the page",
  );
  assert(
    html.includes('type="file"'),
    "The file input is present before hydration",
  );
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/)?.[1];
  assert(article, `${tool.slug} has a server-rendered guide`);
  const paragraphs = [...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => match[1])
    .join(" ");
  const text = paragraphs.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, "'");
  const words = text.trim().split(/\s+/u).length;
  assert(
    words >= 500,
    `${tool.slug} has ${words} words; at least 500 required`,
  );
  for (const id of ["how-to", "use-cases", "faq"])
    assert(article.includes(`id="${id}"`), `${tool.slug} has ${id}`);
  for (const section of [
    ...guides[tool.id].steps,
    ...guides[tool.id].useCases,
    ...guides[tool.id].faqs,
  ])
    assert(
      article.includes(
        section.title.replaceAll("&", "&amp;").replaceAll("'", "&#x27;"),
      ),
      `${tool.slug} includes ${section.title}`,
    );
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const description = html.match(
    /<meta name="description" content="([^"]*)"/,
  )?.[1];
  assert(title?.includes(tool.name), "Tool-specific title");
  assert(description?.length > 40, "A meaningful description");
  titles.add(title);
  descriptions.add(description);
  console.log(`PASS /${tool.slug}: ${words} rendered guide words`);
}
assert.equal(titles.size, tools.length, "Unique page titles");
assert.equal(descriptions.size, tools.length, "Unique descriptions");
console.log(
  "PASS all 26 exported routes, catalog links, inline inputs, guides and metadata",
);
