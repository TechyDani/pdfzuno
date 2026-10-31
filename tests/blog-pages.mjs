// Run after a production build: assert the content is present without hydration.
import assert from "node:assert/strict";
import { readBuiltPage } from "./built-site.mjs";
import { tools as allTools, toolPath } from "../lib/pdf/tools.ts";
import {
  articleBodyText,
  articleWordCount,
  toolArticles,
} from "../lib/blog/tool-articles.ts";
import { blogArticles } from "../lib/blog/articles.ts";

const tools = allTools.filter((tool) => tool.kind !== "download");

const escapeHtml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");

assert.equal(toolArticles.length, tools.length, "One blog post for every tool");
assert.deepEqual(
  toolArticles.map((article) => article.toolId).sort(),
  tools.map((tool) => tool.id).sort(),
);
assert.equal(
  new Set(blogArticles.map((article) => article.slug)).size,
  blogArticles.length,
);
assert.equal(
  new Set(toolArticles.map((article) => article.metaTitle)).size,
  tools.length,
);
assert.equal(
  new Set(toolArticles.map((article) => article.excerpt)).size,
  tools.length,
);

const index = await readBuiltPage("/blogs/");
const titles = new Set();
for (const article of toolArticles) {
  const path = `/blogs/${article.slug}/`;
  const html = await readBuiltPage(path);
  const words = articleWordCount(article);
  assert(
    words >= 900,
    `${article.slug}: ${words} prose words, at least 900 required`,
  );
  assert.equal((html.match(/<h1\b/g) || []).length, 1, "One main heading");
  assert(html.includes(`>${escapeHtml(article.title)}</h1>`));
  assert(index.includes(`href="${path}"`), "Blog index links to the article");
  assert(
    html.includes(`href="${toolPath(article.tool)}"`),
    "Article links to its tool",
  );
  const toolHtml = await readBuiltPage(toolPath(article.tool));
  assert(
    toolHtml.includes(`href="${path}"`),
    "Tool links back to its full article",
  );

  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  assert(canonical, "Canonical is present");
  assert.equal(new URL(canonical, "https://example.test").pathname, path);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.equal(title, escapeHtml(article.metaTitle), "Correct article title");
  titles.add(title);
  assert(
    html.includes(
      `<meta name="description" content="${escapeHtml(article.excerpt)}"`,
    ),
  );
  assert(html.includes('property="og:type" content="article"'));
  assert(html.includes('name="twitter:card" content="summary"'));

  // Every word-count source must also be visible in a server-rendered paragraph.
  const prose = [
    article.answer,
    article.guide.intro,
    ...article.sections.flatMap((section) => section.paragraphs),
    ...article.guide.steps.map((step) => step.text),
    ...article.guide.useCases.map((useCase) => useCase.text),
    ...article.guide.faqs.map((faq) => faq.text),
  ];
  assert.equal(prose.join(" "), articleBodyText(article));
  const renderedArticle = html.match(
    /<article\b[^>]*>([\s\S]*?)<\/article>/,
  )?.[1];
  assert(renderedArticle, "Article rendered before hydration");
  for (const paragraph of prose) {
    assert(
      renderedArticle.includes(
        `<p${paragraph === article.answer ? ' class="article-lead"' : ""}>${escapeHtml(paragraph)}</p>`,
      ),
      `${article.slug} renders counted prose as a visible paragraph`,
    );
  }
  const ids = [...renderedArticle.matchAll(/\bid="([^"]*)"/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(ids).size, ids.length, "No duplicate article IDs");
  for (const [, target] of renderedArticle.matchAll(/href="#([^"]*)"/g)) {
    assert(ids.includes(target), `Table of contents target ${target} exists`);
  }
  assert(article.relatedToolIds.length > 0);
  for (const id of article.relatedToolIds) {
    const related = toolArticles.find((candidate) => candidate.toolId === id);
    assert(related, `Related guide exists for ${id}`);
    assert.notEqual(id, article.toolId, "Related guide is a different article");
    assert(html.includes(`href="/blogs/${related.slug}/"`));
  }
  const schema = JSON.parse(
    html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1],
  );
  const posting = schema["@graph"].find(
    (item) => item["@type"] === "BlogPosting",
  );
  assert.equal(posting.headline, article.title);
  assert.equal(posting.wordCount, words);
  assert.equal(posting.datePublished, article.publishedAt);
  assert.equal(posting.author.name, article.author);
  const faq = schema["@graph"].find((item) => item["@type"] === "FAQPage");
  assert.deepEqual(
    faq.mainEntity.map((question) => [
      question.name,
      question.acceptedAnswer.text,
    ]),
    article.guide.faqs.map((question) => [question.title, question.text]),
    "Structured FAQs match the visible questions and answers",
  );
  const breadcrumbs = schema["@graph"].find(
    (item) => item["@type"] === "BreadcrumbList",
  );
  assert.equal(breadcrumbs.itemListElement.length, 3);
  console.log(`PASS ${path}: ${words} prose words, metadata, schema and links`);
}
assert.equal(titles.size, tools.length);

// Existing specialised posts remain listed and their static routes still work.
for (const article of blogArticles) {
  assert(index.includes(`href="/blogs/${article.slug}/"`));
  await readBuiltPage(`/blogs/${article.slug}/`);
}
console.log(
  `PASS ${toolArticles.length} tool articles and ${blogArticles.length} total blog routes`,
);
