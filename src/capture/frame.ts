/**
 * Pixel helpers for reading the game's screen. Everything in `src/capture/` is pure (no DOM, no
 * store) so `scripts/check-capture.mjs` can replay real screenshots through it in Node.
 */

/** One captured screen (or a decoded sprite): RGBA, 4 bytes per pixel, row-major. */
export interface Frame {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

/** A rectangle in frame pixels. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The screen every measurement in `geometry.ts` was taken on (the screenshots in
 * `scripts/capture-fixtures/`). A frame of another size is read by scaling x by its width and
 * y by its height, so a phone with a different aspect ratio is **not** covered yet.
 */
export const REF_WIDTH = 1080;
export const REF_HEIGHT = 2460;

/** A `geometry.ts` rectangle (reference pixels) in this frame's pixels. */
export function scaleRect(frame: Frame, ref: Rect): Rect {
  const sx = frame.width / REF_WIDTH;
  const sy = frame.height / REF_HEIGHT;
  const x = Math.round(ref.x * sx);
  const y = Math.round(ref.y * sy);
  return { x, y, w: Math.max(1, Math.round((ref.x + ref.w) * sx) - x), h: Math.max(1, Math.round((ref.y + ref.h) * sy) - y) };
}

export function scaleX(frame: Frame, refX: number): number {
  return Math.round((refX * frame.width) / REF_WIDTH);
}

export function scaleY(frame: Frame, refY: number): number {
  return Math.round((refY * frame.height) / REF_HEIGHT);
}

/** The brightest channel of a pixel — "is there ink here" on the game's black cards, whatever its color. */
export function peak(frame: Frame, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) return 0;
  const i = (y * frame.width + x) * 4;
  return Math.max(frame.data[i], frame.data[i + 1], frame.data[i + 2]);
}

export function luma(frame: Frame, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= frame.width || y >= frame.height) return 0;
  const i = (y * frame.width + x) * 4;
  return 0.299 * frame.data[i] + 0.587 * frame.data[i + 1] + 0.114 * frame.data[i + 2];
}

export function rgb(frame: Frame, x: number, y: number): [number, number, number] {
  const i = (Math.min(frame.height - 1, Math.max(0, y)) * frame.width + Math.min(frame.width - 1, Math.max(0, x))) * 4;
  return [frame.data[i], frame.data[i + 1], frame.data[i + 2]];
}

/** The brightest `peak` anywhere in a rectangle (a button label lit up, a border turned white, ...). */
export function maxPeak(frame: Frame, rect: Rect): number {
  let best = 0;
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) best = Math.max(best, peak(frame, x, y));
  }
  return best;
}

/** The tight box around every pixel of `rect` that `isInk` accepts, or null when there are too few to be a shape. */
export function inkBounds(rect: Rect, isInk: (x: number, y: number) => boolean, minPixels = 12): Rect | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (!isInk(x, y)) continue;
      count++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (count < minPixels) return null;
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Runs of consecutive indices in `[from, to)` where `on` holds, at least `minLength` long. */
export function runs(from: number, to: number, on: (i: number) => boolean, minLength = 1): [number, number][] {
  const found: [number, number][] = [];
  let start = -1;
  for (let i = from; i <= to; i++) {
    const active = i < to && on(i);
    if (active && start < 0) start = i;
    if (!active && start >= 0) {
      if (i - start >= minLength) found.push([start, i - 1]);
      start = -1;
    }
  }
  return found;
}
