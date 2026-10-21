"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { tools, categories, type Tool } from "@/lib/pdf/tools";
import { PopularHero } from "./popular-hero";
import { SiteHeader } from "./site-header";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export function ToolIcon({ tool }: { tool: Tool }) {
  const Icon =
    (Icons as unknown as Record<string, Icons.LucideIcon>)[tool.icon] ||
    Icons.FileText;
  return (
    <div className={`tool-icon ${tool.color}`}>
      <Icon size={25} strokeWidth={1.8} />
    </div>
  );
}
export function Toolkit() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const [info, setInfo] = useState<"how" | "privacy" | null>(null);
  useEffect(() => {
    const ctx = (
      document as unknown as {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        ctx.registerTool(
          {
            name: "filter_pdf_tools",
            description:
              "Filter the visible PDF toolkit by category and search text.",
            inputSchema: {
              type: "object",
              properties: {
                category: { type: "string", enum: categories },
                query: { type: "string" },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              const data = input as { category?: string; query?: string };
              if (
                !data ||
                typeof data !== "object" ||
                (data.category && !categories.includes(data.category)) ||
                (data.query !== undefined && typeof data.query !== "string")
              )
                throw new Error("Invalid filter");
              setCategory(data.category || "All tools");
              setQuery(data.query || "");
              return {
                category: data.category || "All tools",
                query: data.query || "",
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  const filtered = tools.filter(
    (t) =>
      (category === "All tools" || t.category === category) &&
      `${t.name} ${t.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <SiteHeader
        onHowItWorks={() => setInfo("how")}
        onPrivacy={() => setInfo("privacy")}
      />
      <main>
        <section className="hero">
          <div className="shell">
            <span className="eyebrow">
              <Icons.Zap size={13} /> YOUR EVERYDAY PDF & IMAGE TOOLKIT
            </span>
            <PopularHero suspended={!!info} />
            <label className="search">
              <Icons.Search size={20} color="#8591aa" />
              <input
                aria-label="Search tools"
                placeholder="What would you like to do with your PDF or image?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="Clear search" onClick={() => setQuery("")}>
                  <Icons.X size={17} />
                </button>
              )}
            </label>
            <div className="trust">
              <span>
                <Icons.ShieldCheck size={14} /> Local file processing
              </span>
              <span>
                <Icons.CircleCheck size={14} /> No sign-up needed
              </span>
              <span>
                <Icons.Monitor size={14} /> Right in your browser
              </span>
            </div>
          </div>
        </section>
        <section
          className="tool-section shell"
          id="tools"
          aria-label="PDF and image tools"
        >
          <div className="filters">
            <Icons.SlidersHorizontal
              size={17}
              className="mr-2 text-[#8290a7] hidden sm:block"
            />
            {categories.map((c) => (
              <button
                key={c}
                className={`filter ${category === c ? "active" : ""}`}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
            <span className="ml-auto text-xs text-[#778397] pl-3">
              {filtered.length} tools
            </span>
          </div>
          <div className="tool-grid">
            {filtered.map((t) => (
              <Link
                key={t.id}
                href={`/${t.slug}/`}
                className="tool-card"
                aria-label={t.name}
              >
                <ToolIcon tool={t} />
                {t.popular ? (
                  <span className="card-meta popular">Popular</span>
                ) : null}
                <h3>{t.name}</h3>
                <p>{t.description}</p>
              </Link>
            ))}
          </div>
          {!filtered.length && (
            <div className="text-center py-16">
              <Icons.Search className="mx-auto mb-3 text-slate-400" />
              <h2 className="text-xl font-bold">No tools found</h2>
              <p className="text-slate-500 mt-2">
                Try “merge”, “pages”, or choose another category.
              </p>
              <button
                className="primary mt-5"
                onClick={() => {
                  setQuery("");
                  setCategory("All tools");
                }}
              >
                Show all tools
              </button>
            </div>
          )}
          <div className="bottom-note">
            <div className="shrink-0 rounded-xl bg-white p-3 text-[#315be8]">
              <Icons.ShieldCheck size={28} />
            </div>
            <div>
              <h3>Your files. Your business.</h3>
              <p>
                All tools process files on your device. No file uploads, no
                accounts, no copies stored on a server.
              </p>
            </div>
            <button
              onClick={() => setInfo("privacy")}
              className="mobile-hide ml-auto shrink-0 items-center gap-2 text-sm text-[#315be8] font-semibold"
            >
              Our approach <Icons.ArrowUpRight size={16} />
            </button>
          </div>
        </section>
      </main>
      <Dialog open={!!info} onOpenChange={() => setInfo(null)}>
        <DialogContent>
          <DialogTitle>
            {info === "privacy"
              ? "Private by design"
              : "Three steps. One less task."}
          </DialogTitle>
          <DialogDescription>
            {info === "privacy"
              ? "Your document contents stay on your device."
              : "Choose a tool, add your files, and download the result."}
          </DialogDescription>
          <div className="text-sm leading-7 text-slate-600">
            {info === "privacy" ? (
              <>
                <p>
                  PDF and image tools run inside your browser. PDFzuno does not
                  upload or store your files. Closing the tool clears its
                  working selection.
                </p>
                <p className="mt-3">
                  Fonts are loaded from Google Fonts. They receive ordinary
                  connection information, never your PDF contents. The document
                  engine downloads once and processes your files locally.
                  Background removal also downloads an AI model from IMG.LY;
                  your images are processed locally and are never uploaded.
                </p>
                <Link
                  className="inline-block mt-3 text-blue-700 underline"
                  href="/privacy-policy/"
                >
                  Read the full Privacy Policy
                </Link>
              </>
            ) : (
              <ol className="list-decimal pl-5 space-y-3">
                <li>Choose any tool from the grid.</li>
                <li>
                  Select your PDF, Office document or images. Adjust the
                  settings for your task.
                </li>
                <li>
                  Process your document, then download the converted file. Your
                  original stays unchanged.
                </li>
              </ol>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
