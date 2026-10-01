import type { Rect } from "./frame";

/**
 * Where things sit on the game's screens, in pixels of the reference screenshots
 * (1080 x 2460, `scripts/capture-fixtures/`) — measured, not guessed. `scaleRect` maps them
 * onto whatever size the live capture is.
 */

export type ScreenId = "selectMagic" | "selectAttribute" | "treasureChest" | "pause" | "ownedMagic" | "ownedArtifact" | "synergy";

/** The band each screen's title is looked for in (generous: the title's own box is found inside it). */
export const TITLE_BAND: Record<ScreenId, Rect> = {
  selectMagic: { x: 250, y: 420, w: 580, h: 130 },
  selectAttribute: { x: 200, y: 200, w: 680, h: 130 },
  treasureChest: { x: 250, y: 360, w: 580, h: 110 },
  pause: { x: 380, y: 300, w: 320, h: 120 },
  ownedMagic: { x: 250, y: 160, w: 580, h: 130 },
  ownedArtifact: { x: 250, y: 160, w: 580, h: 130 },
  synergy: { x: 250, y: 160, w: 580, h: 130 },
};

/** The two white bars of the in-run pause button (top right) — lit only while the run itself is on screen. */
export const PAUSE_BARS: Rect[] = [
  { x: 996, y: 56, w: 8, h: 44 },
  { x: 1020, y: 56, w: 8, h: 44 },
];

/** Owned Magic / Owned Artifact: 6 cards per row on the gray panel. */
export const OWNED_GRID = {
  firstCardX: 122,
  cardPitchX: 140,
  cardWidth: 135,
  cardHeight: 256,
  columns: 6,
  /** Rows are found by scanning this span for bands of card-black. */
  scanTop: 385,
  scanBottom: 2270,
};

/** Treasure Chest: the row the offered cards sit in, and the "Obtain" label. */
export const CHEST = {
  cardTop: 686,
  cardBottom: 1080,
  cardWidth: 226,
  scanLeft: 100,
  scanRight: 980,
  obtainLabel: { x: 450, y: 2000, w: 180, h: 70 } as Rect,
  /** Where the "Obtain" label is looked for (generous, like a title band). */
  obtainBand: { x: 380, y: 1985, w: 320, h: 100 } as Rect,
};

/** Select Attribute: the three talent icons (top, bottom-left, bottom-right — the order the data lists them) and "Learn". */
export const ATTRIBUTE = {
  icons: [
    { x: 449, y: 541, w: 197, h: 256 },
    { x: 251, y: 899, w: 197, h: 256 },
    { x: 648, y: 899, w: 197, h: 256 },
  ] as Rect[],
  learnLabel: { x: 440, y: 2110, w: 200, h: 90 } as Rect,
};

/** Select Magic: black rows on the brown field; the icon sits in each row's left part. */
export const SELECT_MAGIC = {
  /** Columns just inside a row's left edge, left of the icon — black only where a row is. */
  probeXs: [64, 80, 96],
  scanTop: 600,
  scanBottom: 2000,
  rowHeight: 375,
  iconLeft: 100,
  iconRight: 315,
  /** A row's own left and right edges, and the "Mana N% Retrieve" button under the rows. */
  rowLeft: 53,
  rowRight: 1026,
  retrieve: { x: 250, y: 1995, w: 575, h: 122 } as Rect,
};
