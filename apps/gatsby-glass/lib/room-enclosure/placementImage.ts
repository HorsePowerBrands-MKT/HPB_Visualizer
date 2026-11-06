/**
 * Renders the consumer's placement line onto a copy of their photo.
 *
 * The copy travels to the image model as a reference image (after input_1
 * and any inspiration photo) with `PLACEMENT_REFERENCE_DESCRIPTION`, so the
 * model sees exactly where the glass wall stands without the mark ever
 * touching the canvas it edits. Browser-only (uses a canvas element).
 */

import type { ImageData } from '@repo/types';
import type { RoomEnclosurePlacementLine } from './types';

/** Longest side of the reference copy; it only needs to be legible, not full resolution. */
export const PLACEMENT_REFERENCE_MAX_DIMENSION = 1280;

/** Bright magenta: rarely present in interior photos, so the model can't confuse it with the room. */
export const PLACEMENT_LINE_COLOR = '#ff00ff';
export const PLACEMENT_LINE_OUTLINE = '#ffffff';

/** Clamp a normalized coordinate into the image. */
export const clampUnit = (n: number): number => Math.min(1, Math.max(0, n));

/** Length of a normalized line, as a fraction of the image diagonal-ish (0..~1.4). */
export const placementLineLength = (line: RoomEnclosurePlacementLine): number =>
  Math.hypot(line.x2 - line.x1, line.y2 - line.y1);

/**
 * Draws the line (with endpoint dots) onto a 2D context of `width` x
 * `height` pixels. Shared by the on-screen overlay export and the reference
 * copy so both look identical.
 */
export function drawPlacementLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  line: RoomEnclosurePlacementLine
): void {
  const x1 = clampUnit(line.x1) * width;
  const y1 = clampUnit(line.y1) * height;
  const x2 = clampUnit(line.x2) * width;
  const y2 = clampUnit(line.y2) * height;
  const thickness = Math.max(6, Math.round(Math.min(width, height) * 0.012));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // White outline keeps the line visible on both dark and light floors.
  ctx.strokeStyle = PLACEMENT_LINE_OUTLINE;
  ctx.lineWidth = thickness + 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = PLACEMENT_LINE_COLOR;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ] as const) {
    ctx.beginPath();
    ctx.arc(x, y, thickness * 1.2, 0, Math.PI * 2);
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
  line: RoomEnclosurePlacementLine,
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
  drawPlacementLine(ctx, width, height, line);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  return { data: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg', width, height };
}
