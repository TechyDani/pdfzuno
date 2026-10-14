"use client";
import { useRef, useState } from "react";
type Box = { x: number; y: number; width: number; height: number };
export function PagePreview({
  url,
  width,
  height,
  box,
  onChange,
  disabled,
}: {
  url: string;
  width: number;
  height: number;
  box: Box;
  onChange: (b: Box) => void;
  disabled: boolean;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Box | null>(null);
  function point(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(width, ((e.clientX - r.left) / r.width) * width)),
      y: Math.max(
        0,
        Math.min(height, ((e.clientY - r.top) / r.height) * height),
      ),
    };
  }
  const b = draft || box;
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">
        Drag on the page to select an area. You can also enter exact coordinates
        below.
      </p>
      <div
        className="relative mx-auto max-w-[440px] border border-slate-300 bg-white touch-none select-none cursor-crosshair"
        style={{ aspectRatio: `${width}/${height}` }}
        onPointerDown={(e) => {
          if (disabled) return;
          start.current = point(e);
          e.currentTarget.setPointerCapture(e.pointerId);
          setDraft(null);
        }}
        onPointerMove={(e) => {
          if (!start.current) return;
          const p = point(e),
            s = start.current;
          setDraft({
            x: Math.min(s.x, p.x),
            y: Math.min(s.y, p.y),
            width: Math.abs(s.x - p.x),
            height: Math.abs(s.y - p.y),
          });
        }}
        onPointerUp={(e) => {
          if (start.current) {
            const p = point(e),
              s = start.current;
            const next = {
              x: Math.min(s.x, p.x),
              y: Math.min(s.y, p.y),
              width: Math.abs(s.x - p.x),
              height: Math.abs(s.y - p.y),
            };
            if (next.width > 2 && next.height > 2) onChange(next);
            start.current = null;
            setDraft(null);
          }
        }}
        onPointerCancel={() => {
          start.current = null;
          setDraft(null);
        }}
      >
        {/* Blob images are generated locally from the selected PDF. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Selected PDF page"
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <div
          className="absolute border-2 border-blue-600 bg-blue-500/20 pointer-events-none"
          style={{
            left: `${(b.x / width) * 100}%`,
            top: `${(b.y / height) * 100}%`,
            width: `${(b.width / width) * 100}%`,
            height: `${(b.height / height) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
