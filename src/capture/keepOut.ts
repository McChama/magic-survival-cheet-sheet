import { REF_HEIGHT, REF_WIDTH, type Frame, type Rect } from "./frame";
import { OWNED_GRID } from "./geometry";
import { findOwnedCards, type Screen } from "./recognize";

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
 * Where the companion's own bubble (it is in the captured picture like everything else) must not sit on this
 * screen. **Only the Owned lists have such a place**: their cards are small, and a card under the bubble is not
 * read at all. Everywhere else the bubble stays exactly where the player put it — that was the player's explicit
 * call for the choice screens (a level-up, a chest): a bubble that moved every time one opened was worse than the
 * rare option it hides. The reading works around it instead: a level-up's rows are found from either edge, and the
 * bubble's own area is left out of the icon under it (`readSelectMagic`'s `mask`).
 */
export function readKeepOut(frame: Frame, screen: Screen): ScreenRect[] {
  if (screen !== "ownedMagic" && screen !== "ownedArtifact") return [];
  const g = OWNED_GRID;
  // Through one row past the last card found: a card the bubble covers isn't found at all.
  const lastBottom = findOwnedCards(frame).reduce((bottom, card) => Math.max(bottom, card.y + card.h), 0);
  const rowPitch = g.cardHeight * 1.03;
  const bottom = Math.min(g.scanBottom, Math.max(g.scanTop, (lastBottom * REF_HEIGHT) / frame.height) + rowPitch);
  return [fromRef({ x: g.firstCardX, y: g.scanTop, w: (g.columns - 1) * g.cardPitchX + g.cardWidth, h: bottom - g.scanTop })];
}

export function intersects(a: ScreenRect, b: ScreenRect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
