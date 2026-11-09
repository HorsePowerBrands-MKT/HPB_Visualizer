'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Undo2, X } from 'lucide-react';
import type {
  RoomEnclosurePlacementPath,
  RoomEnclosurePlacementPoint,
} from '../../../lib/room-enclosure';
import {
  clampUnit,
  pointDistance,
  placementWallCount,
  isPlacementPathComplete,
  MIN_SEGMENT_LENGTH,
  PLACEMENT_LINE_COLOR,
  PLACEMENT_LINE_OUTLINE,
} from '../../../lib/room-enclosure';

interface PlacementLineOverlayProps {
  /** The preview shown underneath (used only to learn the image's natural size). */
  previewUrl: string;
  path: RoomEnclosurePlacementPath | null;
  onChange: (path: RoomEnclosurePlacementPath | null) => void;
  /** Shown on the photo while nothing is drawn. */
  hint: string;
}

interface RenderedRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface PointerDown {
  point: RoomEnclosurePlacementPoint;
  clientX: number;
  clientY: number;
  moved: boolean;
}

/** Pointer travel (px) before a press counts as a drag instead of a tap. */
const TAP_SLOP_PX = 6;

/**
 * Draw-on-photo layer for the room enclosure upload step. The consumer taps
 * the corners of the glass walls in order (two taps = one wall, three = an
 * L-shaped room, four = a U); a drag is a shortcut for a single wall. The
 * result is a floor path the glass stands on.
 *
 * Sits over the preview's `object-contain` image, so it first works out
 * where the image actually renders inside the box and maps pointer
 * positions to 0..1 image coordinates. Touch and mouse both work (pointer
 * events, no page scroll while drawing).
 */
export const PlacementLineOverlay: React.FC<PlacementLineOverlayProps> = ({
  previewUrl,
  path,
  onChange,
  hint,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  /** Live preview while dragging the first wall. */
  const [draft, setDraft] = useState<RoomEnclosurePlacementPath | null>(null);
  const downRef = useRef<PointerDown | null>(null);

  const points = path?.points ?? [];

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
    (e: React.PointerEvent): RoomEnclosurePlacementPoint | null => {
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
    downRef.current = { point: p, clientX: e.clientX, clientY: e.clientY, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const down = downRef.current;
    if (!down) return;
    if (!down.moved && Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) > TAP_SLOP_PX) {
      down.moved = true;
    }
    // Dragging with nothing drawn yet previews a single wall.
    if (down.moved && points.length === 0) {
      const p = toImagePoint(e);
      if (p) setDraft({ points: [down.point, p] });
    }
  };

  const finishPointer = (e: React.PointerEvent) => {
    const down = downRef.current;
    if (!down) return;
    downRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDraft(null);
    const p = toImagePoint(e) ?? down.point;

    if (points.length === 0 && down.moved) {
      // First wall by drag. Too short to be a wall: ignore.
      if (pointDistance(down.point, p) >= MIN_SEGMENT_LENGTH) onChange({ points: [down.point, p] });
      return;
    }

    // A tap (or a drag that started on an existing path) adds the next corner.
    const last = points[points.length - 1];
    if (!last || pointDistance(last, p) >= MIN_SEGMENT_LENGTH) {
      onChange({ points: [...points, p] });
    }
  };

  const undoCorner = () => onChange(points.length <= 1 ? null : { points: points.slice(0, -1) });

  const shown = draft ?? path;
  const shownPoints = shown?.points ?? [];
  const walls = placementWallCount(path);
  const complete = isPlacementPathComplete(path);
  const hintText =
    shownPoints.length === 0 ? hint : !complete ? 'Tap the next corner to finish the first wall' : null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[5] touch-none select-none cursor-crosshair"
      role="application"
      aria-label="Tap the corners on the photo where the glass walls should stand"
      data-testid="placement-overlay"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      {rect && shownPoints.length > 0 && (
        <svg
          className="absolute pointer-events-none"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
          viewBox={`0 0 ${rect.width} ${rect.height}`}
          aria-hidden="true"
        >
          {shownPoints.length >= 2 && (
            <>
              <polyline
                points={shownPoints.map((p) => `${p.x * rect.width},${p.y * rect.height}`).join(' ')}
                fill="none"
                stroke={PLACEMENT_LINE_OUTLINE}
                strokeWidth={8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={shownPoints.map((p) => `${p.x * rect.width},${p.y * rect.height}`).join(' ')}
                fill="none"
                stroke={PLACEMENT_LINE_COLOR}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                data-testid="placement-path"
              />
            </>
          )}
          {shownPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x * rect.width}
              cy={p.y * rect.height}
              r={7}
              fill={PLACEMENT_LINE_COLOR}
              stroke={PLACEMENT_LINE_OUTLINE}
              strokeWidth={2}
              data-testid="placement-point"
            />
          ))}
        </svg>
      )}

      {hintText && !draft && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none px-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/75 border border-brand-gold/60 text-brand-gold text-xs md:text-sm font-medium text-center">
            <span
              className="inline-block w-5 h-0.5 rounded-full"
              style={{ background: PLACEMENT_LINE_COLOR, boxShadow: `0 0 0 1px ${PLACEMENT_LINE_OUTLINE}` }}
              aria-hidden="true"
            />
            {hintText}
          </span>
        </div>
      )}

      {points.length > 0 && !draft && (
        <div
          className="absolute bottom-4 left-4 flex items-center gap-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={undoCorner}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/75 border border-white/30 text-white/80 hover:text-white hover:border-brand-gold/60 text-xs font-medium transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo corner
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/75 border border-white/30 text-white/80 hover:text-white hover:border-brand-gold/60 text-xs font-medium transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
          {complete && (
            <span
              className="inline-flex items-center px-2.5 py-1.5 bg-black/75 border border-brand-gold/60 text-brand-gold text-xs font-medium"
              data-testid="placement-wall-count"
            >
              {walls} {walls === 1 ? 'wall' : 'walls'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
