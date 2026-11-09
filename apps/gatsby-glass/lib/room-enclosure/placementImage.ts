/**
 * Renders the consumer's placement path onto a copy of their photo.
 *
 * The copy travels to the image model as a reference image (after input_1
 * and any inspiration photo) with `PLACEMENT_REFERENCE_DESCRIPTION`, so the
 * model sees exactly where each glass wall stands without the mark ever
 * touching the canvas it edits. Browser-only (uses a canvas element).
 */

import type { ImageData } from '@repo/types';
import type { RoomEnclosurePlacementPath, RoomEnclosurePlacementPoint } from './types';

/** Longest side of the reference copy; it only needs to be legible, not full resolution. */
export const PLACEMENT_REFERENCE_MAX_DIMENSION = 1280;

/** Bright magenta: rarely present in interior photos, so the model can't confuse it with the room. */
export const PLACEMENT_LINE_COLOR = '#ff00ff';
export const PLACEMENT_LINE_OUTLINE = '#ffffff';

/** Segments shorter than this (fraction of the image) are accidental taps, not walls. */
export const MIN_SEGMENT_LENGTH = 0.03;

/** Clamp a normalized coordinate into the image. */
export const clampUnit = (n: number): number => Math.min(1, Math.max(0, n));

export const pointDistance = (a: RoomEnclosurePlacementPoint, b: RoomEnclosurePlacementPoint): number =>
  Math.hypot(b.x - a.x, b.y - a.y);

/** Number of glass walls the path describes (one per segment). */
export const placementWallCount = (path: RoomEnclosurePlacementPath | null): number =>
  path ? Math.max(0, path.points.length - 1) : 0;

/** A usable path has at least one segment of real length. */
export const isPlacementPathComplete = (path: RoomEnclosurePlacementPath | null): boolean =>
  !!path &&
  path.points.length >= 2 &&
  path.points.slice(1).every((p, i) => pointDistance(path.points[i], p) >= MIN_SEGMENT_LENGTH);

/**
 * Draws the path (segments plus a dot at every corner) onto a 2D context of
 * `width` x `height` pixels. Shared by the reference copy and anything that
 * wants the on-screen look to match.
 */
export function drawPlacementPath(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  path: RoomEnclosurePlacementPath
): void {
  const pts = path.points.map((p) => ({ x: clampUnit(p.x) * width, y: clampUnit(p.y) * height }));
  if (pts.length === 0) return;
  const thickness = Math.max(6, Math.round(Math.min(width, height) * 0.012));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
  };

  if (pts.length >= 2) {
    // White outline keeps the path visible on both dark and light floors.
    trace();
    ctx.strokeStyle = PLACEMENT_LINE_OUTLINE;
    ctx.lineWidth = thickness + 4;
    ctx.stroke();

    trace();
    ctx.strokeStyle = PLACEMENT_LINE_COLOR;
    ctx.lineWidth = thickness;
    ctx.stroke();
  }

  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, thickness * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = PLACEMENT_LINE_COLOR;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = PLACEMENT_LINE_OUTLINE;
    ctx.stroke();
  }
  ctx.restore();
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for the placement reference'));
    };
    img.src = url;
  });
}

/**
 * Builds the marked-up reference copy of the uploaded photo as base64 JPEG,
 * downscaled so it adds well under half a megabyte to the generate request.
 */
export async function renderPlacementReferenceImage(
  file: File,
  path: RoomEnclosurePlacementPath,
  maxDimension: number = PLACEMENT_REFERENCE_MAX_DIMENSION
): Promise<ImageData> {
  const img = await loadImageElement(file);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available for the placement reference');

  ctx.drawImage(img, 0, 0, width, height);
  drawPlacementPath(ctx, width, height, path);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { data: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg', width, height };
}
