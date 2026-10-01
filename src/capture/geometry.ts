import type { Rect } from "./frame";

/**
 * Where things sit on the game's screens, in pixels of the reference screenshots
 * (1080 x 2460, `scripts/capture-fixtures/`) — measured, not guessed. `scaleRect` maps them
 * onto whatever size the live capture is.
 */

export type ScreenId =
  | "selectMagic"
  | "selectAttribute"
  | "treasureChest"
  | "pause"
  | "ownedMagic"
  | "ownedArtifact"
  | "synergy"
  | "enterArea"
  | "lifeOrDeath"
  | "classSelect"
  | "testSubject"
  | "research"
  | "enchant";

/** The band each screen's title is looked for in (generous: the title's own box is found inside it). */
export const TITLE_BAND: Record<ScreenId, Rect> = {
  // Tall: the title rides up with the rows (446 with two or three of them, 253 with four).
  selectMagic: { x: 250, y: 220, w: 580, h: 330 },
  selectAttribute: { x: 200, y: 200, w: 680, h: 130 },
  treasureChest: { x: 250, y: 360, w: 580, h: 110 },
  pause: { x: 380, y: 300, w: 320, h: 120 },
  ownedMagic: { x: 250, y: 160, w: 580, h: 130 },
  ownedArtifact: { x: 250, y: 160, w: 580, h: 130 },
  synergy: { x: 250, y: 160, w: 580, h: 130 },
  // Not titles, but what names these two: the area screen's title is the area's own name, so its "Enter Area"
  // button is what is looked for; the death prompt's "Life or Death" sits mid-screen, in red.
  enterArea: { x: 330, y: 2150, w: 420, h: 150 },
  lifeOrDeath: { x: 280, y: 1220, w: 520, h: 170 },
  // The two menus a run's Class and Subject are picked in, each known by the label that says "this is the one
  // in use": "Selected" under the Class (the same spot as "Enter Area"), "Applying" on the Subject's button.
  // Looking at any other class or subject shows a different label, so only the one in use is ever read.
  classSelect: { x: 330, y: 2150, w: 420, h: 150 },
  testSubject: { x: 330, y: 2280, w: 420, h: 120 },
  research: { x: 250, y: 190, w: 580, h: 140 },
  // Enchant's "Choose the Magic to strengthen": that title gives way to the selected magic's name, so the screen is
  // known by its button — "Selected" again, in the Class menu's spot, gray until a magic is picked. What is behind
  // it tells the two apart (`ENCHANT.backdrop`).
  enchant: { x: 330, y: 2150, w: 420, h: 150 },
};

/**
 * Enchant: the attack magics as dark tiles (17 of them, in rows of 4, 4, 4, 3, 2) on a dark brown backdrop, the
 * selected one drawn lighter. The tiles are found, not assumed — only their size is given — so a grid with fewer
 * of them reads the same.
 */
export const ENCHANT = {
  scanTop: 420,
  scanBottom: 2130,
  /** The span the tiles sit in, left to right. */
  left: 100,
  right: 980,
  tileWidth: 196,
  tileHeight: 285,
  rowGap: 32,
  /**
   * Points that are backdrop whatever the grid holds — along both edges, since the companion's bubble docks to
   * one. No other screen is that brown there: the Class menu, which shares the "Selected" label, is black.
   */
  backdrop: [
    [56, 700],
    [56, 1100],
    [56, 1500],
    [56, 1900],
    [56, 2380],
    [1030, 700],
    [1030, 1100],
    [1030, 1500],
    [1030, 1900],
    [1030, 2380],
  ] as [number, number][],
};

/**
 * Research: the 22 nodes sit in rows of 5, 5, 4, 4, 4 — the order of `RESEARCH` (`data/research.ts`), which the
 * pip counts on the real screen confirm node for node. Under each node, one dot per level it can reach, the
 * reached ones lit: `y` is that row of dots, `xs` the nodes' centers.
 */
export const RESEARCH_GRID = {
  rows: [
    { y: 795, xs: [172, 357, 541, 723, 908] },
    { y: 1102, xs: [172, 357, 541, 723, 908] },
    { y: 1410, xs: [237, 439, 640, 840] },
    { y: 1717, xs: [237, 439, 640, 840] },
    { y: 2025, xs: [237, 439, 640, 840] },
  ],
  halfWidth: 80,
  halfHeight: 22,
};

/**
 * Test Subject: the 25 subjects stand in rows of 4, 5, 4, 5, 4, 3 — the order of `SUBJECTS` (confirmed by the two
 * the player has unlocked, Archaeologist and Jack o' Lantern, standing where that order puts them). An unlocked one
 * is drawn in black, a locked one in gray: each entry is the center of a figure.
 */
export const SUBJECT_GRID = {
  rows: [
    { y: 406, xs: [234, 437, 642, 845] },
    { y: 670, xs: [133, 335, 539, 742, 945] },
    { y: 935, xs: [234, 437, 642, 845] },
    { y: 1199, xs: [133, 335, 539, 742, 945] },
    { y: 1470, xs: [234, 437, 642, 845] },
    { y: 1734, xs: [336, 539, 742] },
  ],
  halfWidth: 49,
  halfHeight: 74,
};

/** Class: the tooltip and the four bonus lines under the class's name, the ones not reached yet in gray. */
export const CLASS_LINES: Rect = { x: 100, y: 445, w: 880, h: 395 };

/** Where those two menus write the name of the Class / Subject being looked at. */
export const CLASS_NAME_BAND: Rect = { x: 200, y: 200, w: 680, h: 130 };
export const SUBJECT_NAME_BAND: Rect = { x: 150, y: 1930, w: 780, h: 120 };

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
  /**
   * Where the "Obtain" label is looked for. It is not always in the same place: an Obelisk adds a "Reroll" button
   * under it, which pushes it up (label at 1940-1973 there, 2016-2051 in a Treasure Chest). The band takes in both
   * and stops short of "Reroll" itself (2116-2153).
   */
  obtainBand: { x: 380, y: 1900, w: 320, h: 195 } as Rect,
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

/**
 * Select Magic: black rows on the dimmed field; the icon sits in each row's left part. The game
 * offers two, three or four rows and centers the block: every row is the same size, only how
 * many there are and where they start changes (measured on all three: rows from 919, 685 and
 * 493). The "Mana N% Retrieve" button follows the last row, and is missing with two (Arcanist).
 */
export const SELECT_MAGIC = {
  /** Columns just inside a row's left edge, left of the icon — black only where a row is. */
  probeXs: [64, 80, 96],
  /** The same at the right edge, right of the "Lv N" label: a row is found from either side, whichever the bubble isn't on. */
  probeXsRight: [984, 996, 1008],
  scanTop: 440,
  scanBottom: 2400,
  rowHeight: 384,
  rowGap: 43,
  /** The rows are centered on this line whatever their number. */
  centerY: 1316,
  iconLeft: 100,
  iconRight: 315,
  rowLeft: 53,
  rowRight: 1026,
  /** The Retrieve button: found by its label, which sits at its middle. */
  retrieveLeft: 250,
  retrieveWidth: 575,
  retrieveHeight: 122,
  /** How far under the last row the label is looked for. */
  retrieveReach: 300,
};
