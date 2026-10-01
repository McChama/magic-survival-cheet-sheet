import { getMagicTalentGroups, TALENT_TYPE_COLOR } from "../data/magicTalents";
import { inkBounds, luma, maxPeak, peak, rgb, runs, scaleRect, scaleX, scaleY, type Frame, type Rect } from "./frame";
import { ATTRIBUTE, CHEST, OWNED_GRID, PAUSE_BARS, SELECT_MAGIC, TITLE_BAND, type ScreenId } from "./geometry";
import { bestMatch, extractPatch, type Library, type Match } from "./library";
import { OBTAIN_SIGNATURE, TITLE_SIGNATURES } from "./titleSignatures";

/** Which of the game's screens a frame shows. `gameplay` = the run itself, `unknown` = anything else (a transition, another app, our own panel). */
export type Screen = ScreenId | "gameplay" | "unknown";

// --- Screen detection -------------------------------------------------------------------------

const SIGNATURE_COLUMNS = 48;
const SIGNATURE_ROWS = 12;
/** Two titles are the same when this share of their cells agree. */
const SIGNATURE_MATCH = 0.86;

/** The "Obtain" label reads a little fatter once it lights up white; nothing else on any screen comes near (0.6 at most). */
const OBTAIN_MATCH = 0.8;

/** A title reduced to a coarse bitmap of its own bounding box, so it compares regardless of exact position and size. */
export interface TitleSignature {
  bits: string;
  aspect: number;
}

/** Select Magic's title is cyan on a field of glowing orbs — only its own color counts there. Every other title sits on black. */
function isTitleInk(screen: ScreenId, frame: Frame, x: number, y: number): boolean {
  if (screen !== "selectMagic") return peak(frame, x, y) > 150;
  const [r, g, b] = rgb(frame, x, y);
  return g > 190 && b > 160 && r < 170;
}

export function titleSignature(frame: Frame, screen: ScreenId): TitleSignature | null {
  return textSignature(scaleRect(frame, TITLE_BAND[screen]), (x, y) => isTitleInk(screen, frame, x, y));
}

/**
 * The "Obtain" label at the bottom of the artifact-offer panel. The game uses that one panel
 * under five titles (Treasure Chest, Relic Chest, Black Chest, Obelisk, Broken Obelisk), so
 * the button is what identifies it, not the title. Gray while nothing is selected, white after.
 */
export function obtainSignature(frame: Frame): TitleSignature | null {
  return textSignature(scaleRect(frame, CHEST.obtainBand), (x, y) => peak(frame, x, y) > 60);
}

function textSignature(band: Rect, isInk: (x: number, y: number) => boolean): TitleSignature | null {
  const box = inkBounds(band, isInk, 40);
  if (!box || box.h < 6 || box.w < box.h * 2) return null;

  let bits = "";
  for (let row = 0; row < SIGNATURE_ROWS; row++) {
    for (let col = 0; col < SIGNATURE_COLUMNS; col++) {
      const x0 = box.x + Math.floor((col * box.w) / SIGNATURE_COLUMNS);
      const x1 = Math.max(x0 + 1, box.x + Math.floor(((col + 1) * box.w) / SIGNATURE_COLUMNS));
      const y0 = box.y + Math.floor((row * box.h) / SIGNATURE_ROWS);
      const y1 = Math.max(y0 + 1, box.y + Math.floor(((row + 1) * box.h) / SIGNATURE_ROWS));
      let ink = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (isInk(x, y)) ink++;
      bits += ink / ((x1 - x0) * (y1 - y0)) > 0.3 ? "1" : "0";
    }
  }
  return { bits, aspect: box.w / box.h };
}

function signatureScore(a: TitleSignature, b: TitleSignature): number {
  if (Math.abs(Math.log(a.aspect / b.aspect)) > 0.18) return 0;
  let same = 0;
  for (let i = 0; i < a.bits.length; i++) if (a.bits[i] === b.bits[i]) same++;
  return same / a.bits.length;
}

function isGameplay(frame: Frame): boolean {
  for (const bar of PAUSE_BARS) {
    const r = scaleRect(frame, bar);
    if (peak(frame, r.x + (r.w >> 1), r.y + (r.h >> 1)) < 190) return false;
  }
  // The gap between the bars is the HUD's brown, not more white.
  const gap = scaleRect(frame, { x: 1010, y: 70, w: 4, h: 16 });
  return peak(frame, gap.x, gap.y) < 170;
}

export function classifyScreen(frame: Frame): Screen {
  if (isGameplay(frame)) return "gameplay";
  let best: Screen = "unknown";
  let bestScore = SIGNATURE_MATCH;
  const cache = new Map<string, TitleSignature | null>();
  for (const screen of Object.keys(TITLE_SIGNATURES) as ScreenId[]) {
    // Screens sharing a band and an ink rule (the three "Owned"/Synergy titles) are measured once.
    const band = TITLE_BAND[screen];
    const key = `${band.x},${band.y},${band.w},${band.h},${screen === "selectMagic"}`;
    if (!cache.has(key)) cache.set(key, titleSignature(frame, screen));
    const signature = cache.get(key);
    if (!signature) continue;
    const score = signatureScore(signature, TITLE_SIGNATURES[screen]);
    if (score > bestScore) {
      bestScore = score;
      best = screen;
    }
  }
  if (best === "unknown") {
    const obtain = obtainSignature(frame);
    if (obtain && signatureScore(obtain, OBTAIN_SIGNATURE) > OBTAIN_MATCH) return "treasureChest";
  }
  return best;
}

// --- Matching thresholds ----------------------------------------------------------------------

/** Below this an icon isn't recognized at all; the margin rejects a near-tie between two look-alikes. */
const MIN_SCORE = 0.75;
const MIN_MARGIN = 0.08;

function confident(match: Match | null): Match | null {
  return match && match.score >= MIN_SCORE && match.margin >= MIN_MARGIN ? match : null;
}

function inset(rect: Rect, left: number, top: number, right: number, bottom: number): Rect {
  const x = rect.x + Math.round(rect.w * left);
  const y = rect.y + Math.round(rect.h * top);
  return { x, y, w: Math.max(1, rect.x + Math.round(rect.w * (1 - right)) - x), h: Math.max(1, rect.y + Math.round(rect.h * (1 - bottom)) - y) };
}

// --- Owned Magic / Owned Artifact -------------------------------------------------------------

/** The card rectangles of an owned grid that actually hold a card, in reading order. */
function ownedCards(frame: Frame): Rect[] {
  const g = OWNED_GRID;
  const slots = Array.from({ length: g.columns }, (_, c) => ({
    x: scaleX(frame, g.firstCardX + c * g.cardPitchX),
    w: scaleX(frame, g.cardWidth),
  }));
  // Near a card's left and right edges, clear of its centered icon: black there means "a card", gray means "panel".
  const probes = slots.map((s) => [s.x + Math.round(s.w * 0.1), s.x + Math.round(s.w * 0.9)]);
  const isCardBlack = (x: number, y: number) => luma(frame, x, y) < 16;

  const cardHeight = scaleY(frame, g.cardHeight);
  const bands = runs(
    scaleY(frame, g.scanTop),
    scaleY(frame, g.scanBottom),
    (y) => probes.some(([a, b]) => isCardBlack(a, y) && isCardBlack(b, y)),
    Math.round(cardHeight * 0.7)
  );

  const cards: Rect[] = [];
  for (const [top, bottom] of bands) {
    // Rows whose gap vanished at this resolution come back as one tall band: split it back into rows.
    const rowCount = Math.max(1, Math.round((bottom - top + 1) / cardHeight));
    const rowHeight = (bottom - top + 1) / rowCount;
    for (let row = 0; row < rowCount; row++) {
      const y = Math.round(top + row * rowHeight);
      const h = Math.round(rowHeight);
      slots.forEach((slot, c) => {
        let dark = 0;
        for (let i = 1; i <= 5; i++) {
          const sampleY = y + Math.round((h * i) / 6);
          if (isCardBlack(probes[c][0], sampleY)) dark++;
          if (isCardBlack(probes[c][1], sampleY)) dark++;
        }
        if (dark >= 8) cards.push({ x: slot.x, y, w: slot.w, h });
      });
    }
  }
  return cards;
}

/** The level row under a magic's icon: one bright dot per level reached (the hollow ones are dim), or a single star for a special. */
function readLevelMarks(frame: Frame, strip: Rect): { level: number; special: boolean } {
  const columnPeak = (x: number) => {
    let best = 0;
    for (let y = strip.y; y < strip.y + strip.h; y++) best = Math.max(best, peak(frame, x, y));
    return best;
  };
  const dots = runs(strip.x, strip.x + strip.w, (x) => columnPeak(x) > 170, 2);
  if (dots.length === 1) {
    // A special's star: one mark, red, where a leveled magic's dots are yellow or green.
    const [from, to] = dots[0];
    const mid = (from + to) >> 1;
    for (let y = strip.y; y < strip.y + strip.h; y++) {
      const [r, g] = rgb(frame, mid, y);
      if (r > 190 && g < 130) return { level: 1, special: true };
    }
  }
  return { level: dots.length, special: false };
}

export interface OwnedMagicEntry {
  match: Match | null;
  /** Filled level dots (1 for a special). 0 when the card has no level row — the class tile. */
  level: number;
  special: boolean;
}

export function readOwnedMagic(frame: Frame, library: Library): OwnedMagicEntry[] {
  const classes = library.icons.filter((t) => t.kind === "class");
  const others = library.icons.filter((t) => t.kind !== "class");
  return ownedCards(frame).map((card) => {
    const patch = extractPatch(frame, inset(card, 0.07, 0.06, 0.07, 0.27), false);
    const marks = readLevelMarks(frame, inset(card, 0.05, 0.75, 0.05, 0.09));
    // The class tile is the one card without a level row — which is also what tells a class icon from a
    // magic that shares its sprite (Cryomancer's is Frost Nova's).
    const candidates = marks.level === 0 ? classes : others;
    return { match: patch ? confident(bestMatch(patch, candidates)) : null, ...marks };
  });
}

export function readOwnedArtifacts(frame: Frame, library: Library): (Match | null)[] {
  return ownedCards(frame).map((card) => {
    const patch = extractPatch(frame, inset(card, 0.07, 0.05, 0.07, 0.05), true);
    return patch ? confident(bestMatch(patch, library.artifacts)) : null;
  });
}

// --- Treasure Chest ---------------------------------------------------------------------------

export interface TreasureChestReading {
  offers: (Match | null)[];
  /** The card with the white "selected" border, once "Obtain" is lit. */
  selected: number | null;
}

export function readTreasureChest(frame: Frame, library: Library): TreasureChestReading {
  const top = scaleY(frame, CHEST.cardTop + 30);
  const bottom = scaleY(frame, CHEST.cardBottom - 30);
  const samples = 24;
  // A card's side border is the only thing lit along (nearly) the whole height of the card row.
  const isBorderColumn = (x: number) => {
    let lit = 0;
    for (let i = 0; i < samples; i++) if (peak(frame, x, top + Math.round(((bottom - top) * i) / (samples - 1))) > 45) lit++;
    return lit >= samples * 0.85;
  };
  const lines = runs(scaleX(frame, CHEST.scanLeft), scaleX(frame, CHEST.scanRight), isBorderColumn);
  const cardWidth = scaleX(frame, CHEST.cardWidth);

  const cards: { rect: Rect; whiteness: number }[] = [];
  for (let i = 0; i + 1 < lines.length; i++) {
    const left = lines[i];
    const right = lines[i + 1];
    const width = right[0] - left[1];
    // Treasure Chest's three cards are the measured width; a fuller panel (a Broken Obelisk's four) may draw them narrower.
    if (width > cardWidth * 1.1 || width < cardWidth * 0.6) continue;
    // White (selected) vs a rarity color: the dimmest channel of the border's brightest pixel, typical over its height.
    const mins: number[] = [];
    for (let s = 0; s < samples; s++) {
      const y = top + Math.round(((bottom - top) * s) / (samples - 1));
      let brightest = 0;
      let dimmestChannel = 0;
      for (let x = left[0]; x <= left[1]; x++) {
        const [r, g, b] = rgb(frame, x, y);
        if (Math.max(r, g, b) > brightest) {
          brightest = Math.max(r, g, b);
          dimmestChannel = Math.min(r, g, b);
        }
      }
      mins.push(dimmestChannel);
    }
    mins.sort((a, b) => a - b);
    cards.push({
      rect: { x: left[1] + 1, y: scaleY(frame, CHEST.cardTop), w: width, h: scaleY(frame, CHEST.cardBottom) - scaleY(frame, CHEST.cardTop) },
      whiteness: mins[mins.length >> 1],
    });
    i++; // this pair is consumed: the next card starts at the following line
  }

  const offers = cards.map(({ rect }) => {
    const patch = extractPatch(frame, inset(rect, 0.06, 0.04, 0.06, 0.04), true);
    return patch ? confident(bestMatch(patch, library.artifacts)) : null;
  });

  let selected: number | null = null;
  if (maxPeak(frame, scaleRect(frame, CHEST.obtainLabel)) > 180) {
    let best = 140;
    cards.forEach((card, i) => {
      if (card.whiteness > best) {
        best = card.whiteness;
        selected = i;
      }
    });
  }
  return { offers, selected };
}

// --- Select Attribute -------------------------------------------------------------------------

export interface SelectAttributeReading {
  magicId: string | null;
  /** The level this talent group belongs to (Magic Bolt has two groups). */
  groupLevel: number | null;
  /** The group's talent names in screen order: top, bottom-left, bottom-right. */
  talents: string[];
  /** The icon turned white, once "Learn" is lit. */
  selected: number | null;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The typical color of an icon's drawn pixels. */
function inkColor(frame: Frame, rect: Rect): [number, number, number] | null {
  const sum = [0, 0, 0];
  let count = 0;
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      if (peak(frame, x, y) < 150) continue;
      const [r, g, b] = rgb(frame, x, y);
      sum[0] += r;
      sum[1] += g;
      sum[2] += b;
      count++;
    }
  }
  return count < 20 ? null : [sum[0] / count, sum[1] / count, sum[2] / count];
}

export function readSelectAttribute(frame: Frame, library: Library): SelectAttributeReading {
  const rects = ATTRIBUTE.icons.map((r) => scaleRect(frame, r));
  const magics = library.icons.filter((t) => t.kind === "magic");

  // All three icons are the same magic's sprite: the clearest of them names it.
  let magic: Match | null = null;
  for (const rect of rects) {
    const patch = extractPatch(frame, rect, false);
    const match = patch ? confident(bestMatch(patch, magics)) : null;
    if (match && (!magic || match.score > magic.score)) magic = match;
  }

  const colors = rects.map((rect) => inkColor(frame, rect));
  const isWhite = (c: [number, number, number] | null) => !!c && Math.min(...c) > 200 && Math.min(...c) / Math.max(...c) > 0.9;

  let selected: number | null = null;
  if (maxPeak(frame, scaleRect(frame, ATTRIBUTE.learnLabel)) > 180) {
    const white = colors.map(isWhite);
    if (white.filter(Boolean).length === 1) selected = white.indexOf(true);
  }

  if (!magic) return { magicId: null, groupLevel: null, talents: [], selected };

  // The group on screen is the one whose talent-type tints fit the icons that are still colored.
  const groups = getMagicTalentGroups(magic.id).filter((group) => group.talents.length === rects.length);
  let bestGroup = groups[0];
  let bestDistance = Infinity;
  for (const group of groups) {
    let distance = 0;
    group.talents.forEach((talent, i) => {
      const color = colors[i];
      if (!color || isWhite(color)) return;
      const tint = hexToRgb(TALENT_TYPE_COLOR[talent.type]);
      distance += Math.hypot(color[0] - tint[0], color[1] - tint[1], color[2] - tint[2]);
    });
    if (distance < bestDistance) {
      bestDistance = distance;
      bestGroup = group;
    }
  }
  return {
    magicId: magic.id,
    groupLevel: bestGroup?.level ?? null,
    talents: bestGroup?.talents.map((t) => t.name) ?? [],
    selected,
  };
}

// --- Select Magic -----------------------------------------------------------------------------

export interface SelectMagicRow {
  /** null = a row whose icon wasn't recognized. */
  match: Match | null;
  /** The row's vertical extent in frame pixels. */
  top: number;
  bottom: number;
}

/** The magics/passives a level-up offers, top to bottom. */
export function readSelectMagic(frame: Frame, library: Library): SelectMagicRow[] {
  const probes = SELECT_MAGIC.probeXs.map((x) => scaleX(frame, x));
  const rowHeight = scaleY(frame, SELECT_MAGIC.rowHeight);
  const rows = runs(
    scaleY(frame, SELECT_MAGIC.scanTop),
    scaleY(frame, SELECT_MAGIC.scanBottom),
    (y) => probes.every((x) => luma(frame, x, y) < 14),
    Math.round(rowHeight * 0.6)
  );
  const offered = library.icons.filter((t) => t.kind !== "class");
  const left = scaleX(frame, SELECT_MAGIC.iconLeft);
  const right = scaleX(frame, SELECT_MAGIC.iconRight);
  return rows.map(([top, bottom]) => {
    const height = bottom - top + 1;
    const patch = extractPatch(frame, { x: left, y: top + Math.round(height * 0.08), w: right - left, h: Math.round(height * 0.84) }, false);
    return { match: patch ? confident(bestMatch(patch, offered)) : null, top, bottom };
  });
}
