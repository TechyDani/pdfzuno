"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FileText, Sparkles } from "lucide-react";
import { categories, tools } from "@/lib/pdf/tools";

export function SiteHeader({
  onHowItWorks,
  onPrivacy,
}: {
  onHowItWorks?: () => void;
  onPrivacy?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdown = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!dropdown.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  return (
    <header className="topbar site-header">
      <div className="shell site-header-inner">
        <Link className="brand" href="/" aria-label="PDFzuno home">
          <span className="brand-mark">
            <FileText size={25} />
          </span>
          PDFzuno<span className="text-[#315be8] -ml-2">.</span>
        </Link>
        <nav className="site-header-nav" aria-label="Main navigation">
          <Link
            className={`navlink ${pathname === "/" ? "header-link-active" : ""}`}
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            Home
          </Link>
          <div
            className="header-tools-dropdown"
            ref={dropdown}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setOpen(true);
            }}
            onPointerLeave={(event) => {
              if (
                event.pointerType === "mouse" &&
                !event.currentTarget.contains(document.activeElement)
              )
                setOpen(false);
            }}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setOpen(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape" && open) {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                trigger.current?.focus();
              }
            }}
          >
            <button
              ref={trigger}
              type="button"
              className="navlink header-tools-trigger"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setOpen(true);
                  requestAnimationFrame(() =>
                    panel.current
                      ?.querySelector<HTMLAnchorElement>("a")
                      ?.focus(),
                  );
                }
              }}
            >
              All Tool <ChevronDown size={15} aria-hidden="true" />
            </button>
            <div
              id={panelId}
              ref={panel}
              className="tools-dropdown-panel"
              role="region"
              aria-label="All tools"
              hidden={!open}
            >
              <div className="tools-dropdown-scroll">
                <div className="tools-dropdown-heading">
                  <span>Choose a tool</span>
                  <span>{tools.length} tools</span>
                </div>
                <div className="tools-dropdown-grid">
                  {categories
                    .filter((category) => category !== "All tools")
                    .map((category) => (
                      <div className="tools-dropdown-group" key={category}>
                        <h2>{category}</h2>
                        <ul>
                          {tools
                            .filter((tool) => tool.category === category)
                            .map((tool) => (
                              <li key={tool.id}>
                                <Link
                                  href={`/${tool.slug}/`}
                                  aria-current={
                                    pathname === `/${tool.slug}/` ||
                                    pathname === `/${tool.slug}`
                                      ? "page"
                                      : undefined
                                  }
                                  onClick={() => setOpen(false)}
                                >
                                  {tool.name}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
          <Link
            className={`navlink ${pathname === "/blogs" || pathname.startsWith("/blogs/") ? "header-link-active" : ""}`}
            href="/blogs/"
            aria-current={
              pathname === "/blogs" || pathname.startsWith("/blogs/")
                ? "page"
                : undefined
            }
          >
            Blogs
          </Link>
          {onHowItWorks && (
            <button
              className="navlink site-header-extra"
              onClick={onHowItWorks}
            >
              How it works
            </button>
          )}
          {onPrivacy && (
            <button className="navlink site-header-extra" onClick={onPrivacy}>
              Privacy first
            </button>
          )}
        </nav>
        {onHowItWorks && (
          <span className="site-header-tagline">
            <Sparkles size={15} /> Less work. More flow.
          </span>
        )}
      </div>
    </header>
  );
}
