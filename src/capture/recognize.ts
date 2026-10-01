import { getMagicTalentGroups, TALENT_TYPE_COLOR } from "../data/magicTalents";
import { inkBounds, luma, maxPeak, peak, rgb, runs, scaleRect, scaleX, scaleY, type Frame, type Rect } from "./frame";
import { ALWAYS_UNLOCKED_SUBJECT, SUBJECTS } from "../data/classes";
import { RESEARCH } from "../data/research";
import {
  ATTRIBUTE,
  CHEST,
  CLASS_LINES,
  CLASS_NAME_BAND,
  OWNED_GRID,
  PAUSE_BARS,
  RESEARCH_GRID,
  SELECT_MAGIC,
  SUBJECT_GRID,
  SUBJECT_NAME_BAND,
  TITLE_BAND,
  type ScreenId,
} from "./geometry";
import { CLASS_NAME_SIGNATURES, SUBJECT_NAME_SIGNATURES } from "./nameSignatures";
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

/**
 * Most titles are light text on black. Two sit on the dimmed run instead, among glowing orbs and enemies, and are
 * told from it by their own color: Select Magic's cyan, and the red of "Life or Death".
 */
const TITLE_INK: Partial<Record<ScreenId, "cyan" | "red">> = { selectMagic: "cyan", lifeOrDeath: "red" };

function isTitleInk(screen: ScreenId, frame: Frame, x: number, y: number): boolean {
  const ink = TITLE_INK[screen];
  if (!ink) return peak(frame, x, y) > 150;
  const [r, g, b] = rgb(frame, x, y);
  return ink === "cyan" ? g > 190 && b > 160 && r < 170 : r > 170 && g < 90 && b < 90;
}

export function titleSignature(frame: Frame, screen: ScreenId): TitleSignature | null {
  return readText(scaleRect(frame, TITLE_BAND[screen]), (x, y) => isTitleInk(screen, frame, x, y))?.signature ?? null;
}

/**
 * The "Obtain" label at the bottom of the artifact-offer panel. The game uses that one panel
 * under five titles (Treasure Chest, Relic Chest, Black Chest, Obelisk, Broken Obelisk), so
 * the button is what identifies it, not the title. Gray while nothing is selected, white after.
 */
export function obtainSignature(frame: Frame): TitleSignature | null {
  return findObtain(frame)?.signature ?? null;
}

/** The "Obtain" label wherever it sits in its band (see `CHEST.obtainBand`): what it looks like, and where it is. */
function findObtain(frame: Frame): { signature: TitleSignature; box: Rect } | null {
  return readText(scaleRect(frame, CHEST.obtainBand), (x, y) => peak(frame, x, y) > 60);
}

/** The coarse bitmap of the text inside `band` (frame pixels) — also how `npm run capture:names` reduces a drawn name. */
export function textSignature(band: Rect, isInk: (x: number, y: number) => boolean): TitleSignature | null {
  return readText(band, isInk)?.signature ?? null;
}

/** A name drawn with the game font agrees with the same name on screen at ~0.85-0.90; the next-best name is ~0.70. */
const NAME_MATCH = 0.78;
const NAME_MARGIN = 0.05;

/** Which of `names` is written in `band`, or null when none is clearly it. */
function readName(frame: Frame, band: Rect, names: Record<string, TitleSignature>): string | null {
  const written = textSignature(scaleRect(frame, band), (x, y) => peak(frame, x, y) > 150);
  if (!written) return null;
  let best: string | null = null;
  let bestScore = 0;
  let runnerUp = 0;
  for (const [name, signature] of Object.entries(names)) {
    const score = signatureScore(written, signature);
    if (score > bestScore) {
      runnerUp = bestScore;
      bestScore = score;
      best = name;
    } else if (score > runnerUp) {
      runnerUp = score;
    }
  }
  return bestScore >= NAME_MATCH && bestScore - runnerUp >= NAME_MARGIN ? best : null;
}

/** The Class the Class menu shows as "Selected" (the caller has already seen that label: the screen is `classSelect`). */
export function readClassSelect(frame: Frame): string | null {
  return readName(frame, CLASS_NAME_BAND, CLASS_NAME_SIGNATURES);
}

/** The Subject the Test Subject menu shows as "Applying". */
export function readTestSubject(frame: Frame): string | null {
  return readName(frame, SUBJECT_NAME_BAND, SUBJECT_NAME_SIGNATURES);
}

/**
 * The selected Class's level, from its bonus lines: the four gated ones come last and the ones not reached yet are
 * gray, so the level is 5 minus the gray lines. Null when the block doesn't look like that (no line, or more gray
 * ones than there are bonuses). A bonus that wrapped onto two lines would count twice — none has been seen to.
 */
export function readClassLevel(frame: Frame): number | null {
  const area = scaleRect(frame, CLASS_LINES);
  const rowPeak = (y: number) => {
    let best = 0;
    for (let x = area.x; x < area.x + area.w; x++) best = Math.max(best, peak(frame, x, y));
    return best;
  };
  const lines = runs(area.y, area.y + area.h, (y) => rowPeak(y) > 60, 4);
  if (lines.length === 0) return null;
  const gray = lines.filter(([top, bottom]) => {
    let best = 0;
    for (let y = top; y <= bottom; y++) best = Math.max(best, rowPeak(y));
    return best < 150;
  }).length;
  return gray <= 4 ? 5 - gray : null;
}

/** Which Subjects the Test Subject menu draws as unlocked (in black). `mask`: the companion's bubble, dark too. */
export function readUnlockedSubjects(frame: Frame, mask?: Rect | null): string[] {
  const unlocked: string[] = [];
  let index = 0;
  for (const row of SUBJECT_GRID.rows) {
    for (const centerX of row.xs) {
      const name = SUBJECTS[index++];
      const box = scaleRect(frame, { x: centerX - SUBJECT_GRID.halfWidth, y: row.y - SUBJECT_GRID.halfHeight, w: SUBJECT_GRID.halfWidth * 2, h: SUBJECT_GRID.halfHeight * 2 });
      let dark = 0;
      let seen = 0;
      for (let y = box.y; y < box.y + box.h; y += 2) {
        for (let x = box.x; x < box.x + box.w; x += 2) {
          if (mask && x >= mask.x && x < mask.x + mask.w && y >= mask.y && y < mask.y + mask.h) continue;
          seen++;
          if (luma(frame, x, y) < 40) dark++;
        }
      }
      // A black figure fills about a fifth of its box; a gray one has no black at all.
      if (name && name !== ALWAYS_UNLOCKED_SUBJECT && seen > 0 && dark / seen > 0.05) unlocked.push(name);
    }
  }
  return unlocked;
}

/** Each Research node's level: the lit dots under it. */
export function readResearch(frame: Frame): Record<string, number> {
  const levels: Record<string, number> = {};
  let index = 0;
  for (const row of RESEARCH_GRID.rows) {
    for (const centerX of row.xs) {
      const node = RESEARCH[index++];
      if (!node) continue;
      const strip = scaleRect(frame, { x: centerX - RESEARCH_GRID.halfWidth, y: row.y - RESEARCH_GRID.halfHeight, w: RESEARCH_GRID.halfWidth * 2, h: RESEARCH_GRID.halfHeight * 2 });
      const lit = (x: number) => {
        for (let y = strip.y; y < strip.y + strip.h; y++) if (peak(frame, x, y) > 175) return true;
        return false;
      };
      const level = Math.min(node.maxLevel, runs(strip.x, strip.x + strip.w, lit, 2).length);
      if (level > 0) levels[node.id] = level;
    }
  }
  return levels;
}

/** The text inside `band`: its coarse bitmap, and the box it occupies. */
function readText(band: Rect, isInk: (x: number, y: number) => boolean): { signature: TitleSignature; box: Rect } | null {
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
  return { signature: { bits, aspect: box.w / box.h }, box };
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
    const key = `${band.x},${band.y},${band.w},${band.h},${TITLE_INK[screen] ?? "light"}`;
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
export function findOwnedCards(frame: Frame): Rect[] {
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
  return findOwnedCards(frame).map((card) => {
    const patch = extractPatch(frame, inset(card, 0.07, 0.06, 0.07, 0.27), false);
    const marks = readLevelMarks(frame, inset(card, 0.05, 0.75, 0.05, 0.09));
    // The class tile is the one card without a level row — which is also what tells a class icon from a
    // magic that shares its sprite (Cryomancer's is Frost Nova's).
    const candidates = marks.level === 0 ? classes : others;
    return { match: patch ? confident(bestMatch(patch, candidates)) : null, ...marks };
  });
}

export function readOwnedArtifacts(frame: Frame, library: Library): (Match | null)[] {
  return findOwnedCards(frame).map((card) => {
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
  // "Obtain" lights up white once a card is selected — wherever the label is on this panel.
  const obtain = findObtain(frame);
  if (obtain && maxPeak(frame, obtain.box) > 180) {
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

export interface SelectMagicReading {
  /** The magics/passives offered, top to bottom: two, three or four of them. */
  rows: SelectMagicRow[];
  /** The "Mana N% Retrieve" button's vertical extent in frame pixels; null when this level-up has none. */
  retrieve: { top: number; bottom: number } | null;
}

/** A row's black is pure black; the dimmed field behind it never quite is, even in a dark area full of enemies. */
const ROW_BLACK = 8;

/** Where the offered rows are (top and bottom, in frame pixels), top to bottom — without looking at what they offer. */
export function findSelectMagicRows(frame: Frame): [number, number][] {
  const g = SELECT_MAGIC;
  const left = g.probeXs.map((x) => scaleX(frame, x));
  const right = g.probeXsRight.map((x) => scaleX(frame, x));
  const rowHeight = scaleY(frame, g.rowHeight);
  const rowGap = scaleY(frame, g.rowGap);
  const isBlack = (x: number, y: number) => luma(frame, x, y) < ROW_BLACK;
  // Either edge is enough: the companion's bubble docks to one side of the screen and can sit on a row's end there.
  const inRow = (y: number) => left.every((x) => isBlack(x, y)) || right.every((x) => isBlack(x, y));
  const bands = runs(scaleY(frame, g.scanTop), scaleY(frame, g.scanBottom), inRow, Math.round(rowHeight * 0.6));

  // A row's top margin is black from edge to edge (its "Lv N" label and its name start lower):
  // that is what tells a row from a black enemy that happens to sit on the probe columns.
  const spansTheRow = (top: number, height: number) => {
    const y = top + Math.round(height * 0.06);
    let black = 0;
    for (let i = 0; i < 9; i++) if (isBlack(scaleX(frame, 150 + i * 100), y)) black++;
    return black >= 8;
  };

  const extents: [number, number][] = [];
  for (const [top, bottom] of bands) {
    // Rows whose gap the field left black come back as one tall band: split it back into rows.
    const count = Math.max(1, Math.round((bottom - top + 1 + rowGap) / (rowHeight + rowGap)));
    const height = (bottom - top + 1 - (count - 1) * rowGap) / count;
    for (let i = 0; i < count; i++) {
      const rowTop = Math.round(top + i * (height + rowGap));
      if (spansTheRow(rowTop, height)) extents.push([rowTop, Math.round(rowTop + height - 1)]);
    }
  }
  return extents;
}

/** `mask`: where the companion's own bubble is, in frame pixels — it is in the picture too, and must not be read as part of an icon. */
export function readSelectMagic(frame: Frame, library: Library, mask?: Rect | null): SelectMagicReading {
  const g = SELECT_MAGIC;
  const extents = findSelectMagicRows(frame);
  const offered = library.icons.filter((t) => t.kind !== "class");
  const left = scaleX(frame, g.iconLeft);
  const right = scaleX(frame, g.iconRight);
  const rows = extents.map(([top, bottom]) => {
    const height = bottom - top + 1;
    const patch = extractPatch(frame, { x: left, y: top + Math.round(height * 0.08), w: right - left, h: Math.round(height * 0.84) }, false, mask);
    return { match: patch ? confident(bestMatch(patch, offered)) : null, top, bottom };
  });
  return { rows, retrieve: rows.length ? findRetrieve(frame, rows[rows.length - 1].bottom) : null };
}

/**
 * The Retrieve button under the last row, found by its pale-blue label: one centered line of
 * text inside a black box. (The box alone can't be told from a dark field, and nothing else under
 * the rows is that color — the field's orbs are blue, magenta or orange.)
 */
function findRetrieve(frame: Frame, lastRowBottom: number): { top: number; bottom: number } | null {
  const g = SELECT_MAGIC;
  const left = scaleX(frame, g.retrieveLeft);
  const width = scaleX(frame, g.retrieveWidth);
  const isLabel = (x: number, y: number) => {
    const [r, green, b] = rgb(frame, x, y);
    return green > 170 && b > 170 && r > 120;
  };
  const box = inkBounds({ x: left, y: lastRowBottom + scaleY(frame, 20), w: width, h: scaleY(frame, g.retrieveReach) }, isLabel, 30);
  if (!box) return null;
  // One line of text, centered in the button, with the button's black on either side of it.
  const centerX = box.x + box.w / 2;
  const centerY = box.y + (box.h >> 1);
  const centered = Math.abs(centerX - (left + width / 2)) < width * 0.1;
  const oneLine = box.h < scaleY(frame, 70) && box.w > width * 0.3;
  const inBlack = luma(frame, left + scaleX(frame, 25), centerY) < ROW_BLACK && luma(frame, left + width - scaleX(frame, 25), centerY) < ROW_BLACK;
  if (!centered || !oneLine || !inBlack) return null;
  const half = scaleY(frame, g.retrieveHeight) / 2;
  return { top: Math.round(centerY - half), bottom: Math.round(centerY + half) };
}
