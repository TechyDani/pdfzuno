"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pause,
  Play,
  Sparkles,
  UserRound,
} from "lucide-react";
import { tools, toolPath, type Tool } from "@/lib/pdf/tools";

const popular = tools.filter((tool) => tool.popular);
const copy: Record<string, { title: string; accent: string; detail: string }> =
  {
    "remove-background": {
      title: "Keep the subject.",
      accent: "Lose the background.",
      detail:
        "A cleaner look in a few clicks. Isolate your subject and download a transparent PNG, right in your browser.",
    },
    merge: {
      title: "Separate files.",
      accent: "One seamless PDF.",
      detail:
        "Bring your documents together, arrange them your way, and share one neatly organized PDF.",
    },
    split: {
      title: "Just the pages",
      accent: "you actually need.",
      detail:
        "Pull out a chapter, a single page, or a whole section. Make a new PDF from the parts that matter.",
    },
    compress: {
      title: "Less file size.",
      accent: "More room to share.",
      detail:
        "Make bulky PDFs easier to send and store. Choose the compression setting that works for your document.",
    },
    "pdf-word": {
      title: "From finished PDF",
      accent: "to your next draft.",
      detail:
        "Turn your PDF into a Word document. Extract editable text or preserve its appearance with page images.",
    },
  };

function ToolPreview({ tool }: { tool: Tool }) {
  return (
    <div className={`hero-art hero-art-${tool.id}`} aria-hidden="true">
      <div className="hero-preview">
        <div className="hero-preview-bar">
          <span />
          <span />
          <span />
          <span className="hero-preview-title">{tool.name}</span>
        </div>
        {tool.id === "remove-background" ? (
          <div className="hero-cutout image-result-preview">
            <div className="hero-subject">
              <UserRound strokeWidth={1.3} />
            </div>
            <span className="hero-cutout-sparkle">
              <Sparkles size={24} />
            </span>
            <span className="hero-preview-label">
              <Check size={14} /> Transparent PNG
            </span>
          </div>
        ) : tool.id === "merge" || tool.id === "split" ? (
          <div className="hero-document-flow">
            <div className="hero-paper-group">
              {[1, 2, 3].map((page) => (
                <div className="hero-paper" key={page}>
                  <FileText size={28} strokeWidth={1.5} />
                  <span>PDF {String(page).padStart(2, "0")}</span>
                  <i />
                  <i />
                  <i />
                </div>
              ))}
            </div>
            <div className="hero-flow-caption">
              <ArrowDownToLine size={18} />
              {tool.id === "merge"
                ? "Together in one PDF"
                : "Your pages, your choice"}
            </div>
          </div>
        ) : tool.id === "compress" ? (
          <div className="hero-compression">
            <FileText size={58} strokeWidth={1.3} />
            <div>
              <span>Original PDF</span>
              <i className="hero-size-original" />
            </div>
            <div>
              <span>Smaller PDF</span>
              <i className="hero-size-small" />
            </div>
            <span className="hero-preview-label">
              <Check size={14} /> Ready to share
            </span>
          </div>
        ) : (
          <div className="hero-word-preview">
            <span className="hero-word-badge">W</span>
            <strong>Your next big idea.</strong>
            <i />
            <i />
            <i />
            <i />
            <span className="hero-preview-label">
              <Check size={14} /> A new starting point
            </span>
          </div>
        )}
      </div>
      <span className="hero-art-note">
        <Sparkles size={14} /> A little less work. A little more flow.
      </span>
    </div>
  );
}

export function PopularHero({ suspended = false }: { suspended?: boolean }) {
  const [viewport, api] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!api) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () =>
      api.reInit({ duration: motion.matches ? 0 : 25 });
    const update = () => setSelected(api.selectedScrollSnap());
    api.on("select", update);
    api.on("reInit", update);
    updateMotion();
    motion.addEventListener("change", updateMotion);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
      motion.removeEventListener("change", updateMotion);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused || hovered || focused || suspended) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dragging = false;
    const stop = () => clearTimeout(timer);
    const schedule = () => {
      stop();
      if (document.hidden || motion.matches || dragging) return;
      timer = setTimeout(() => {
        if (!document.hidden && !motion.matches && !dragging) api.scrollNext();
      }, 5000);
    };
    const dragStart = () => {
      dragging = true;
      stop();
    };
    const dragEnd = () => {
      dragging = false;
      schedule();
    };
    api.on("select", schedule);
    api.on("reInit", schedule);
    api.on("pointerDown", dragStart);
    api.on("pointerUp", dragEnd);
    document.addEventListener("visibilitychange", schedule);
    motion.addEventListener("change", schedule);
    schedule();
    return () => {
      stop();
      api.off("select", schedule);
      api.off("reInit", schedule);
      api.off("pointerDown", dragStart);
      api.off("pointerUp", dragEnd);
      document.removeEventListener("visibilitychange", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, [api, paused, hovered, focused, suspended]);

  return (
    <div
      className="popular-hero"
      role="region"
      aria-roledescription="carousel"
      aria-label="Popular tools"
      tabIndex={0}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          if (event.key === "ArrowLeft") api?.scrollPrev();
          else api?.scrollNext();
        }
      }}
    >
      <div className="hero-viewport" ref={viewport}>
        <div className="hero-track">
          {popular.map((tool, index) => {
            const slide = copy[tool.id] || {
              title: tool.name,
              accent: "Made simple.",
              detail: tool.description,
            };
            return (
              <div
                className={`hero-slide hero-theme-${tool.color}`}
                key={tool.id}
                id={`hero-${tool.id}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${popular.length}: ${tool.name}`}
                aria-hidden={selected !== index}
                inert={selected !== index}
              >
                <div className="hero-slide-copy">
                  <span className="hero-feature-label">
                    <Sparkles size={14} /> Popular tool <span>·</span>{" "}
                    {tool.name}
                  </span>
                  <h2>
                    {slide.title}
                    <br />
                    <span>{slide.accent}</span>
                  </h2>
                  <p>{slide.detail}</p>
                  <Link className="primary hero-cta" href={toolPath(tool)}>
                    Use {tool.name} <ArrowRight size={17} />
                  </Link>
                  <span className="hero-local-note">
                    <Check size={14} /> Free to use. Your files stay on your
                    device.
                  </span>
                </div>
                <ToolPreview tool={tool} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="hero-slider-controls">
        <button
          className="hero-arrow"
          aria-label="Previous popular tool"
          onClick={() => api?.scrollPrev()}
        >
          <ChevronLeft size={19} />
        </button>
        <div className="hero-dots" aria-label="Choose a popular tool">
          {popular.map((tool, index) => (
            <button
              key={tool.id}
              className={`hero-dot ${selected === index ? "is-active" : ""}`}
              aria-label={`Show ${tool.name}`}
              aria-current={selected === index ? "true" : undefined}
              aria-controls={`hero-${tool.id}`}
              onClick={() => api?.scrollTo(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <button
          className="hero-arrow"
          aria-label="Next popular tool"
          onClick={() => api?.scrollNext()}
        >
          <ChevronRight size={19} />
        </button>
        <button
          className="hero-arrow"
          aria-label={paused ? "Enable auto-slide" : "Pause auto-slide"}
          title={paused ? "Enable auto-slide" : "Pause auto-slide"}
          onClick={() => {
            setPaused((value) => !value);
            if (paused) setFocused(false);
          }}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
        <span
          className="sr-only"
          aria-live={paused || focused ? "polite" : "off"}
          aria-atomic="true"
        >
          {popular[selected]?.name}, slide {selected + 1} of {popular.length}
        </span>
      </div>
    </div>
  );
}
