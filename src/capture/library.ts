import { ARTIFACTS } from "../data/artifacts";
import { CLASSES } from "../data/classes";
import { BASE_MAGICS, baseMagicSpriteUrl } from "../data/magics";
import { PASSIVES } from "../data/passives";
import { classImage } from "../config/assets";
import { slug } from "../i18n/gameData";
import { inkBounds, peak, type Frame, type Rect } from "./frame";

/**
 * Recognizing an icon on screen = comparing it with every sprite the app already ships. Both
 * sides go through the same reduction (`extractPatch`): the tight box around the drawn pixels,
 * stretched onto a small fixed grid. That makes the comparison independent of where in its card
 * the game drew the icon, at what size and how squashed — only the picture itself counts.
 */

const GRID = 16;
/** A pixel brighter than this on a black card is part of the icon. */
const INK = 48;

/** An icon reduced to a comparable form: `GRID x GRID` cells (x3 for color), zero-mean and unit-length. */
export interface Patch {
  values: Float32Array;
}

export type TemplateKind = "magic" | "passive" | "class" | "artifact";

export interface Template {
  kind: TemplateKind;
  id: string;
  patch: Patch;
}

export interface Library {
  /** Base magics, passives and class icons — matched by shape (the game draws most of them flat white). */
  icons: Template[];
  /** Artifacts — matched in color. */
  artifacts: Template[];
}

export interface Match {
  kind: TemplateKind;
  id: string;
  /** 1 = identical, 0 = unrelated. */
  score: number;
  /** How far ahead of the next-best *different* item this match is — a small margin means a coin toss. */
  margin: number;
}

/** The icon inside `rect`, or null when the area is empty. `color` keeps the three channels apart. */
export function extractPatch(frame: Frame, rect: Rect, color: boolean): Patch | null {
  const box = inkBounds(rect, (x, y) => peak(frame, x, y) > INK);
  if (!box || box.w < 4 || box.h < 4) return null;

  const channels = color ? 3 : 1;
  const values = new Float32Array(GRID * GRID * channels);
  // The box is stretched to the grid on both axes: the game squashes an icon to fit its card
  // (an Owned Magic card shows it ~22% narrower than the sprite), so proportions can't be trusted.
  const cellW = box.w / GRID;
  const cellH = box.h / GRID;

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x0 = Math.floor(box.x + col * cellW);
      const y0 = Math.floor(box.y + row * cellH);
      const x1 = Math.max(x0 + 1, Math.ceil(box.x + (col + 1) * cellW));
      const y1 = Math.max(y0 + 1, Math.ceil(box.y + (row + 1) * cellH));
      const sum = [0, 0, 0];
      let count = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          count++;
          if (x >= box.x + box.w || y >= box.y + box.h) continue;
          if (color) {
            const i = (y * frame.width + x) * 4;
            sum[0] += frame.data[i];
            sum[1] += frame.data[i + 1];
            sum[2] += frame.data[i + 2];
          } else {
            sum[0] += peak(frame, x, y);
          }
        }
      }
      for (let c = 0; c < channels; c++) values[(row * GRID + col) * channels + c] = sum[c] / count;
    }
  }

  let mean = 0;
  for (const v of values) mean += v;
  mean /= values.length;
  let norm = 0;
  for (let i = 0; i < values.length; i++) {
    values[i] -= mean;
    norm += values[i] * values[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < values.length; i++) values[i] /= norm;

  return { values };
}

function similarity(a: Patch, b: Patch): number {
  if (a.values.length !== b.values.length) return -1;
  let dot = 0;
  for (let i = 0; i < a.values.length; i++) dot += a.values[i] * b.values[i];
  return dot;
}

/** The template closest to `patch`, with how clearly it won. */
export function bestMatch(patch: Patch, templates: Template[]): Match | null {
  let best: Template | null = null;
  let bestScore = -Infinity;
  for (const template of templates) {
    const score = similarity(patch, template.patch);
    if (score > bestScore) {
      bestScore = score;
      best = template;
    }
  }
  if (!best) return null;
  let runnerUp = -Infinity;
  for (const template of templates) {
    if (template.id === best.id && template.kind === best.kind) continue;
    runnerUp = Math.max(runnerUp, similarity(patch, template.patch));
  }
  return { kind: best.kind, id: best.id, score: bestScore, margin: bestScore - runnerUp };
}

/** A sprite as the game shows it on a black card: its own colors, or (`asMask`) flat white in its shape. */
function onBlack(sprite: Frame, asMask: boolean): Frame {
  const data = new Uint8ClampedArray(sprite.data.length);
  for (let i = 0; i < sprite.data.length; i += 4) {
    const alpha = sprite.data[i + 3];
    for (let c = 0; c < 3; c++) data[i + c] = asMask ? alpha : (sprite.data[i + c] * alpha) / 255;
    data[i + 3] = 255;
  }
  return { width: sprite.width, height: sprite.height, data };
}

function spritePatch(sprite: Frame, asMask: boolean, color: boolean): Patch | null {
  const flat = onBlack(sprite, asMask);
  return extractPatch(flat, { x: 0, y: 0, w: flat.width, h: flat.height }, color);
}

/**
 * Every sprite turned into a template. `loadSprite` decodes one image URL (a canvas in the
 * WebView, `sharp` in the Node check) — the only part that differs between the two.
 */
export async function buildLibrary(loadSprite: (url: string) => Promise<Frame | null>): Promise<Library> {
  const icons: Template[] = [];
  const artifacts: Template[] = [];

  async function add(list: Template[], kind: TemplateKind, id: string, url: string, variants: { asMask: boolean; color: boolean }[]) {
    const sprite = await loadSprite(url);
    if (!sprite) return;
    for (const variant of variants) {
      const patch = spritePatch(sprite, variant.asMask, variant.color);
      if (patch) list.push({ kind, id, patch });
    }
  }

  const white = [{ asMask: true, color: false }];
  // A special ability's card keeps the sprite's own colors, a leveled passive's is flat — both are tried.
  const whiteOrOwn = [...white, { asMask: false, color: false }];

  await Promise.all([
    // Intelligence is the passive, not a base magic (see CLAUDE.md's "+" menu section).
    ...BASE_MAGICS.filter((m) => m.id !== "intelligence").map((m) => add(icons, "magic", m.id, baseMagicSpriteUrl(m.id), white)),
    ...PASSIVES.map((p) => add(icons, "passive", p.id, p.image, whiteOrOwn)),
    ...CLASSES.map((name) => add(icons, "class", name, classImage(`${slug(name)}.png`), white)),
    ...ARTIFACTS.map((a) => add(artifacts, "artifact", a.id, a.image, [{ asMask: false, color: true }])),
  ]);
  return { icons, artifacts };
}
