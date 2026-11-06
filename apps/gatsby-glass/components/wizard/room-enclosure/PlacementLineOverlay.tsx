'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { RoomEnclosurePlacementLine } from '../../../lib/room-enclosure';
import {
  clampUnit,
  placementLineLength,
  PLACEMENT_LINE_COLOR,
  PLACEMENT_LINE_OUTLINE,
} from '../../../lib/room-enclosure';

interface PlacementLineOverlayProps {
  /** The preview shown underneath (used only to learn the image's natural size). */
  previewUrl: string;
  line: RoomEnclosurePlacementLine | null;
  onChange: (line: RoomEnclosurePlacementLine | null) => void;
  /** Shown on the photo while no line is drawn. */
  hint: string;
}

interface RenderedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Drags shorter than this (fraction of the image) are treated as accidental taps. */
const MIN_LINE_LENGTH = 0.03;

/**
 * Draw-on-photo layer for the room enclosure upload step: one drag along
 * the floor marks where the glass wall stands. Sits over the preview's
 * `object-contain` image, so it first works out where the image actually
 * renders inside the box and maps pointer positions to 0..1 image
 * coordinates. Touch and mouse both work (pointer events, no page scroll
 * while dragging).
 */
export const PlacementLineOverlay: React.FC<PlacementLineOverlayProps> = ({
  previewUrl,
  line,
  onChange,
  hint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [draft, setDraft] = useState<RoomEnclosurePlacementLine | null>(null);
  // Mirror of `draft` for the pointer handlers, so the finished line can be
  // handed to `onChange` outside of a state updater.
  const draftRef = useRef<RoomEnclosurePlacementLine | null>(null);
  const dragging = useRef(false);

  const updateDraft = (next: RoomEnclosurePlacementLine | null) => {
    draftRef.current = next;
    setDraft(next);
  };

  // Track the overlay's own size (it fills the preview box).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setBox({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Learn the image's natural size so the object-contain rect can be derived.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = previewUrl;
    return () => {
      cancelled = true;
    };
  }, [previewUrl]);

  const rect: RenderedRect | null =
    natural && box.width > 0 && box.height > 0
      ? (() => {
          const scale = Math.min(box.width / natural.width, box.height / natural.height);
          const width = natural.width * scale;
          const height = natural.height * scale;
          return { left: (box.width - width) / 2, top: (box.height - height) / 2, width, height };
        })()
      : null;

  const toImagePoint = useCallback(
    (e: React.PointerEvent): { x: number; y: number } | null => {
      const el = containerRef.current;
      if (!el || !rect) return null;
      const bounds = el.getBoundingClientRect();
      return {
        x: clampUnit((e.clientX - bounds.left - rect.left) / rect.width),
        y: clampUnit((e.clientY - bounds.top - rect.top) / rect.height),
      };
    },
    [rect]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    const p = toImagePoint(e);
    if (!p) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    updateDraft({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !draftRef.current) return;
    const p = toImagePoint(e);
    if (!p) return;
    updateDraft({ ...draftRef.current, x2: p.x, y2: p.y });
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const finished = draftRef.current;
    updateDraft(null);
    // An accidental tap keeps whatever line was there before.
    if (finished && placementLineLength(finished) >= MIN_LINE_LENGTH) onChange(finished);
  };

  const shown = draft ?? line;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[5] touch-none select-none cursor-crosshair"
      role="application"
      aria-label="Drag on the photo to mark where the glass wall should stand"
      data-testid="placement-overlay"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {rect && shown && (
        <svg
          className="absolute pointer-events-none"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          viewBox={`0 0 ${rect.width} ${rect.height}`}
          aria-hidden="true"
        >
          <line
            x1={shown.x1 * rect.width}
            y1={shown.y1 * rect.height}
            x2={shown.x2 * rect.width}
            y2={shown.y2 * rect.height}
            stroke={PLACEMENT_LINE_OUTLINE}
            strokeWidth={8}
            strokeLinecap="round"
          />
          <line
            x1={shown.x1 * rect.width}
            y1={shown.y1 * rect.height}
            x2={shown.x2 * rect.width}
            y2={shown.y2 * rect.height}
            stroke={PLACEMENT_LINE_COLOR}
            strokeWidth={4}
            strokeLinecap="round"
            data-testid="placement-line"
          />
          {[
            [shown.x1, shown.y1],
            [shown.x2, shown.y2],
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x * rect.width}
              cy={y * rect.height}
              r={7}
              fill={PLACEMENT_LINE_COLOR}
              stroke={PLACEMENT_LINE_OUTLINE}
              strokeWidth={2}
            />
          ))}
        </svg>
      )}

      {!shown && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none px-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/75 border border-brand-gold/60 text-brand-gold text-xs md:text-sm font-medium text-center">
            <span
              className="inline-block w-5 h-0.5 rounded-full"
              style={{ background: PLACEMENT_LINE_COLOR, boxShadow: `0 0 0 1px ${PLACEMENT_LINE_OUTLINE}` }}
              aria-hidden="true"
            />
            {hint}
          </span>
        </div>
      )}

      {line && !draft && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onChange(null)}
          className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/75 border border-white/30 text-white/80 hover:text-white hover:border-brand-gold/60 text-xs font-medium transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Clear line
        </button>
      )}
    </div>
  );
};
