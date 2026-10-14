"use client";
import { useRef } from "react";
export function SignaturePad({
  onChange,
  disabled,
}: {
  onChange: (data: string) => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      ((e.clientX - r.left) * 600) / r.width,
      ((e.clientY - r.top) * 160) / r.height,
    ];
  }
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Draw your signature, or type your name below
      </p>
      <canvas
        ref={ref}
        width={600}
        height={160}
        aria-label="Draw signature here"
        className="w-full h-32 rounded-lg border border-slate-300 bg-white touch-none"
        onPointerDown={(e) => {
          if (disabled) return;
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const c = e.currentTarget.getContext("2d")!;
          c.strokeStyle = "#17233d";
          c.lineWidth = 3;
          c.lineCap = "round";
          c.lineJoin = "round";
          c.beginPath();
          const [x, y] = point(e);
          c.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const c = e.currentTarget.getContext("2d")!;
          const [x, y] = point(e);
          c.lineTo(x, y);
          c.stroke();
        }}
        onPointerUp={() => {
          if (drawing.current) {
            drawing.current = false;
            onChange(ref.current!.toDataURL("image/png"));
          }
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      />
      <button
        type="button"
        className="text-sm text-blue-700 underline"
        disabled={disabled}
        onClick={() => {
          ref.current?.getContext("2d")?.clearRect(0, 0, 600, 160);
          onChange("");
        }}
      >
        Clear drawing
      </button>
    </div>
  );
}
