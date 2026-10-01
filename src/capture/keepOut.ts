import { REF_HEIGHT, REF_WIDTH, type Frame, type Rect } from "./frame";
import { CHEST, OWNED_GRID, SELECT_MAGIC } from "./geometry";
import { findOwnedCards, findSelectMagicRows, type Screen } from "./recognize";

/** A rectangle as fractions of the screen (0-1), so it means the same on the capture and on the real display. */
export interface ScreenRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const round = (value: number) => Math.round(value * 1000) / 1000;

function fromRef(rect: Rect): ScreenRect {
  return { x: round(rect.x / REF_WIDTH), y: round(rect.y / REF_HEIGHT), w: round(rect.w / REF_WIDTH), h: round(rect.h / REF_HEIGHT) };
}

/**
 * The parts of this screen the reader actually looks at — where the companion's own bubble (it
 * is in the captured picture like everything else) must not sit. Everything outside is free:
 * a bubble over a Select Magic row's "Lv N" label, or anywhere on Pause, Synergy or Select
 * Attribute (its icons are in the middle, the bubble docks to an edge), hides nothing that is
 * read, so it has no reason to move.
 */
export function readKeepOut(frame: Frame, screen: Screen): ScreenRect[] {
  switch (screen) {
    case "ownedMagic":
    case "ownedArtifact": {
      const g = OWNED_GRID;
      // Through one row past the last card found: a card the bubble covers isn't found at all.
      const lastBottom = findOwnedCards(frame).reduce((bottom, card) => Math.max(bottom, card.y + card.h), 0);
      const rowPitch = g.cardHeight * 1.03;
      const bottom = Math.min(g.scanBottom, Math.max(g.scanTop, (lastBottom * REF_HEIGHT) / frame.height) + rowPitch);
      return [fromRef({ x: g.firstCardX, y: g.scanTop, w: (g.columns - 1) * g.cardPitchX + g.cardWidth, h: bottom - g.scanTop })];
    }
    case "treasureChest":
      return [fromRef({ x: CHEST.scanLeft, y: CHEST.cardTop, w: CHEST.scanRight - CHEST.scanLeft, h: CHEST.cardBottom - CHEST.cardTop })];
    case "selectMagic": {
      // A row's left end: the edge that marks it as a row, and its icon. The rows are centered, so if
      // the ones found sit lopsided there is another the bubble is hiding: the span is mirrored to cover it.
      const g = SELECT_MAGIC;
      const rows = findSelectMagicRows(frame).map(([top, bottom]) => [(top * REF_HEIGHT) / frame.height, (bottom * REF_HEIGHT) / frame.height]);
      const first = rows.length ? rows[0][0] : g.scanTop;
      const last = rows.length ? rows[rows.length - 1][1] : g.scanBottom;
      const top = Math.max(g.scanTop, Math.min(first, 2 * g.centerY - last));
      const bottom = Math.min(g.scanBottom, Math.max(last, 2 * g.centerY - first));
      return [fromRef({ x: g.rowLeft, y: top, w: g.iconRight - g.rowLeft, h: bottom - top })];
    }
    default:
      return [];
  }
}

export function intersects(a: ScreenRect, b: ScreenRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
