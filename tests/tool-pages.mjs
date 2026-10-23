// Checks the actual exported HTML, so guide text must exist before hydration.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tools, toolPath } from "../lib/pdf/tools.ts";
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
  const html = await readFile(`out/tools/${tool.slug}/index.html`, "utf8");
  assert.match(
    home,
    new RegExp(`href="/tools/${tool.slug}/?"`),
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
  assert(
    html.indexOf('id="tool-workspace"') < html.indexOf("<article"),
    "Tool interface appears before the guide",
  );
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  assert(canonical, "A canonical URL is present");
  assert.equal(
    new URL(canonical, "https://example.test").pathname,
    toolPath(tool),
  );
  const legacy = await readFile(`out/${tool.slug}/index.html`, "utf8");
  assert(legacy.includes('id="tool-workspace"'), "Legacy bookmarks still work");
  assert(
    legacy.includes(`rel="canonical" href="${canonical}"`),
    "Legacy pages identify the new canonical URL",
  );
  const paragraphs = [...article.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => match[1])
    .join(" ");
  const text = paragraphs.replace(/<[^>]*>/g, " ").replace(/&[^;]+;/g, "'");
  const words = text.trim().split(/\s+/u).length;
  assert(
    words >= 400 && words <= 500,
    `${tool.slug} has ${words} words; 400–500 required`,
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
  console.log(`PASS /tools/${tool.slug}: ${words} rendered guide words`);
}
assert.equal(titles.size, tools.length, "Unique page titles");
assert.equal(descriptions.size, tools.length, "Unique descriptions");
const compliancePages = [
  ["privacy-policy", "Privacy Policy", "Your files are processed locally"],
  ["terms", "Terms of Service", "Acceptable use"],
  ["about-us", "About Us", "A practical tool for everyday problems"],
];
for (const [slug, heading, section] of compliancePages) {
  const html = await readFile(`out/${slug}/index.html`, "utf8");
  assert(html.includes(`>${heading}</h1>`), `${slug} has its own heading`);
  assert(
    html.includes(`>${section}</h2>`),
    `${slug} includes existing policy text`,
  );
  assert(html.includes("mailto:info@pdfzuno.pk"), "Contact is available");
  for (const [target] of compliancePages) {
    assert(home.includes(`href="/${target}/"`), `Home links to ${target}`);
    assert(html.includes(`href="/${target}/"`), `${slug} links to ${target}`);
  }
}
const oldTerms = await readFile("out/terms-of-service/index.html", "utf8");
assert(oldTerms.includes('rel="canonical" href="/terms/"'));
assert(oldTerms.includes(">Terms of Service</h1>"));

// Follow the links actually rendered by Next, including related tools and blog links.
const pagePaths = [
  "/",
  ...tools.map(toolPath),
  ...compliancePages.map(([slug]) => `/${slug}/`),
  "/blogs/",
  "/blogs/securely-manage-pdf-documents-without-uploading/",
];
for (const pagePath of pagePaths) {
  const html = await readFile(`out${pagePath}index.html`, "utf8");
  const hrefs = new Set(
    [...html.matchAll(/<a\b[^>]*href="([^"?#]*)/g)].map((m) => m[1]),
  );
  for (const href of hrefs) {
    if (!href.startsWith("/") || !href.endsWith("/")) continue;
    await readFile(`out${href}index.html`, "utf8");
    assert(
      !tools.some((tool) => href === `/${tool.slug}/`),
      "Internal links use /tools/",
    );
    assert.notEqual(href, "/terms-of-service/", "Internal links use /terms/");
  }
}
console.log(
  "PASS 26 canonical tool routes, legacy URLs, 400–500 word guides, metadata, compliance pages and internal links",
);
